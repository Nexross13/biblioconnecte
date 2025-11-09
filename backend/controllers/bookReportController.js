const bookReportModel = require('../models/bookReportModel');
const bookModel = require('../models/bookModel');
const userModel = require('../models/userModel');
const {
  getBookById: getMockBookById,
  getBookReports: getMockBookReports,
  createBookReport: createMockBookReport,
  closeBookReport: closeMockBookReport,
} = require('../data/mockData');
const { sendBookReportNotification } = require('../services/emailService');

const normalizeReason = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const createReport = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    if (!Number.isInteger(bookId)) {
      const err = new Error('Invalid book id');
      err.status = 400;
      throw err;
    }

    const reason = normalizeReason(req.body?.reason);
    if (!reason || reason.length < 5) {
      const err = new Error('Le motif doit contenir au moins 5 caractères');
      err.status = 400;
      throw err;
    }
    if (reason.length > 1000) {
      const err = new Error('Le motif ne peut pas dépasser 1000 caractères');
      err.status = 400;
      throw err;
    }

    const reporterId = Number(req.user?.id);
    if (!Number.isInteger(reporterId)) {
      const err = new Error('Authentification requise');
      err.status = 401;
      throw err;
    }

    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const book = getMockBookById(bookId);
      if (!book) {
        const err = new Error('Book not found');
        err.status = 404;
        throw err;
      }
      const report = createMockBookReport({
        bookId,
        reportedBy: reporterId,
        reason,
      });
      return res.status(201).json({ report });
    }

    const book = await bookModel.findById(bookId);
    if (!book) {
      const err = new Error('Book not found');
      err.status = 404;
      throw err;
    }

    const report = await bookReportModel.createReport({
      bookId,
      reportedBy: reporterId,
      reason,
    });

    res.status(201).json({ report });

    userModel
      .listAdmins()
      .then((admins) => {
        if (!admins?.length) {
          return;
        }
        return sendBookReportNotification({
          admins,
          reporter: req.user,
          book,
          reason,
          reportId: report.id,
        });
      })
      .catch((error) => {
        console.error('Unable to notify admins about book report', error.message);
      });
  } catch (error) {
    next(error);
  }
};

const listReports = async (req, res, next) => {
  try {
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : null;
    const allowedStatuses = ['open', 'closed'];
    if (rawStatus && !allowedStatuses.includes(rawStatus)) {
      const err = new Error('Invalid status filter');
      err.status = 400;
      throw err;
    }
    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const reports = getMockBookReports({ status: rawStatus });
      return res.json({ reports });
    }

    const reports = await bookReportModel.listReports({ status: rawStatus });
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

const closeReport = async (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    if (!Number.isInteger(reportId)) {
      const err = new Error('Invalid report id');
      err.status = 400;
      throw err;
    }

    const useMocks = process.env.USE_MOCKS === 'true';
    if (useMocks) {
      const report = closeMockBookReport({ reportId, closedBy: Number(req.user.id) });
      if (!report) {
        const err = new Error('Report not found or already closed');
        err.status = 404;
        throw err;
      }
      return res.json({ report });
    }

    const report = await bookReportModel.closeReport({
      reportId,
      closedBy: Number(req.user.id),
    });

    if (!report) {
      const err = new Error('Report not found or already closed');
      err.status = 404;
      throw err;
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  listReports,
  closeReport,
};
