const MIN_LOGIN_LENGTH = 3;
const MAX_LOGIN_LENGTH = 30;
const LOGIN_REGEX = /^[a-z0-9._-]{3,30}$/;

const normalizeLoginInput = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const isLoginFormatValid = (value) => LOGIN_REGEX.test(value);

const stripDiacritics = (value) =>
  value
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const sanitizeLoginSeed = (seed) => {
  if (typeof seed !== 'string') {
    return '';
  }
  const stripped = stripDiacritics(seed);
  return stripped.replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '').slice(0, MAX_LOGIN_LENGTH);
};

const buildLoginCandidate = (seed) => {
  let candidate = sanitizeLoginSeed(seed);
  if (candidate.length < MIN_LOGIN_LENGTH) {
    const filler = 'reader';
    candidate = `${candidate}${filler}`.slice(0, MAX_LOGIN_LENGTH);
  }
  if (candidate.length < MIN_LOGIN_LENGTH) {
    candidate = `${candidate}user`.slice(0, MAX_LOGIN_LENGTH);
  }
  if (candidate.length < MIN_LOGIN_LENGTH) {
    candidate = `reader${Date.now().toString(36)}`.slice(0, MAX_LOGIN_LENGTH);
  }
  return candidate;
};

module.exports = {
  LOGIN_REGEX,
  MIN_LOGIN_LENGTH,
  MAX_LOGIN_LENGTH,
  normalizeLoginInput,
  isLoginFormatValid,
  buildLoginCandidate,
};
