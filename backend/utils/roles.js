const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);

const isAdminEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  const adminEmails = parseAdminEmails();
  return adminEmails.includes(normalized);
};

const getRoleForEmail = (email) => (isAdminEmail(email) ? 'admin' : 'user');

module.exports = {
  getRoleForEmail,
  isAdminEmail,
};
