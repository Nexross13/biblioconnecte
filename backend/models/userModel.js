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

const listUsers = async () => {
  const result = await query(
    `SELECT id, first_name, last_name, email, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows.map(mapUser);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers,
};
