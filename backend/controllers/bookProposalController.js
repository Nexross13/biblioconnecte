const fs = require('fs');
const path = require('path');
const bookProposalModel = require('../models/bookProposalModel');
const {
  getBookProposals: getMockBookProposals,
  getBookProposalsForUser: getMockBookProposalsForUser,
  getBookProposalById: getMockBookProposalById,
  createBookProposal: createMockBookProposal,
  approveBookProposal: approveMockBookProposal,
  rejectBookProposal: rejectMockBookProposal,
  getUserById: getMockUserById,
} = require('../data/mockData');

const fsPromises = fs.promises;
const { PROPOSAL_COVER_DIR, PROPOSAL_COVER_RELATIVE_DIR } = bookProposalModel;
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const normalizeStringArray = (value) => {
  if (!value) {
    return [];
  }
  const array = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];
  const normalized = array
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length);
  return Array.from(new Set(normalized));
};

const decodeBase64Image = (dataString) => {
  if (typeof dataString !== 'string' || !dataString.length) {
    throw new Error('Invalid cover image payload');
  }

  let mimeType;
  let base64Data;

  const dataUrlMatch = dataString.match(/^data:(.+);base64,(.+)$/);
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  } else {
    mimeType = 'image/jpeg';
    base64Data = dataString;
  }

  const extension = MIME_EXTENSION_MAP[mimeType];
  if (!extension) {
    const error = new Error('Unsupported cover image format');
    error.status = 400;
    throw error;
  }

  return {
    buffer: Buffer.from(base64Data, 'base64'),
    extension,
  };
};

const saveCoverImage = async (base64) => {
  if (!base64) {
    return null;
  }
  await fsPromises.mkdir(PROPOSAL_COVER_DIR, { recursive: true });
  const { buffer, extension } = decodeBase64Image(base64);
  const fileName = `proposal-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const filePath = path.join(PROPOSAL_COVER_DIR, fileName);
  await fsPromises.writeFile(filePath, buffer);
  return path.join(PROPOSAL_COVER_RELATIVE_DIR, fileName).replace(/\\/g, '/');
};

const parsePagination = (req) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  return { limit, offset };
};

const normalizeStatusFilter = (value) => {
  if (!value) {
    return undefined;
  }
  const allowed = ['pending', 'approved', 'rejected'];
  const normalized = String(value).toLowerCase();
  return allowed.includes(normalized) ? normalized : undefined;
};

const mapMockUserSummary = (user) =>
  user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    : null;

const mapMockProposal = (proposal) => {
  if (!proposal) {
    return null;
  }
  const submittedUser = getMockUserById(proposal.submittedBy);
  const decidedUser = proposal.decidedBy ? getMockUserById(proposal.decidedBy) : null;
  return {
    id: proposal.id,
    title: proposal.title,
    isbn: proposal.isbn,
    edition: proposal.edition,
    volume: proposal.volume,
    summary: proposal.summary,
    status: proposal.status,
    submittedAt: proposal.submittedAt,
    updatedAt: proposal.updatedAt,
    decidedAt: proposal.decidedAt || null,
    rejectionReason: proposal.rejectionReason || null,
    authorNames: proposal.authorNames || [],
    genreNames: proposal.genreNames || [],
    coverImagePath: proposal.coverImagePath || null,
    submittedBy: mapMockUserSummary(submittedUser) || { id: Number(proposal.submittedBy) },
    decidedBy: decidedUser
      ? mapMockUserSummary(decidedUser)
      : proposal.decidedBy
      ? { id: Number(proposal.decidedBy) }
      : null,
  };
};

const createProposal = async (req, res, next) => {
  try {
    const { title, isbn, edition, volume, summary } = req.body;
    if (!title) {
      const err = new Error('Title is required');
      err.status = 400;
      throw err;
    }
    if (!req.user || !req.user.id) {
      const err = new Error('Authenticated user required');
      err.status = 401;
      throw err;
    }
    const submittedBy = Number(req.user.id);
    if (!Number.isInteger(submittedBy)) {
      const err = new Error('Authenticated user required');
      err.status = 401;
      throw err;
    }

    const authorNames = normalizeStringArray(req.body.authorNames || req.body.authors);
    const genreNames = normalizeStringArray(req.body.genreNames || req.body.genres);
    const coverImageBase64 = typeof req.body.coverImage === 'string' ? req.body.coverImage : null;
    let savedCoverPath = null;
    if (process.env.USE_MOCKS !== 'true') {
      try {
        if (coverImageBase64) {
          savedCoverPath = await saveCoverImage(coverImageBase64);
        }
      } catch (imageError) {
        imageError.status = imageError.status || 400;
        throw imageError;
      }
    }

    if (process.env.USE_MOCKS === 'true') {
      const proposal = createMockBookProposal({
        title,
        isbn,
        edition,
        volume,
        summary,
        submittedBy,
        authorNames,
        genreNames,
        coverImagePath: savedCoverPath,
      });
      return res.status(202).json({
        message: 'Livre envoyé pour validation par un administrateur',
        proposal: mapMockProposal(proposal),
      });
    }

    try {
      const proposal = await bookProposalModel.createProposal({
        title,
        isbn,
        edition,
        volume,
        summary,
        submittedBy,
        authorNames,
        genreNames,
        coverImagePath: savedCoverPath,
      });

      res.status(202).json({
        message: 'Livre envoyé pour validation par un administrateur',
        proposal,
      });
    } catch (error) {
      if (savedCoverPath) {
        try {
          const relativePath = savedCoverPath.replace(/^\//, '');
          await fsPromises.unlink(path.join(__dirname, '..', relativePath));
        } catch (unlinkError) {
          // ignore cleanup error
        }
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const listProposals = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      const err = new Error('Administrator privileges required');
      err.status = 403;
      throw err;
    }

    const { limit, offset } = parsePagination(req);
    const status = normalizeStatusFilter(req.query.status);

    if (process.env.USE_MOCKS === 'true') {
      const proposals = getMockBookProposals({ status });
      const paginated = proposals.slice(offset, offset + limit).map(mapMockProposal);
      return res.json({
        proposals: paginated,
        pagination: { limit, offset, count: paginated.length },
      });
    }

    const proposals = await bookProposalModel.listProposals({ status, limit, offset });
    res.json({
      proposals,
      pagination: { limit, offset, count: proposals.length },
    });
  } catch (error) {
    next(error);
  }
};

const listMyProposals = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      const err = new Error('Authenticated user required');
      err.status = 401;
      throw err;
    }

    const userId = Number(req.user.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Authenticated user required');
      err.status = 401;
      throw err;
    }

    const { limit, offset } = parsePagination(req);

    if (process.env.USE_MOCKS === 'true') {
      const proposals = getMockBookProposalsForUser(userId);
      const paginated = proposals.slice(offset, offset + limit).map(mapMockProposal);
      return res.json({
        proposals: paginated,
        pagination: { limit, offset, count: paginated.length },
      });
    }

    const proposals = await bookProposalModel.listProposalsForUser({
      userId,
      limit,
      offset,
    });

    res.json({
      proposals,
      pagination: { limit, offset, count: proposals.length },
    });
  } catch (error) {
    next(error);
  }
};

const ensureAccess = (req, proposal) => {
  if (!proposal) {
    const err = new Error('Book proposal not found');
    err.status = 404;
    throw err;
  }

  const submittedById =
    (proposal.submittedBy && proposal.submittedBy.id) || proposal.submittedBy || null;

  if (!req.user?.isAdmin && Number(req.user?.id) !== Number(submittedById)) {
    const err = new Error('You are not allowed to access this proposal');
    err.status = 403;
    throw err;
  }
};

const getProposalById = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const proposal = mapMockProposal(getMockBookProposalById(req.params.id));
      ensureAccess(req, proposal);
      return res.json({
        proposal,
      });
    }

    const proposal = await bookProposalModel.findById(req.params.id);
    ensureAccess(req, proposal);
    res.json({ proposal });
  } catch (error) {
    next(error);
  }
};

const approveProposal = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      const err = new Error('Administrator privileges required');
      err.status = 403;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      const decision = approveMockBookProposal({
        id: req.params.id,
        decidedBy: req.user.id,
      });
      if (!decision) {
        const err = new Error('Book proposal not found');
        err.status = 404;
        throw err;
      }
      return res.json({
        proposal: mapMockProposal(decision.proposal),
        book: decision.book,
      });
    }

    const decision = await bookProposalModel.approveProposal(req.params.id, {
      decidedBy: req.user.id,
    });
    if (!decision) {
      const err = new Error('Book proposal not found');
      err.status = 404;
      throw err;
    }

    res.json(decision);
  } catch (error) {
    next(error);
  }
};

const rejectProposal = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      const err = new Error('Administrator privileges required');
      err.status = 403;
      throw err;
    }

    const reason =
      typeof req.body?.reason === 'string' && req.body.reason.trim().length
        ? req.body.reason.trim()
        : null;

    if (process.env.USE_MOCKS === 'true') {
      const proposal = rejectMockBookProposal({
        id: req.params.id,
        decidedBy: req.user.id,
        reason,
      });
      if (!proposal) {
        const err = new Error('Book proposal not found or already decided');
        err.status = 404;
        throw err;
      }
      return res.json({
        proposal: mapMockProposal(proposal),
      });
    }

    const proposal = await bookProposalModel.rejectProposal(req.params.id, {
      decidedBy: req.user.id,
      reason,
    });
    if (!proposal) {
      const err = new Error('Book proposal not found or already decided');
      err.status = 404;
      throw err;
    }

    res.json({ proposal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProposal,
  listProposals,
  listMyProposals,
  getProposalById,
  approveProposal,
  rejectProposal,
};
