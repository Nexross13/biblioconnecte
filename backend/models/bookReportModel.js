const { query } = require('../config/db');

const mapReport = (row) =>
  row && {
    id: row.id,
    bookId: row.book_id,
    reportedBy: row.reported_by,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    book: row.book_title
      ? {
          id: row.book_id,
          title: row.book_title,
          isbn: row.book_isbn,
        }
      : null,
    reporter: row.reporter_first_name || row.reporter_last_name || row.reporter_email
      ? {
          id: row.reported_by,
          firstName: row.reporter_first_name,
          lastName: row.reporter_last_name,
          email: row.reporter_email,
        }
      : null,
    moderator: row.moderator_first_name || row.moderator_last_name
      ? {
          id: row.closed_by,
          firstName: row.moderator_first_name,
          lastName: row.moderator_last_name,
        }
      : null,
  };

const selectReportWithDetails = async (whereClause, values, tail = 'ORDER BY br.created_at DESC') => {
  const result = await query(
    `SELECT br.id,
            br.book_id,
            br.reported_by,
            br.reason,
            br.status,
            br.created_at,
            br.updated_at,
            br.closed_at,
            br.closed_by,
            b.title AS book_title,
            b.isbn AS book_isbn,
            reporter.first_name AS reporter_first_name,
            reporter.last_name  AS reporter_last_name,
            reporter.email      AS reporter_email,
            moderator.first_name AS moderator_first_name,
            moderator.last_name  AS moderator_last_name
     FROM book_reports br
     JOIN books b ON b.id = br.book_id
     JOIN users reporter ON reporter.id = br.reported_by
     LEFT JOIN users moderator ON moderator.id = br.closed_by
     ${whereClause}
     ${tail}`,
    values,
  );
  return result.rows.map(mapReport);
};

const findById = async (reportId) => {
  const reports = await selectReportWithDetails('WHERE br.id = $1', [reportId]);
  return reports[0] || null;
};

const createReport = async ({ bookId, reportedBy, reason }) => {
  const result = await query(
    `INSERT INTO book_reports (book_id, reported_by, reason)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [bookId, reportedBy, reason],
  );
  const createdId = result.rows[0]?.id;
  if (!createdId) {
    return null;
  }
  return findById(createdId);
};

const listReports = async ({ status, limit = 50 } = {}) => {
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`br.status = $${values.length}`);
  }

  values.push(Math.max(1, Math.min(limit, 200)));
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const reports = await selectReportWithDetails(
    whereClause,
    values,
    `ORDER BY br.created_at DESC LIMIT $${values.length}`,
  );

  return reports;
};

const closeReport = async ({ reportId, closedBy }) => {
  const result = await query(
    `UPDATE book_reports
     SET status = 'closed',
         closed_by = $2,
         closed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
       AND status = 'open'
     RETURNING id`,
    [reportId, closedBy],
  );
  if (!result.rows[0]) {
    return null;
  }
  return findById(reportId);
};

module.exports = {
  createReport,
  listReports,
  findById,
  closeReport,
};
