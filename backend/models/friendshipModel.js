const { query } = require('../config/db');

const listFriends = async (userId) => {
  const result = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, f.accepted_at
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
     WHERE (f.requester_id = $1 OR f.addressee_id = $1)
       AND f.status = 'accepted'
     ORDER BY f.accepted_at DESC NULLS LAST`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    acceptedAt: row.accepted_at,
  }));
};

const createFriendRequest = async ({ requesterId, addresseeId }) => {
  const result = await query(
    `INSERT INTO friendships (requester_id, addressee_id, status, requested_at)
     VALUES ($1, $2, 'pending', NOW())
     ON CONFLICT (requester_id, addressee_id) DO UPDATE SET requested_at = EXCLUDED.requested_at, status = 'pending'
     RETURNING requester_id, addressee_id, status, requested_at, responded_at, accepted_at`,
    [requesterId, addresseeId],
  );
  return result.rows[0];
};

const acceptFriendRequest = async ({ requesterId, addresseeId }) => {
  const result = await query(
    `UPDATE friendships
     SET status = 'accepted', responded_at = NOW(), accepted_at = NOW()
     WHERE requester_id = $1 AND addressee_id = $2
     RETURNING requester_id, addressee_id, status, requested_at, accepted_at`,
    [requesterId, addresseeId],
  );
  return result.rows[0];
};

const removeFriendship = async ({ userId, friendId }) => {
  const result = await query(
    `DELETE FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)
     RETURNING requester_id, addressee_id`,
    [userId, friendId],
  );
  return result.rows[0];
};

module.exports = {
  listFriends,
  createFriendRequest,
  acceptFriendRequest,
  removeFriendship,
};
