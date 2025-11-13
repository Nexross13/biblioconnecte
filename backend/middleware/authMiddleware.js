const jwt = require('jsonwebtoken');
const { getUserById } = require('../data/mockData');
const { normalizeRole } = require('../utils/roles');

const SESSION_COOKIE_NAME = 'biblio_session';

const buildAuthError = (message = 'Authentication required') => {
  const error = new Error(message);
  error.status = 401;
  return error;
};

const attachRole = (user = {}) => {
  const role = normalizeRole(user.role) || 'user';
  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || isAdmin;
  const canBypassBookProposals = Boolean(user.canBypassBookProposals);
  return {
    ...user,
    role,
    isAdmin,
    isModerator,
    canBypassBookProposals,
  };
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!token && req.cookies) {
    token = req.cookies[SESSION_COOKIE_NAME];
  }

  if (!token) {
    return next(buildAuthError('Authentication required'));
  }

  const useMocks = process.env.USE_MOCKS === 'true';

  if (useMocks) {
    if (token !== 'mock-jwt-token') {
      return next(buildAuthError('Invalid token'));
    }
    const mockUser = getUserById(1);
    req.user = attachRole(
      mockUser
        ? {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
          }
        : { id: 1, email: 'mock@biblio.test', role: 'user' },
    );
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const payload = jwt.verify(token, secret);
    req.user = attachRole(payload);
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(buildAuthError('Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(buildAuthError('Invalid token'));
    }
    error.status = error.status || 500;
    return next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    const error = new Error('Administrator privileges required');
    error.status = 403;
    return next(error);
  }
  return next();
};

const requireModerator = (req, res, next) => {
  if (!req.user || !req.user.isModerator) {
    const error = new Error('Moderator privileges required');
    error.status = 403;
    return next(error);
  }
  return next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireModerator,
};
