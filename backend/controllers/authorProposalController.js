const authorProposalModel = require('../models/authorProposalModel');
const userModel = require('../models/userModel');
const {
  getAuthorProposals: getMockAuthorProposals,
  getAuthorProposalById: getMockAuthorProposalById,
  createAuthorProposal: createMockAuthorProposal,
  approveAuthorProposal: approveMockAuthorProposal,
  rejectAuthorProposal: rejectMockAuthorProposal,
  getUserById: getMockUserById,
  getAuthors: getMockAuthors,
} = require('../data/mockData');
const { PRIMARY_FRONTEND_ORIGIN } = require('../config/frontend');
const { sendAuthorProposalDecisionNotification } = require('../services/emailService');

const FRONTEND_BASE = PRIMARY_FRONTEND_ORIGIN.replace(/\/$/, '');

const parsePagination = (req) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  return { limit, offset };
};

const normalizeStatusFilter = (value) => {
  if (!value) {
    return undefined;
  }
  const normalized = String(value).toLowerCase();
  return ['pending', 'approved', 'rejected'].includes(normalized) ? normalized : undefined;
};

const mapMockUser = (user) =>
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
  const submittedUser = proposal.submittedBy ? getMockUserById(proposal.submittedBy) : null;
  const decidedUser = proposal.decidedBy ? getMockUserById(proposal.decidedBy) : null;
  return {
    id: proposal.id,
    firstName: proposal.firstName,
    lastName: proposal.lastName,
    biography: proposal.biography,
    status: proposal.status,
    submittedAt: proposal.submittedAt,
    decidedAt: proposal.decidedAt || null,
    rejectionReason: proposal.rejectionReason || null,
    submittedBy: mapMockUser(submittedUser) || (proposal.submittedBy ? { id: Number(proposal.submittedBy) } : null),
    decidedBy: mapMockUser(decidedUser),
  };
};

const mapMockAuthor = (author) =>
  author
    ? {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        biography: author.biography,
      }
    : null;

const normalizeNameInput = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findMockAuthorConflict = ({ firstName, lastName }) => {
  const normalizedFirst = normalizeNameInput(firstName);
  const normalizedLast = normalizeNameInput(lastName);

  const existingAuthor = getMockAuthors().find((author) => {
    if (!author) {
      return false;
    }
    const authorFirst = normalizeNameInput(author.firstName);
    const authorLast = normalizeNameInput(author.lastName);
    return normalizedFirst === authorFirst && normalizedLast === authorLast;
  });
  if (existingAuthor) {
    return { author: { id: existingAuthor.id, firstName: existingAuthor.firstName, lastName: existingAuthor.lastName } };
  }

  const proposals = getMockAuthorProposals({});
  const existingProposal = proposals.find((proposal) => {
    if (!proposal || proposal.status === 'rejected') {
      return false;
    }
    const proposalFirst = normalizeNameInput(proposal.firstName);
    const proposalLast = normalizeNameInput(proposal.lastName);
    return normalizedFirst === proposalFirst && normalizedLast === proposalLast;
  });

  if (existingProposal) {
    return {
      proposal: {
        id: existingProposal.id,
        status: existingProposal.status,
        firstName: existingProposal.firstName,
        lastName: existingProposal.lastName,
      },
    };
  }

  return null;
};

const createProposal = async (req, res, next) => {
  try {
    const { firstName, lastName, biography } = req.body || {};
    const sanitizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const sanitizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    if (!sanitizedFirstName || !sanitizedLastName) {
      const err = new Error('firstName and lastName are required');
      err.status = 400;
      throw err;
    }

    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Authenticated user required');
      err.status = 401;
      throw err;
    }

    const useMocks = process.env.USE_MOCKS === 'true';
    let runtimeCanBypass = Boolean(req.user?.canBypassAuthorProposals);

    if (!useMocks) {
      const loadedUser = await userModel.findById(userId);
      runtimeCanBypass = Boolean(loadedUser?.canBypassAuthorProposals);
      req.user.canBypassAuthorProposals = runtimeCanBypass;
    }

    const conflict = useMocks
      ? findMockAuthorConflict({ firstName: sanitizedFirstName, lastName: sanitizedLastName })
      : await authorProposalModel.findExistingMatch({
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
        });

    if (conflict?.author) {
      const err = new Error(
        `Cet auteur est déjà présent dans le catalogue (${conflict.author.firstName} ${conflict.author.lastName})`,
      );
      err.status = 409;
      throw err;
    }
    if (conflict?.proposal) {
      const statusLabel =
        conflict.proposal.status === 'approved'
          ? 'déjà validée'
          : conflict.proposal.status === 'pending'
          ? 'déjà en cours de validation'
          : 'déjà soumise';
      const err = new Error(
        `Une proposition ${statusLabel} existe déjà pour ${conflict.proposal.firstName} ${conflict.proposal.lastName}`,
      );
      err.status = 409;
      throw err;
    }

    if (useMocks) {
      const proposal = createMockAuthorProposal({
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        biography: biography ? String(biography).trim() : '',
        submittedBy: userId,
      });
      if (runtimeCanBypass) {
        const decision = approveMockAuthorProposal({ id: proposal.id, decidedBy: userId });
        return res.status(201).json({
          message: 'Auteur validé automatiquement et ajouté au catalogue',
          proposal: mapMockProposal(decision.proposal),
          author: mapMockAuthor(decision.author),
        });
      }
      return res.status(202).json({
        message: 'Auteur envoyé pour validation par un administrateur',
        proposal: mapMockProposal(proposal),
      });
    }

    const proposal = await authorProposalModel.createProposal({
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      biography: biography ? String(biography).trim() : null,
      submittedBy: userId,
    });

    if (runtimeCanBypass) {
      const decision = await authorProposalModel.approveProposal(proposal.id, {
        decidedBy: userId,
      });
      return res.status(201).json({
        message: 'Auteur validé automatiquement et ajouté au catalogue',
        proposal: decision.proposal,
        author: decision.author,
      });
    }

    res.status(202).json({
      message: 'Auteur envoyé pour validation par un administrateur',
      proposal,
    });
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
    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const proposals = getMockAuthorProposals({ status }).map(mapMockProposal);
      const paginated = proposals.slice(offset, offset + limit);
      return res.json({
        proposals: paginated,
        pagination: { limit, offset, count: paginated.length },
      });
    }

    const proposals = await authorProposalModel.listProposals({ status, limit, offset });
    res.json({
      proposals,
      pagination: { limit, offset, count: proposals.length },
    });
  } catch (error) {
    next(error);
  }
};

const getProposalById = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      const err = new Error('Administrator privileges required');
      err.status = 403;
      throw err;
    }

    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const proposal = mapMockProposal(getMockAuthorProposalById(req.params.id));
      if (!proposal) {
        const err = new Error('Author proposal not found');
        err.status = 404;
        throw err;
      }
      return res.json({ proposal });
    }

    const proposal = await authorProposalModel.findById(req.params.id);
    if (!proposal) {
      const err = new Error('Author proposal not found');
      err.status = 404;
      throw err;
    }
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

    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const decision = approveMockAuthorProposal({ id: req.params.id, decidedBy: req.user.id });
      if (!decision) {
        const err = new Error('Author proposal not found');
        err.status = 404;
        throw err;
      }
      return res.json({
        proposal: mapMockProposal(decision.proposal),
        author: mapMockAuthor(decision.author),
      });
    }

    const decision = await authorProposalModel.approveProposal(req.params.id, {
      decidedBy: req.user.id,
    });
    if (!decision) {
      const err = new Error('Author proposal not found');
      err.status = 404;
      throw err;
    }

    const proposer = decision.proposal?.submittedBy;
    if (proposer?.email) {
      sendAuthorProposalDecisionNotification({
        proposer: {
          firstName: proposer.firstName,
          lastName: proposer.lastName,
          email: proposer.email,
        },
        proposal: decision.proposal,
        decision: 'approved',
        dashboardUrl: `${FRONTEND_BASE}/dashboard`,
      }).catch((emailError) => {
        console.error('📨  Unable to send author approval email:', emailError.message);
      });
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

    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const proposal = rejectMockAuthorProposal({
        id: req.params.id,
        decidedBy: req.user.id,
        reason,
      });
      if (!proposal) {
        const err = new Error('Author proposal not found or already decided');
        err.status = 404;
        throw err;
      }
      return res.json({ proposal: mapMockProposal(proposal) });
    }

    const proposal = await authorProposalModel.rejectProposal(req.params.id, {
      decidedBy: req.user.id,
      reason,
    });
    if (!proposal) {
      const err = new Error('Author proposal not found or already decided');
      err.status = 404;
      throw err;
    }

    const proposer = proposal.submittedBy;
    if (proposer?.email) {
      sendAuthorProposalDecisionNotification({
        proposer: {
          firstName: proposer.firstName,
          lastName: proposer.lastName,
          email: proposer.email,
        },
        proposal,
        decision: 'rejected',
        dashboardUrl: `${FRONTEND_BASE}/dashboard`,
      }).catch((emailError) => {
        console.error('📨  Unable to send author rejection email:', emailError.message);
      });
    }

    res.json({ proposal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProposal,
  listProposals,
  getProposalById,
  approveProposal,
  rejectProposal,
};
