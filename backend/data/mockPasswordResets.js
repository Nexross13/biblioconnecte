const store = new Map();

const normalizeEmail = (email) => email?.trim().toLowerCase();

const createRequest = ({ email, userId, code, expiresAt }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  store.set(normalizedEmail, {
    email: normalizedEmail,
    userId,
    code,
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: new Date().toISOString(),
  });

  return store.get(normalizedEmail);
};

const getActiveRequest = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const record = store.get(normalizedEmail);
  if (!record) {
    return null;
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    store.delete(normalizedEmail);
    return null;
  }

  return { ...record };
};

const consumeRequest = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }
  store.delete(normalizedEmail);
};

const clear = () => {
  store.clear();
};

const peek = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }
  const record = store.get(normalizedEmail);
  return record ? { ...record } : null;
};

module.exports = {
  createRequest,
  getActiveRequest,
  consumeRequest,
  clear,
  peek,
};
