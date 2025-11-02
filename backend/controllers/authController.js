const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const passwordResetService = require('../services/passwordResetService');
const { verifyGoogleCredential } = require('../services/googleAuthService');
const { getUsers, getUserById } = require('../data/mockData');
const { getRoleForEmail } = require('../utils/roles');

const THIRTEEN_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 13;
const SESSION_COOKIE_NAME = 'biblio_session';

const buildSessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: THIRTEEN_MONTHS_MS,
  path: '/',
});

const setSessionCookie = (res, token) => {
  if (typeof res.cookie === 'function') {
    res.cookie(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
  }
};

const clearSessionCookie = (res) => {
  if (typeof res.clearCookie === 'function') {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }
};

const generateRandomPassword = () => crypto.randomBytes(32).toString('hex');

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

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const rawDateOfBirth = req.body.dateOfBirth ?? req.body.date_naissance;
    const dateOfBirth = normalizeDate(rawDateOfBirth);

    if (process.env.USE_MOCKS === 'true') {
      if (!firstName || !lastName || !email || !password) {
        const error = new Error('Missing registration fields');
        error.status = 400;
        throw error;
      }
      if (rawDateOfBirth && !dateOfBirth) {
        const error = new Error('Invalid date_of_birth format');
        error.status = 400;
        throw error;
      }

      const role = getRoleForEmail(email);
      setSessionCookie(res, 'mock-jwt-token');
      return res.status(201).json({
        token: 'mock-jwt-token',
        user: {
          id: 999,
          firstName,
          lastName,
          email,
          role,
          dateOfBirth,
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (!firstName || !lastName || !email || !password) {
      const error = new Error('Missing registration fields');
      error.status = 400;
      throw error;
    }
    if (rawDateOfBirth && !dateOfBirth) {
      const error = new Error('Invalid date_of_birth format');
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
    const user = await userModel.createUser({
      firstName,
      lastName,
      email,
      passwordHash,
      dateOfBirth,
    });
    const role = getRoleForEmail(user.email);
    const token = createToken({ ...user, role });

    setSessionCookie(res, token);
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
      setSessionCookie(res, 'mock-jwt-token');
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

    setSessionCookie(res, token);
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role,
        dateOfBirth: user.dateOfBirth,
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

const logout = (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const emailInput = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!emailInput) {
      const error = new Error('Email is required');
      error.status = 400;
      throw error;
    }

    await passwordResetService.requestPasswordReset(emailInput);
    res.json({
      message: 'If an account matches this email, we have sent a verification code.',
    });
  } catch (error) {
    next(error);
  }
};

const verifyPasswordResetCode = async (req, res, next) => {
  try {
    const emailInput = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const codeInput = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!emailInput || !codeInput) {
      const error = new Error('Email and code are required');
      error.status = 400;
      throw error;
    }

    await passwordResetService.verifyPasswordResetCode({
      email: emailInput,
      code: codeInput,
    });

    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const emailInput = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const codeInput = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const passwordInput = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!emailInput || !codeInput || !passwordInput) {
      const error = new Error('Email, code and password are required');
      error.status = 400;
      throw error;
    }

    await passwordResetService.resetPassword({
      email: emailInput,
      code: codeInput,
      password: passwordInput,
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const loginWithGoogle = async (req, res, next) => {
  try {
    const credential = req.body?.credential;

    if (process.env.USE_MOCKS === 'true') {
      const payload = await verifyGoogleCredential(credential);
      const mockUsers = getUsers();
      const existing = mockUsers.find((user) => user.email === payload.email);
      const role = getRoleForEmail(payload.email);
      const user =
        existing ||
        {
          id: 1000,
          firstName: payload.firstName || 'Utilisateur',
          lastName: payload.lastName || '',
          email: payload.email,
          createdAt: new Date().toISOString(),
        };

      setSessionCookie(res, 'mock-jwt-token');
      return res.json({
        token: 'mock-jwt-token',
        user: {
          ...user,
          role,
        },
      });
    }

    const payload = await verifyGoogleCredential(credential);
    if (!payload.emailVerified) {
      const error = new Error('Votre adresse email Google doit être vérifiée');
      error.status = 401;
      throw error;
    }

    let user = await userModel.findByGoogleId(payload.googleId);
    if (!user) {
      const existingByEmail = await userModel.findByEmail(payload.email);
      if (existingByEmail) {
        await userModel.setGoogleId(existingByEmail.id, payload.googleId);
        user = { ...existingByEmail, googleId: payload.googleId };
      } else {
        const passwordHash = await bcrypt.hash(generateRandomPassword(), 10);
        user = await userModel.createUser({
          firstName: payload.firstName || 'Utilisateur',
          lastName: payload.lastName || '',
          email: payload.email,
          passwordHash,
          googleId: payload.googleId,
        });
      }
    }

    const role = getRoleForEmail(user.email);
    const token = createToken({ ...user, role });

    setSessionCookie(res, token);
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  logout,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
  loginWithGoogle,
};
