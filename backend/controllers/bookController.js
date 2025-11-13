const bookModel = require('../models/bookModel');
const bookProposalModel = require('../models/bookProposalModel');
const {
  getBooks: getMockBooks,
  getBookById: getMockBookById,
  getBookAuthors: getMockBookAuthors,
  getBookGenres: getMockBookGenres,
  getAuthors: getMockAuthors,
  getGenres: getMockGenres,
} = require('../data/mockData');

const parsePagination = (req) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  return { limit, offset };
};

const normalizeReleaseDate = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const stringValue = String(value).trim();
  if (!stringValue.length) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }
  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error('Invalid release date');
    err.status = 400;
    throw err;
  }
  return parsed.toISOString().slice(0, 10);
};

const normalizeVolumeTitle = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const formatAuthorName = (author = {}) => {
  const parts = [];
  if (author.firstName) {
    parts.push(author.firstName.trim());
  }
  if (author.lastName) {
    parts.push(author.lastName.trim());
  }
  return parts.join(' ').trim();
};

const listBooks = async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req);
    if (process.env.USE_MOCKS === 'true') {
      const books = getMockBooks({ search: req.query.search }).slice(offset, offset + limit);
      return res.json({ books, pagination: { limit, offset, count: books.length } });
    }

    const books = await bookModel.listBooks({
      search: req.query.search,
      limit,
      offset,
    });

    res.json({ books, pagination: { limit, offset, count: books.length } });
  } catch (error) {
    next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const book = getMockBookById(req.params.id);
      if (!book) {
        const err = new Error('Book not found');
        err.status = 404;
        throw err;
      }
      const authors = getMockBookAuthors(book.id);
      const genres = getMockBookGenres(book.id);
      return res.json({ book: { ...book, authors, genres } });
    }

    const book = await bookModel.findById(req.params.id);
    if (!book) {
      const err = new Error('Book not found');
      err.status = 404;
      throw err;
    }

    const [authors, genres] = await Promise.all([
      bookModel.getBookAuthors(book.id),
      bookModel.getBookGenres(book.id),
    ]);

    res.json({ book: { ...book, authors, genres } });
  } catch (error) {
    next(error);
  }
};

const getBookAuthors = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const authors = getMockBookAuthors(req.params.id);
      return res.json({ authors });
    }
    const authors = await bookModel.getBookAuthors(req.params.id);
    res.json({ authors });
  } catch (error) {
    next(error);
  }
};

const getBookGenres = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const genres = getMockBookGenres(req.params.id);
      return res.json({ genres });
    }
    const genres = await bookModel.getBookGenres(req.params.id);
    res.json({ genres });
  } catch (error) {
    next(error);
  }
};

const normalizeIds = (ids = []) =>
  Array.isArray(ids)
    ? [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isInteger(id)))]
    : [];

const createBook = async (req, res, next) => {
  try {
    const {
      title,
      isbn,
      edition,
      volume,
      volumeTitle,
      summary,
      releaseDate: rawReleaseDate,
      authorIds,
      genreIds,
    } = req.body;
    if (!title) {
      const err = new Error('Title is required');
      err.status = 400;
      throw err;
    }

    const releaseDate = normalizeReleaseDate(rawReleaseDate);
    const normalizedVolumeTitle = normalizeVolumeTitle(volumeTitle);

    if (process.env.USE_MOCKS === 'true') {
      const allAuthors = getMockAuthors();
      const allGenres = getMockGenres();
      const normalizedAuthors = normalizeIds(authorIds).map((id) =>
        allAuthors.find((author) => author.id === id),
      );
      const normalizedGenres = normalizeIds(genreIds).map((id) =>
        allGenres.find((genre) => genre.id === id),
      );

      return res.status(201).json({
        book: {
          id: 1000,
          title,
          isbn: isbn || null,
          edition: edition || null,
          volume: volume || null,
          volumeTitle: normalizedVolumeTitle,
          summary: summary || null,
          releaseDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authors: normalizedAuthors.filter(Boolean),
          genres: normalizedGenres.filter(Boolean),
        },
      });
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

    const canCreateDirectly =
      Boolean(req.user.isAdmin) || Boolean(req.user.canBypassBookProposals);

    if (!canCreateDirectly) {
      const proposal = await bookProposalModel.createProposal({
        title,
        isbn,
        edition,
        volume,
        volumeTitle: normalizedVolumeTitle,
        summary,
        publicationDate: releaseDate,
        submittedBy,
      });

      return res.status(202).json({
        message: 'Livre envoyé pour validation par un administrateur',
        proposal,
      });
    }

    const book = await bookModel.createBook({
      title,
      isbn,
      edition,
      volume,
      volumeTitle: normalizedVolumeTitle,
      releaseDate,
      summary,
    });

    const shouldLogApprovedProposal =
      Boolean(req.user.canBypassBookProposals) && !req.user.isAdmin;

    const [authors, genres] = await Promise.all([
      bookModel.setBookAuthors(book.id, normalizeIds(authorIds)),
      bookModel.setBookGenres(book.id, normalizeIds(genreIds)),
    ]);

    if (shouldLogApprovedProposal) {
      const authorNames = authors.map(formatAuthorName).filter(Boolean);
      const genreNames = genres.map((genre) => genre.name).filter(Boolean);
      try {
        await bookProposalModel.createProposal({
          title,
          isbn,
          edition,
          volume,
          volumeTitle: normalizedVolumeTitle,
          summary,
          publicationDate: releaseDate,
          status: 'approved',
          submittedBy,
          decidedBy: submittedBy,
          decidedAt: new Date().toISOString(),
          authorNames,
          genreNames,
        });
      } catch (proposalError) {
        console.warn('Unable to log approved book proposal', proposalError);
      }
    }

    res.status(201).json({ book: { ...book, authors, genres } });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const existing = getMockBookById(req.params.id);
      if (!existing) {
        const err = new Error('Book not found');
        err.status = 404;
        throw err;
      }

      const allAuthors = getMockAuthors();
      const allGenres = getMockGenres();
      const authorIds = req.body.authorIds ? normalizeIds(req.body.authorIds) : null;
      const genreIds = req.body.genreIds ? normalizeIds(req.body.genreIds) : null;

      const authors = authorIds
        ? authorIds.map((id) => allAuthors.find((author) => author.id === id)).filter(Boolean)
        : getMockBookAuthors(existing.id);
      const genres = genreIds
        ? genreIds.map((id) => allGenres.find((genre) => genre.id === id)).filter(Boolean)
        : getMockBookGenres(existing.id);
      const nextVolumeTitle =
        req.body.volumeTitle === undefined
          ? existing.volumeTitle
          : normalizeVolumeTitle(req.body.volumeTitle);

      const book = {
        ...existing,
        title: req.body.title ?? existing.title,
        isbn: req.body.isbn ?? existing.isbn,
        edition: req.body.edition ?? existing.edition,
        volume: req.body.volume ?? existing.volume,
        volumeTitle: nextVolumeTitle,
        summary: req.body.summary ?? existing.summary,
        releaseDate: normalizeReleaseDate(
          req.body.releaseDate === undefined ? existing.releaseDate : req.body.releaseDate,
        ),
        updatedAt: new Date().toISOString(),
      };

      return res.json({ book: { ...book, authors, genres } });
    }

    const existing = await bookModel.findById(req.params.id);
    if (!existing) {
      const err = new Error('Book not found');
      err.status = 404;
      throw err;
    }

    const payload = {
      title: req.body.title ?? existing.title,
      isbn: req.body.isbn ?? existing.isbn,
      edition: req.body.edition ?? existing.edition,
      volume: req.body.volume ?? existing.volume,
      volumeTitle:
        req.body.volumeTitle === undefined
          ? existing.volumeTitle
          : normalizeVolumeTitle(req.body.volumeTitle),
      releaseDate: normalizeReleaseDate(
        req.body.releaseDate === undefined ? existing.releaseDate : req.body.releaseDate,
      ),
      summary: req.body.summary ?? existing.summary,
    };

    const book = await bookModel.updateBook(existing.id, payload);

    const authorIds = req.body.authorIds ? normalizeIds(req.body.authorIds) : null;
    const genreIds = req.body.genreIds ? normalizeIds(req.body.genreIds) : null;

    const [authors, genres] = await Promise.all([
      authorIds ? bookModel.setBookAuthors(book.id, authorIds) : bookModel.getBookAuthors(book.id),
      genreIds ? bookModel.setBookGenres(book.id, genreIds) : bookModel.getBookGenres(book.id),
    ]);

    res.json({ book: { ...book, authors, genres } });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }
    const deleted = await bookModel.deleteBook(req.params.id);
    if (!deleted) {
      const err = new Error('Book not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getSeriesPrefill = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const book = getMockBookById(req.params.id);
      if (!book) {
        const err = new Error('Book not found');
        err.status = 404;
        throw err;
      }
      const normalizedTitle = (book.title || '').trim().toLowerCase();
      const allMatching = getMockBooks()
        .filter((entry) => (entry.title || '').trim().toLowerCase() === normalizedTitle)
        .map((entry) => Number(entry.volume))
        .filter((value) => Number.isFinite(value));
      const nextVolume = allMatching.length ? String(Math.max(...allMatching) + 1) : '1';
      const genreNames = getMockBookGenres(book.id).map((genre) => genre.name);
      return res.json({
        prefill: {
          title: book.title,
          edition: book.edition || null,
          nextVolume,
          genreNames,
        },
      });
    }

    const book = await bookModel.findById(req.params.id);
    if (!book) {
      const err = new Error('Book not found');
      err.status = 404;
      throw err;
    }

    const [genres, nextVolume] = await Promise.all([
      bookModel.getBookGenres(book.id),
      bookModel.getNextVolumeNumberForTitle(book.title),
    ]);

    res.json({
      prefill: {
        title: book.title,
        edition: book.edition || null,
        nextVolume: nextVolume || '1',
        genreNames: genres.map((genre) => genre.name),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBooks,
  getBookById,
  getBookAuthors,
  getBookGenres,
  createBook,
  updateBook,
  deleteBook,
  getSeriesPrefill,
};
