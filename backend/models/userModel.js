const { query } = require('../config/db');
const { normalizeRole } = require('../utils/roles');

const formatUser = (row) => ({
  id: row.id,
  login: row.login,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  googleId: row.google_id || null,
  dateOfBirth: row.date_of_birth || null,
  role: row.role || 'user',
  canBypassBookProposals: Boolean(row.can_bypass_book_proposals),
  canBypassAuthorProposals: Boolean(row.can_bypass_author_proposals),
  createdAt: row.created_at,
});

const mapUser = (row) => (row ? formatUser(row) : null);

const mapUserWithPassword = (row) =>
  row
    ? {
        ...formatUser(row),
        passwordHash: row.password_hash,
      }
    : null;

const createUser = async ({
  login,
  firstName,
  lastName,
  email,
  passwordHash,
  dateOfBirth = null,
  googleId = null,
  role = 'user',
}) => {
  const persistedRole = normalizeRole(role) || 'user';
  const result = await query(
    `INSERT INTO users (login, first_name, last_name, email, password_hash, date_of_birth, google_id, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, login, first_name, last_name, email, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals`,
    [login, firstName, lastName, email, passwordHash, dateOfBirth, googleId, persistedRole],
  );
  return mapUser(result.rows[0]);
};

const findByEmail = async (email) => {
  const result = await query(
    `SELECT id, login, first_name, last_name, email, password_hash, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals
     FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  return mapUserWithPassword(result.rows[0]);
};

const findByLogin = async (login) => {
  const result = await query(
    `SELECT id, login, first_name, last_name, email, password_hash, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals
     FROM users
     WHERE LOWER(login) = LOWER($1)`,
    [login],
  );
  return mapUserWithPassword(result.rows[0]);
};

const findByLoginOrEmail = async (identifier) => {
  const result = await query(
    `SELECT id, login, first_name, last_name, email, password_hash, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals
     FROM users
     WHERE LOWER(login) = LOWER($1) OR LOWER(email) = LOWER($1)
     LIMIT 1`,
    [identifier],
  );
  return mapUserWithPassword(result.rows[0]);
};

const findByGoogleId = async (googleId) => {
  const result = await query(
    `SELECT id, login, first_name, last_name, email, password_hash, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals
     FROM users
     WHERE google_id = $1`,
    [googleId],
  );
  return mapUserWithPassword(result.rows[0]);
};

const findById = async (id) => {
  const result = await query(
    `SELECT id, login, first_name, last_name, email, google_id, date_of_birth, created_at, role, can_bypass_book_proposals, can_bypass_author_proposals
     FROM users WHERE id = $1`,
    [id],
  );
  return mapUser(result.rows[0]);
};

const updateUser = async (id, { login, firstName, lastName, email, dateOfBirth }) => {
  const result = await query(
    `UPDATE users
     SET login = $2,
         first_name = $3,
         last_name = $4,
         email = $5,
         date_of_birth = COALESCE($6, date_of_birth),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, login, first_name, last_name, email, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals`,
    [id, login, firstName, lastName, email, dateOfBirth ?? null],
  );
  return mapUser(result.rows[0]);
};

const listUsers = async () => {
  const result = await query(
    `SELECT id, login, first_name, last_name, email, google_id, date_of_birth, created_at, role, can_bypass_book_proposals, can_bypass_author_proposals
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows.map(mapUser);
};

const listAdmins = async () => {
  const result = await query(
    `SELECT id, first_name, last_name, email, role
     FROM users
     WHERE role = 'admin'`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
  }));
};

const updateUserPassword = async (id, passwordHash) => {
  await query(
    `UPDATE users
     SET password_hash = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [id, passwordHash],
  );
};

const setGoogleId = async (id, googleId) => {
  await query(
    `UPDATE users
     SET google_id = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [id, googleId],
  );
};

const updateUserRole = async (id, role) => {
  const persistedRole = normalizeRole(role) || 'user';
  const result = await query(
    `UPDATE users
     SET role = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, login, first_name, last_name, email, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals`,
    [id, persistedRole],
  );
  return mapUser(result.rows[0]);
};

const setBookProposalDerogation = async (id, canBypass) => {
  const result = await query(
    `UPDATE users
     SET can_bypass_book_proposals = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, login, first_name, last_name, email, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals`,
    [id, Boolean(canBypass)],
  );
  return mapUser(result.rows[0]);
};

const setAuthorProposalDerogation = async (id, canBypass) => {
  const result = await query(
    `UPDATE users
     SET can_bypass_author_proposals = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, login, first_name, last_name, email, date_of_birth, created_at, google_id, role, can_bypass_book_proposals, can_bypass_author_proposals`,
    [id, Boolean(canBypass)],
  );
  return mapUser(result.rows[0]);
};

module.exports = {
  createUser,
  findByEmail,
  findByLogin,
  findByLoginOrEmail,
  findByGoogleId,
  findById,
  updateUser,
  updateUserPassword,
  setGoogleId,
  listUsers,
  listAdmins,
  updateUserRole,
  setBookProposalDerogation,
  setAuthorProposalDerogation,
};
