const genreModel = require('../models/genreModel');
const {
  getGenres: getMockGenres,
  getGenreBooks: getMockGenreBooks,
} = require('../data/mockData');

const listGenres = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const genres = getMockGenres();
      return res.json({ genres });
    }
    const genres = await genreModel.listGenres();
    res.json({ genres });
  } catch (error) {
    next(error);
  }
};

const getGenreBooks = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const books = getMockGenreBooks(req.params.id);
      return res.json({ books });
    }
    const books = await genreModel.getGenreBooks(req.params.id);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

const createGenre = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      const err = new Error('Genre name is required');
      err.status = 400;
      throw err;
    }
    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        genre: {
          id: 700,
          name,
          createdAt: new Date().toISOString(),
        },
      });
    }
    const genre = await genreModel.createGenre({ name });
    res.status(201).json({ genre });
  } catch (error) {
    next(error);
  }
};

const deleteGenre = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }
    const deleted = await genreModel.deleteGenre(req.params.id);
    if (!deleted) {
      const err = new Error('Genre not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listGenres,
  getGenreBooks,
  createGenre,
  deleteGenre,
};
