const VALID_ROLES = ['user', 'moderator', 'admin'];

const normalizeRole = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return VALID_ROLES.includes(normalized) ? normalized : null;
};

module.exports = {
  VALID_ROLES,
  normalizeRole,
};
