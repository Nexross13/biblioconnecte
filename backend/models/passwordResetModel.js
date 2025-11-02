const { query } = require('../config/db');

const mapResetRequest = (row) =>
  row && {
    id: row.id,
    userId: row.user_id,
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    consumedAt: row.consumed_at,
  };

const deleteExpiredRequests = async () => {
  await query(
    `
    DELETE FROM password_reset_codes
    WHERE consumed_at IS NOT NULL
       OR expires_at < NOW()
  `,
  );
};

const clearRequestsForUser = async (userId) => {
  await query(`DELETE FROM password_reset_codes WHERE user_id = $1`, [userId]);
};

const createResetRequest = async ({ userId, codeHash, expiresAt }) => {
  await deleteExpiredRequests();
  await clearRequestsForUser(userId);

  const result = await query(
    `
    INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, code_hash, expires_at, created_at, consumed_at
  `,
    [userId, codeHash, expiresAt],
  );

  return mapResetRequest(result.rows[0]);
};

const getActiveRequestForUser = async (userId) => {
  const result = await query(
    `
    SELECT id, user_id, code_hash, expires_at, created_at, consumed_at
    FROM password_reset_codes
    WHERE user_id = $1
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [userId],
  );

  return mapResetRequest(result.rows[0]);
};

const consumeRequest = async (id) => {
  await query(
    `
    UPDATE password_reset_codes
    SET consumed_at = NOW()
    WHERE id = $1
  `,
    [id],
  );
};

module.exports = {
  createResetRequest,
  getActiveRequestForUser,
  consumeRequest,
  clearRequestsForUser,
};
