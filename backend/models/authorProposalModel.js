const { pool, query } = require('../config/db');

const mapUser = (id, firstName, lastName, email) =>
  id
    ? {
        id: Number(id),
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
      }
    : null;

const mapProposal = (row) =>
  row && {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    biography: row.biography,
    status: row.status,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    rejectionReason: row.rejection_reason,
    submittedBy: mapUser(row.submitted_by, row.submitted_first_name, row.submitted_last_name, row.submitted_email),
    decidedBy: mapUser(row.decided_by, row.decided_first_name, row.decided_last_name, row.decided_email),
  };

const mapAuthorRow = (row) =>
  row && {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    biography: row.biography,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const findById = async (id) => {
  const result = await query(
    `SELECT ap.id,
            ap.first_name,
            ap.last_name,
            ap.biography,
            ap.status,
            ap.submitted_at,
            ap.decided_at,
            ap.rejection_reason,
            ap.submitted_by,
            sb.first_name AS submitted_first_name,
            sb.last_name  AS submitted_last_name,
            sb.email      AS submitted_email,
            ap.decided_by,
            db.first_name AS decided_first_name,
            db.last_name  AS decided_last_name,
            db.email      AS decided_email
     FROM author_proposals ap
     LEFT JOIN users sb ON sb.id = ap.submitted_by
     LEFT JOIN users db ON db.id = ap.decided_by
     WHERE ap.id = $1`,
    [id],
  );
  return mapProposal(result.rows[0]);
};

const createProposal = async ({ firstName, lastName, biography, submittedBy }) => {
  const result = await query(
    `INSERT INTO author_proposals (first_name, last_name, biography, submitted_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [firstName, lastName, biography || null, submittedBy],
  );
  const createdId = result.rows[0]?.id;
  return findById(createdId);
};

const listProposals = async ({ status, limit, offset }) => {
  const values = [];
  const whereClauses = [];

  if (status) {
    values.push(status);
    whereClauses.push(`ap.status = $${values.length}`);
  }

  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;
  values.push(limit);
  values.push(offset);

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const result = await query(
    `SELECT ap.id,
            ap.first_name,
            ap.last_name,
            ap.biography,
            ap.status,
            ap.submitted_at,
            ap.decided_at,
            ap.rejection_reason,
            ap.submitted_by,
            sb.first_name AS submitted_first_name,
            sb.last_name  AS submitted_last_name,
            sb.email      AS submitted_email,
            ap.decided_by,
            db.first_name AS decided_first_name,
            db.last_name  AS decided_last_name,
            db.email      AS decided_email
     FROM author_proposals ap
     LEFT JOIN users sb ON sb.id = ap.submitted_by
     LEFT JOIN users db ON db.id = ap.decided_by
     ${whereSql}
     ORDER BY ap.submitted_at DESC
     LIMIT $${limitParam}
     OFFSET $${offsetParam}`,
    values,
  );

  return result.rows.map(mapProposal);
};

const approveProposal = async (id, { decidedBy }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const proposalResult = await client.query(
      `SELECT *
       FROM author_proposals
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );
    const proposalRow = proposalResult.rows[0];
    if (!proposalRow) {
      await client.query('ROLLBACK');
      return null;
    }
    if (proposalRow.status !== 'pending') {
      const error = new Error('Proposal is not pending');
      error.status = 409;
      throw error;
    }

    const existingAuthor = await client.query(
      `SELECT id, first_name, last_name, biography, created_at, updated_at
       FROM authors
       WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2)
       LIMIT 1`,
      [proposalRow.first_name, proposalRow.last_name],
    );

    let authorRow;
    if (existingAuthor.rowCount) {
      authorRow = existingAuthor.rows[0];
      if (proposalRow.biography && !authorRow.biography) {
        const updatedAuthor = await client.query(
          `UPDATE authors
           SET biography = $2,
               updated_at = NOW()
           WHERE id = $1
           RETURNING id, first_name, last_name, biography, created_at, updated_at`,
          [authorRow.id, proposalRow.biography],
        );
        authorRow = updatedAuthor.rows[0];
      }
    } else {
      const insertedAuthor = await client.query(
        `INSERT INTO authors (first_name, last_name, biography)
         VALUES ($1, $2, $3)
         RETURNING id, first_name, last_name, biography, created_at, updated_at`,
        [proposalRow.first_name, proposalRow.last_name, proposalRow.biography],
      );
      authorRow = insertedAuthor.rows[0];
    }

    await client.query(
      `UPDATE author_proposals
       SET status = 'approved',
           decided_by = $2,
           decided_at = NOW(),
           rejection_reason = NULL
       WHERE id = $1`,
      [id, decidedBy],
    );

    await client.query('COMMIT');

    const refreshedProposal = await findById(id);

    return {
      proposal: refreshedProposal,
      author: mapAuthorRow(authorRow),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const rejectProposal = async (id, { decidedBy, reason }) => {
  const result = await query(
    `UPDATE author_proposals
     SET status = 'rejected',
         decided_by = $2,
         decided_at = NOW(),
         rejection_reason = $3
     WHERE id = $1
       AND status = 'pending'
     RETURNING id`,
    [id, decidedBy, reason || null],
  );
  if (!result.rowCount) {
    return null;
  }
  return findById(id);
};

module.exports = {
  createProposal,
  listProposals,
  findById,
  approveProposal,
  rejectProposal,
};
