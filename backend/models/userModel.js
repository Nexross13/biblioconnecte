const { query } = require('../config/db');

const mapUser = (row) =>
  row && {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    createdAt: row.created_at,
  };

const createUser = async ({ firstName, lastName, email, passwordHash }) => {
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, first_name, last_name, email, created_at`,
    [firstName, lastName, email, passwordHash],
  );
  return mapUser(result.rows[0]);
};

const findByEmail = async (email) => {
  const result = await query(
    `SELECT id, first_name, last_name, email, password_hash, created_at
     FROM users WHERE email = $1`,
    [email],
  );
  const row = result.rows[0];
  return row
    ? {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        passwordHash: row.password_hash,
        createdAt: row.created_at,
      }
    : null;
};

const findById = async (id) => {
  const result = await query(
    `SELECT id, first_name, last_name, email, created_at
     FROM users WHERE id = $1`,
    [id],
  );
  return mapUser(result.rows[0]);
};

const updateUser = async (id, { firstName, lastName, email }) => {
  const result = await query(
    `UPDATE users
     SET first_name = $2,
         last_name = $3,
         email = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, first_name, last_name, email, created_at`,
    [id, firstName, lastName, email],
  );
  return mapUser(result.rows[0]);
};

const listUsers = async () => {
  const result = await query(
    `SELECT id, first_name, last_name, email, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows.map(mapUser);
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

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateUser,
  updateUserPassword,
  listUsers,
};
