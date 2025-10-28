const {
  getAuthors: getMockAuthors,
  getAuthorById: getMockAuthorById,
  getAuthorBooks: getMockAuthorBooks,
} = require('../data/mockData')
const authorModel = require('../models/authorModel')

const listAuthors = async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

    if (process.env.USE_MOCKS === 'true') {
      let authors = getMockAuthors()
      if (search) {
        const lower = search.toLowerCase()
        authors = authors.filter((author) =>
          `${author.firstName} ${author.lastName}`.toLowerCase().includes(lower),
        )
      }
      return res.json({ authors })
    }

    const authors = await authorModel.listAuthors({ search })
    res.json({ authors })
  } catch (error) {
    next(error)
  }
}

const getAuthorById = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const author = getMockAuthorById(Number(req.params.id))
      if (!author) {
        const err = new Error('Author not found')
        err.status = 404
        throw err
      }
      return res.json({ author })
    }

    const author = await authorModel.findById(req.params.id)
    if (!author) {
      const err = new Error('Author not found')
      err.status = 404
      throw err
    }
    res.json({ author })
  } catch (error) {
    next(error)
  }
}

const getAuthorBooks = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const books = getMockAuthorBooks(Number(req.params.id))
      return res.json({ books })
    }

    const books = await authorModel.getAuthorBooks(req.params.id)
    res.json({ books })
  } catch (error) {
    next(error)
  }
}

const createAuthor = async (req, res, next) => {
  try {
    const { firstName, lastName, biography } = req.body || {}
    if (!firstName || !lastName) {
      const err = new Error('firstName and lastName are required')
      err.status = 400
      throw err
    }

    if (process.env.USE_MOCKS === 'true') {
      const timestamp = new Date().toISOString()
      return res.status(201).json({
        author: {
          id: 1000,
          firstName,
          lastName,
          biography: biography || null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    }

    const author = await authorModel.createAuthor({ firstName, lastName, biography })
    res.status(201).json({ author })
  } catch (error) {
    next(error)
  }
}

const updateAuthor = async (req, res, next) => {
  try {
    const { biography, firstName, lastName } = req.body || {}
    const id = req.params.id

    if (process.env.USE_MOCKS === 'true') {
      const existing = getMockAuthorById(Number(id))
      if (!existing) {
        const err = new Error('Author not found')
        err.status = 404
        throw err
      }
      const updated = {
        ...existing,
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        biography: biography ?? existing.biography,
        updatedAt: new Date().toISOString(),
      }
      return res.json({ author: updated })
    }

    const existing = await authorModel.findById(id)
    if (!existing) {
      const err = new Error('Author not found')
      err.status = 404
      throw err
    }

    const payload = {
      firstName: firstName ?? existing.firstName,
      lastName: lastName ?? existing.lastName,
      biography: biography ?? existing.biography,
    }

    const author = await authorModel.updateAuthor(id, payload)

    res.json({ author })
  } catch (error) {
    next(error)
  }
}

const deleteAuthor = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send()
    }

    const deleted = await authorModel.deleteAuthor(req.params.id)
    if (!deleted) {
      const err = new Error('Author not found')
      err.status = 404
      throw err
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAuthors,
  getAuthorById,
  getAuthorBooks,
  createAuthor,
  updateAuthor,
  deleteAuthor,
}
