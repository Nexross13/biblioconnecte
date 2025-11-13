const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/db');

const fsPromises = fs.promises;
const PROPOSAL_COVER_RELATIVE_DIR = path.join('assets', 'books', 'proposals');
const PROPOSAL_COVER_DIR = path.join(__dirname, '..', PROPOSAL_COVER_RELATIVE_DIR);
const FINAL_COVER_DIR = path.join(__dirname, '..', 'assets', 'books');

const ensureDirectory = async (dir) => {
  await fsPromises.mkdir(dir, { recursive: true });
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const stringValue = String(value);
  if (!stringValue.length) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }
  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) {
    return stringValue;
  }
  return parsed.toISOString().slice(0, 10);
};

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
    volumeTitle: row.volume_title || null,
    releaseDate: normalizeDate(row.publication_date),
    summary: row.summary,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at || row.submitted_at,
    decidedAt: row.decided_at || null,
    rejectionReason: row.rejection_reason || null,
    authorNames: row.author_names || [],
    genreNames: row.genre_names || [],
    coverImagePath: row.cover_image_path || null,
    submittedBy:
      mapUser(
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
    bp.volume_title,
    bp.publication_date,
    bp.summary,
    bp.status,
    bp.submitted_by,
    bp.submitted_at,
    bp.updated_at,
    bp.decided_by,
    bp.decided_at,
    bp.rejection_reason,
    bp.author_names,
    bp.genre_names,
    bp.cover_image_path,
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

const createProposal = async ({
  title,
  isbn,
  edition,
  volume,
  volumeTitle,
  summary,
  publicationDate = null,
  status = 'pending',
  submittedBy,
  decidedBy = null,
  decidedAt = null,
  authorNames = [],
  genreNames = [],
  coverImagePath = null,
}) => {
  const resolvedDecidedAt = decidedBy && !decidedAt ? new Date().toISOString() : decidedAt;
  const result = await query(
    `INSERT INTO book_proposals (
       title,
       isbn,
       edition,
       volume,
       volume_title,
       summary,
       publication_date,
       status,
       submitted_by,
       decided_by,
       decided_at,
       author_names,
       genre_names,
       cover_image_path
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id, title, isbn, edition, volume, volume_title, summary, publication_date, status, submitted_by, submitted_at, updated_at, decided_by, decided_at, rejection_reason, author_names, genre_names, cover_image_path`,
    [
      title,
      isbn,
      edition,
      volume,
      volumeTitle,
      summary,
      publicationDate,
      status,
      submittedBy,
      decidedBy,
      resolvedDecidedAt,
      authorNames,
      genreNames,
      coverImagePath,
    ],
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

const splitName = (fullName = '') => {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop();
  const firstName = parts.join(' ');
  return { firstName, lastName };
};

const approveProposal = async (id, { decidedBy }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const proposalResult = await client.query(
      `SELECT id, title, isbn, edition, volume, volume_title, summary, publication_date, status, author_names, genre_names, cover_image_path
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
      `INSERT INTO books (title, isbn, edition, volume, volume_title, publication_date, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, isbn, edition, volume, volume_title, publication_date, summary, created_at, updated_at`,
      [
        proposal.title,
        proposal.isbn,
        proposal.edition,
        proposal.volume,
        proposal.volume_title,
        proposal.publication_date,
        proposal.summary,
      ],
    );

    const updatedProposalResult = await client.query(
      `UPDATE book_proposals
       SET status = 'approved',
           decided_by = $2,
           decided_at = NOW(),
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, isbn, edition, volume, volume_title, summary, publication_date, status, submitted_by, submitted_at, updated_at, decided_by, decided_at, rejection_reason, author_names, genre_names, cover_image_path`,
      [id, decidedBy],
    );

    const proposalPayload = mapProposal(updatedProposalResult.rows[0]);
    const bookRow = bookResult.rows[0];
    const book = {
      id: bookRow.id,
      title: bookRow.title,
      isbn: bookRow.isbn,
      edition: bookRow.edition,
      volume: bookRow.volume,
      volumeTitle: bookRow.volume_title || null,
      releaseDate: normalizeDate(bookRow.publication_date),
      summary: bookRow.summary,
      createdAt: bookRow.created_at,
      updatedAt: bookRow.updated_at,
    };

    // Handle authors
    if (Array.isArray(proposal.author_names) && proposal.author_names.length) {
      const authorIds = [];
      for (const name of proposal.author_names) {
        const { firstName, lastName } = splitName(name);
        if (!firstName && !lastName) {
          continue;
        }
        const existingAuthor = await client.query(
          `SELECT id FROM authors WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) LIMIT 1`,
          [firstName, lastName],
        );
        let authorId;
        if (existingAuthor.rowCount) {
          authorId = existingAuthor.rows[0].id;
        } else {
          const insertedAuthor = await client.query(
            `INSERT INTO authors (first_name, last_name)
             VALUES ($1, $2)
             RETURNING id`,
            [firstName, lastName],
          );
          authorId = insertedAuthor.rows[0].id;
        }
        authorIds.push(authorId);
      }

      if (authorIds.length) {
        const values = authorIds.map((_, index) => `($1, $${index + 2})`).join(', ');
        await client.query(`INSERT INTO book_authors (book_id, author_id) VALUES ${values}`, [
          book.id,
          ...authorIds,
        ]);
      }
    }

    // Handle genres
    if (Array.isArray(proposal.genre_names) && proposal.genre_names.length) {
      const genreIds = [];
      for (const name of proposal.genre_names) {
        const trimmed = name.trim();
        if (!trimmed) {
          continue;
        }
        const existingGenre = await client.query(
          `SELECT id FROM genres WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [trimmed],
        );
        let genreId;
        if (existingGenre.rowCount) {
          genreId = existingGenre.rows[0].id;
        } else {
          const insertedGenre = await client.query(
            `INSERT INTO genres (name)
             VALUES ($1)
             RETURNING id`,
            [trimmed],
          );
          genreId = insertedGenre.rows[0].id;
        }
        genreIds.push(genreId);
      }

      if (genreIds.length) {
        const values = genreIds.map((_, index) => `($1, $${index + 2})`).join(', ');
        await client.query(`INSERT INTO book_genres (book_id, genre_id) VALUES ${values}`, [
          book.id,
          ...genreIds,
        ]);
      }
    }

    // Move cover image if present
    if (proposal.cover_image_path) {
      const sourceRelative = proposal.cover_image_path.replace(/^\//, '');
      const absoluteSource = path.join(__dirname, '..', sourceRelative);
      try {
        await fsPromises.access(absoluteSource);
        await ensureDirectory(FINAL_COVER_DIR);
        const extension = path.extname(absoluteSource) || '.jpg';
        const targetName = book.isbn ? `${book.isbn}${extension}` : `book-${book.id}${extension}`;
        const targetPath = path.join(FINAL_COVER_DIR, targetName);
        await fsPromises.copyFile(absoluteSource, targetPath);
        await fsPromises.unlink(absoluteSource).catch((error) => {
          console.warn('Unable to remove proposal cover image after approval', error);
        });
      } catch (error) {
        // ignore missing file, but log for troubleshooting
        console.warn('Unable to copy proposal cover image', error);
      }
    }

    await client.query('COMMIT');

    const refreshedResult = await query(`${baseSelect} WHERE bp.id = $1`, [id]);
    const fullProposal = mapProposal(refreshedResult.rows[0]) || proposalPayload;

    return { proposal: fullProposal, book };
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
     RETURNING id, title, isbn, edition, volume, volume_title, summary, status, submitted_by, submitted_at, updated_at, decided_by, decided_at, rejection_reason, author_names, genre_names, cover_image_path`,
    [id, decidedBy, reason || null],
  );
  const baseProposal = mapProposal(result.rows[0]);
  if (!baseProposal) {
    return null;
  }

  const refreshedResult = await query(`${baseSelect} WHERE bp.id = $1`, [id]);
  const fullProposal = mapProposal(refreshedResult.rows[0]) || baseProposal;

  if (fullProposal.coverImagePath) {
    const sourceRelative = fullProposal.coverImagePath.replace(/^\//, '');
    const absoluteSource = path.join(__dirname, '..', sourceRelative);
    await fsPromises.unlink(absoluteSource).catch((error) => {
      console.warn('Unable to remove proposal cover image after rejection', error);
    });
  }

  return fullProposal;
};

const UPDATABLE_COLUMNS = {
  title: 'title',
  isbn: 'isbn',
  edition: 'edition',
  volume: 'volume',
  volumeTitle: 'volume_title',
  summary: 'summary',
  releaseDate: 'publication_date',
  authorNames: 'author_names',
  genreNames: 'genre_names',
};

const updateProposal = async (id, updates = {}) => {
  const pendingResult = await query('SELECT status FROM book_proposals WHERE id = $1', [id]);
  if (!pendingResult.rowCount) {
    return null;
  }
  if (pendingResult.rows[0].status !== 'pending') {
    const error = new Error('Proposal is not pending');
    error.status = 409;
    throw error;
  }

  const setClauses = [];
  const values = [];

  Object.entries(UPDATABLE_COLUMNS).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const value = key === 'releaseDate' ? normalizeDate(updates[key]) : updates[key];
      setClauses.push(`${column} = $${values.length + 1}`);
      values.push(value);
    }
  });

  if (!setClauses.length) {
    const refreshedResult = await query(`${baseSelect} WHERE bp.id = $1`, [id]);
    return mapProposal(refreshedResult.rows[0]) || null;
  }

  values.push(id);

  await query(
    `UPDATE book_proposals
     SET ${setClauses.concat('updated_at = NOW()').join(', ')}
     WHERE id = $${values.length}`,
    values,
  );

  const refreshedResult = await query(`${baseSelect} WHERE bp.id = $1`, [id]);
  return mapProposal(refreshedResult.rows[0]) || null;
};

module.exports = {
  createProposal,
  listProposals,
  listProposalsForUser,
  findById,
  approveProposal,
  rejectProposal,
  updateProposal,
  PROPOSAL_COVER_DIR,
  PROPOSAL_COVER_RELATIVE_DIR,
};
