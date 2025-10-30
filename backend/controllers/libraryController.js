const libraryModel = require('../models/libraryModel');
const { getLibraryItems, getWishlistItems } = require('../data/mockData');

const listLibraryBooks = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    if (process.env.USE_MOCKS === 'true') {
      const books = getLibraryItems(userId);
      return res.json({ books });
    }
    const books = await libraryModel.listLibraryBooks(userId);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

const addBookToLibrary = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    if (!Number.isInteger(bookId)) {
      const err = new Error('Invalid bookId');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        entry: {
          userId: Number(req.user.id),
          bookId,
          addedAt: new Date().toISOString(),
        },
      });
    }

    const userId = Number(req.user.id);
    await libraryModel.removeWishlistBook({ userId, bookId });
    const entry = await libraryModel.addLibraryBook({ userId, bookId });
    res.status(201).json({ entry, removedFromWishlist: true });
  } catch (error) {
    next(error);
  }
};

const removeBookFromLibrary = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }
    const removed = await libraryModel.removeLibraryBook({ userId: Number(req.user.id), bookId });
    if (!removed) {
      const err = new Error('Book not found in library');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const listWishlistBooks = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    if (process.env.USE_MOCKS === 'true') {
      const books = getWishlistItems(userId);
      return res.json({ books });
    }
    const books = await libraryModel.listWishlistBooks(userId);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

const addBookToWishlist = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    if (!Number.isInteger(bookId)) {
      const err = new Error('Invalid bookId');
      err.status = 400;
      throw err;
    }
    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        entry: {
          userId: Number(req.user.id),
          bookId,
          addedAt: new Date().toISOString(),
        },
      });
    }
    const entry = await libraryModel.addWishlistBook({ userId: Number(req.user.id), bookId });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
};

const removeBookFromWishlist = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }
    const removed = await libraryModel.removeWishlistBook({ userId: Number(req.user.id), bookId });
    if (!removed) {
      const err = new Error('Book not found in wishlist');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLibraryBooks,
  addBookToLibrary,
  removeBookFromLibrary,
  listWishlistBooks,
  addBookToWishlist,
  removeBookFromWishlist,
};
