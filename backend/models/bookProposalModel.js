const { pool, query } = require('../config/db');

const mapUser = (row, idKey, firstNameKey, lastNameKey, emailKey) => {
  const id = row?.[idKey];
  if (!id) {
    return null;
  }
  return {
    id,
    firstName: row[firstNameKey] || null,
    lastName: row[lastNameKey] || null,
    email: row[emailKey] || null,
  };
};

const mapProposal = (row) =>
  row && {
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    summary: row.summary,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at || row.submitted_at,
    decidedAt: row.decided_at || null,
    rejectionReason: row.rejection_reason || null,
    submittedBy: mapUser(
      row,
      'submitted_by',
      'submitted_by_first_name',
      'submitted_by_last_name',
      'submitted_by_email',
    ) || { id: row.submitted_by },
    decidedBy:
      mapUser(
        row,
        'decided_by',
        'decided_by_first_name',
        'decided_by_last_name',
        'decided_by_email',
      ) || (row.decided_by ? { id: row.decided_by } : null),
  };

const baseSelect = `
  SELECT
    bp.id,
    bp.title,
    bp.isbn,
    bp.edition,
    bp.volume,
    bp.summary,
    bp.status,
    bp.submitted_by,
    bp.submitted_at,
    bp.updated_at,
    bp.decided_by,
    bp.decided_at,
    bp.rejection_reason,
    u.first_name AS submitted_by_first_name,
    u.last_name AS submitted_by_last_name,
    u.email AS submitted_by_email,
    admin.first_name AS decided_by_first_name,
    admin.last_name AS decided_by_last_name,
    admin.email AS decided_by_email
  FROM book_proposals bp
  LEFT JOIN users u ON u.id = bp.submitted_by
  LEFT JOIN users admin ON admin.id = bp.decided_by
`;

const createProposal = async ({ title, isbn, edition, volume, summary, submittedBy }) => {
  const result = await query(
    `INSERT INTO book_proposals (title, isbn, edition, volume, summary, status, submitted_by)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6)
     RETURNING id, title, isbn, edition, volume, summary, status, submitted_by, submitted_at, updated_at, decided_by, decided_at, rejection_reason`,
    [title, isbn, edition, volume, summary, submittedBy],
  );
  return mapProposal(result.rows[0]);
};

const listProposals = async ({ status, limit = 25, offset = 0 } = {}) => {
  const values = [];
  const conditions = [];

  if (status) {
    values.push(status);
    conditions.push(`bp.status = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit, offset);

  const result = await query(
    `${baseSelect}
     ${whereClause}
     ORDER BY bp.submitted_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return result.rows.map(mapProposal);
};

const listProposalsForUser = async ({ userId, limit = 25, offset = 0 } = {}) => {
  const result = await query(
    `${baseSelect}
     WHERE bp.submitted_by = $1
     ORDER BY bp.submitted_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows.map(mapProposal);
};

const findById = async (id) => {
  const result = await query(
    `${baseSelect}
     WHERE bp.id = $1`,
    [id],
  );
  return mapProposal(result.rows[0]);
};

const approveProposal = async (id, { decidedBy }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const proposalResult = await client.query(
      `SELECT id, title, isbn, edition, volume, summary, status
       FROM book_proposals
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );
    const proposal = proposalResult.rows[0];
    if (!proposal) {
      await client.query('ROLLBACK');
      return null;
    }
    if (proposal.status !== 'pending') {
      const error = new Error('Proposal is not pending');
      error.status = 409;
      throw error;
    }

    const bookResult = await client.query(
      `INSERT INTO books (title, isbn, edition, volume, summary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, isbn, edition, volume, summary, created_at, updated_at`,
      [proposal.title, proposal.isbn, proposal.edition, proposal.volume, proposal.summary],
    );

    const updatedProposalResult = await client.query(
      `UPDATE book_proposals
       SET status = 'approved',
           decided_by = $2,
           decided_at = NOW(),
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, isbn, edition, volume, summary, status, submitted_by, submitted_at, updated_at, decided_by, decided_at, rejection_reason`,
      [id, decidedBy],
    );

    await client.query('COMMIT');

    const proposalPayload = mapProposal(updatedProposalResult.rows[0]);
    const bookRow = bookResult.rows[0];
    const book = bookRow && {
      id: bookRow.id,
      title: bookRow.title,
      isbn: bookRow.isbn,
      edition: bookRow.edition,
      volume: bookRow.volume,
      summary: bookRow.summary,
      createdAt: bookRow.created_at,
      updatedAt: bookRow.updated_at,
    };

    return { proposal: proposalPayload, book };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const rejectProposal = async (id, { decidedBy, reason }) => {
  const result = await query(
    `UPDATE book_proposals
     SET status = 'rejected',
         decided_by = $2,
         decided_at = NOW(),
         rejection_reason = $3,
         updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, title, isbn, edition, volume, summary, status, submitted_by, submitted_at, updated_at, decided_by, decided_at, rejection_reason`,
    [id, decidedBy, reason || null],
  );
  return mapProposal(result.rows[0]);
};

module.exports = {
  createProposal,
  listProposals,
  listProposalsForUser,
  findById,
  approveProposal,
  rejectProposal,
};
