const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';

const parseOrigins = (raw = '') =>
  raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const FRONTEND_ORIGINS = parseOrigins(process.env.FRONTEND_URL);

if (FRONTEND_ORIGINS.length === 0) {
  FRONTEND_ORIGINS.push(DEFAULT_FRONTEND_ORIGIN);
}

const PRIMARY_FRONTEND_ORIGIN = FRONTEND_ORIGINS[0];
const IS_PRIMARY_FRONTEND_SECURE = /^https:\/\//i.test(PRIMARY_FRONTEND_ORIGIN);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }
  return FRONTEND_ORIGINS.includes(origin);
};

module.exports = {
  DEFAULT_FRONTEND_ORIGIN,
  FRONTEND_ORIGINS,
  PRIMARY_FRONTEND_ORIGIN,
  IS_PRIMARY_FRONTEND_SECURE,
  isAllowedOrigin,
};
