const authorModel = require('../models/authorModel');
const {
  getAuthors: getMockAuthors,
  getAuthorById: getMockAuthorById,
  getAuthorBooks: getMockAuthorBooks,
} = require('../data/mockData');

const listAuthors = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const authors = getMockAuthors();
      return res.json({ authors });
    }
    const authors = await authorModel.listAuthors();
    res.json({ authors });
  } catch (error) {
    next(error);
  }
};

const getAuthorById = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const author = getMockAuthorById(req.params.id);
      if (!author) {
        const err = new Error('Author not found');
        err.status = 404;
        throw err;
      }
      return res.json({ author });
    }

    const author = await authorModel.findById(req.params.id);
    if (!author) {
      const err = new Error('Author not found');
      err.status = 404;
      throw err;
    }
    res.json({ author });
  } catch (error) {
    next(error);
  }
};

const getAuthorBooks = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const books = getMockAuthorBooks(req.params.id);
      return res.json({ books });
    }
    const books = await authorModel.getAuthorBooks(req.params.id);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

const createAuthor = async (req, res, next) => {
  try {
    const { firstName, lastName, biography } = req.body;
    if (!firstName || !lastName) {
      const err = new Error('firstName and lastName are required');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        author: {
          id: 500,
          firstName,
          lastName,
          biography: biography || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const author = await authorModel.createAuthor({ firstName, lastName, biography });
    res.status(201).json({ author });
  } catch (error) {
    next(error);
  }
};

const updateAuthor = async (req, res, next) => {
  try {
    const { firstName, lastName, biography } = req.body;
    if (process.env.USE_MOCKS === 'true') {
      const existing = getMockAuthorById(req.params.id);
      if (!existing) {
        const err = new Error('Author not found');
        err.status = 404;
        throw err;
      }
      return res.json({
        author: {
          ...existing,
          firstName: firstName ?? existing.firstName,
          lastName: lastName ?? existing.lastName,
          biography: biography ?? existing.biography,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const existing = await authorModel.findById(req.params.id);
    if (!existing) {
      const err = new Error('Author not found');
      err.status = 404;
      throw err;
    }

    const author = await authorModel.updateAuthor(existing.id, {
      firstName: firstName ?? existing.firstName,
      lastName: lastName ?? existing.lastName,
      biography: biography ?? existing.biography,
    });

    res.json({ author });
  } catch (error) {
    next(error);
  }
};

const deleteAuthor = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }
    const deleted = await authorModel.deleteAuthor(req.params.id);
    if (!deleted) {
      const err = new Error('Author not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAuthors,
  getAuthorById,
  getAuthorBooks,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};
