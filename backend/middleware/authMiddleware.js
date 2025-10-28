const jwt = require('jsonwebtoken');
const { getUserById } = require('../data/mockData');
const { getRoleForEmail } = require('../utils/roles');

const buildAuthError = (message = 'Authentication required') => {
  const error = new Error(message);
  error.status = 401;
  return error;
};

const attachRole = (user = {}) => {
  const role = user.role || getRoleForEmail(user.email) || 'user';
  return {
    ...user,
    role,
    isAdmin: role === 'admin',
  };
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(buildAuthError('Missing bearer token'));
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
          }
        : { id: 1, email: 'mock@biblio.test' },
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

module.exports = {
  authenticate,
  requireAdmin: (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
      const error = new Error('Administrator privileges required');
      error.status = 403;
      return next(error);
    }
    return next();
  },
};
