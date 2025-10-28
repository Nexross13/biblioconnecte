const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { getUsers, getUserById } = require('../data/mockData');
const { getRoleForEmail } = require('../utils/roles');

const createToken = (user) => {
  const role = user.role || getRoleForEmail(user.email);
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(payload, secret, { expiresIn: '12h' });
};

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (process.env.USE_MOCKS === 'true') {
      if (!firstName || !lastName || !email || !password) {
        const error = new Error('Missing registration fields');
        error.status = 400;
        throw error;
      }

      const role = getRoleForEmail(email);
      return res.status(201).json({
        token: 'mock-jwt-token',
        user: {
          id: 999,
          firstName,
          lastName,
          email,
          role,
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (!firstName || !lastName || !email || !password) {
      const error = new Error('Missing registration fields');
      error.status = 400;
      throw error;
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      const error = new Error('An account already exists with this email');
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({ firstName, lastName, email, passwordHash });
    const role = getRoleForEmail(user.email);
    const token = createToken({ ...user, role });

    res.status(201).json({
      token,
      user: { ...user, role },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.status = 400;
      throw error;
    }

    if (process.env.USE_MOCKS === 'true') {
      const mockUser = getUsers().find((user) => user.email === email);
      if (!mockUser) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      const role = getRoleForEmail(mockUser.email);
      return res.json({
        token: 'mock-jwt-token',
        user: { ...mockUser, role },
      });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const role = getRoleForEmail(user.email);
    const token = createToken({ ...user, role });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const mockUser = getUserById(req.user?.id || 1);
      if (!mockUser) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }
      const role = getRoleForEmail(mockUser.email);
      return res.json({ user: { ...mockUser, role } });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    const role = getRoleForEmail(user.email);
    res.json({ user: { ...user, role } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
};
