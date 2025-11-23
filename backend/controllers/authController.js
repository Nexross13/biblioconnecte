const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const passwordResetService = require('../services/passwordResetService');
const { verifyGoogleCredential } = require('../services/googleAuthService');
const { getUsers, getUserById } = require('../data/mockData');
const { normalizeRole } = require('../utils/roles');
const { IS_PRIMARY_FRONTEND_SECURE } = require('../config/frontend');
const {
  normalizeLoginInput,
  isLoginFormatValid,
  buildLoginCandidate,
  MAX_LOGIN_LENGTH,
} = require('../utils/login');

const THIRTEEN_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 13;
const SESSION_COOKIE_NAME = 'biblio_session';

const normalizeBooleanEnv = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return null;
};

const shouldUseSecureCookies = (() => {
  const override = normalizeBooleanEnv(process.env.SESSION_COOKIE_SECURE);
  if (override !== null) {
    return override;
  }
  return IS_PRIMARY_FRONTEND_SECURE;
})();

const buildSessionCookieOptions = () => ({
  httpOnly: true,
  secure: shouldUseSecureCookies,
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

const normalizeIdentifierInput = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const generateAvailableLogin = async (seed) => {
  const base = buildLoginCandidate(seed || `reader${Date.now().toString(36)}`);
  let candidate = base;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await userModel.findByLogin(candidate);
    if (!exists) {
      return candidate;
    }

    const suffix = `${attempt + 1}`;
    const trimmedBase = base.slice(0, MAX_LOGIN_LENGTH - suffix.length);
    candidate = `${trimmedBase}${suffix}`;
  }

  const error = new Error('Unable to allocate a unique login');
  error.status = 500;
  throw error;
};

const resolveUserRole = (user) => (user ? normalizeRole(user.role) || 'user' : 'user');

const createToken = (user) => {
  const role = resolveUserRole(user);
  const payload = {
    id: user.id,
    login: user.login,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    canBypassBookProposals: Boolean(user.canBypassBookProposals),
    canBypassAuthorProposals: Boolean(user.canBypassAuthorProposals),
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
    const firstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : '';
    const emailInput = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const loginInput = normalizeLoginInput(req.body?.login);
    const rawDateOfBirth = req.body?.dateOfBirth ?? req.body?.date_naissance;
    const dateOfBirth = normalizeDate(rawDateOfBirth);

    if (!firstName || !lastName || !emailInput || !password || !loginInput) {
      const error = new Error('Missing registration fields');
      error.status = 400;
      throw error;
    }

    if (!isLoginFormatValid(loginInput)) {
      const error = new Error('Login must contain 3 to 30 characters using letters, numbers, dots, hyphens or underscores');
      error.status = 400;
      throw error;
    }

    if (rawDateOfBirth && !dateOfBirth) {
      const error = new Error('Invalid date_of_birth format');
      error.status = 400;
      throw error;
    }

    if (process.env.USE_MOCKS === 'true') {
      const mockUsers = getUsers();
      const existingMockLogin = mockUsers.find(
        (user) => user.login?.toLowerCase() === loginInput.toLowerCase(),
      );
      if (existingMockLogin) {
        const error = new Error('Login already in use');
        error.status = 409;
        throw error;
      }
      const existingMockEmail = mockUsers.find(
        (user) => user.email.toLowerCase() === emailInput.toLowerCase(),
      );
      if (existingMockEmail) {
        const error = new Error('An account already exists with this email');
        error.status = 409;
        throw error;
      }

      const role = 'user';
      setSessionCookie(res, 'mock-jwt-token');
      return res.status(201).json({
        token: 'mock-jwt-token',
        user: {
          id: 999,
          login: loginInput,
          firstName,
          lastName,
          email: emailInput,
          role,
          canBypassBookProposals: false,
          canBypassAuthorProposals: false,
          dateOfBirth,
          createdAt: new Date().toISOString(),
        },
      });
    }

    const [existingLogin, existingEmail] = await Promise.all([
      userModel.findByLogin(loginInput),
      userModel.findByEmail(emailInput),
    ]);

    if (existingLogin) {
      const error = new Error('Login already in use');
      error.status = 409;
      throw error;
    }

    if (existingEmail) {
      const error = new Error('An account already exists with this email');
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const derivedRole = 'user';
    const user = await userModel.createUser({
      login: loginInput,
      firstName,
      lastName,
      email: emailInput,
      passwordHash,
      dateOfBirth,
      role: derivedRole,
    });
    const role = resolveUserRole(user);
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
    const identifierInput = normalizeIdentifierInput(
      req.body?.identifier ?? req.body?.login ?? req.body?.email,
    );
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identifierInput || !password) {
      const error = new Error('Login/email and password are required');
      error.status = 400;
      throw error;
    }

    if (process.env.USE_MOCKS === 'true') {
      const lowered = identifierInput.toLowerCase();
      const mockUser = getUsers().find(
        (user) =>
          user.email.toLowerCase() === lowered || user.login?.toLowerCase() === lowered,
      );
      if (!mockUser) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      const role = resolveUserRole(mockUser);
      setSessionCookie(res, 'mock-jwt-token');
      return res.json({
        token: 'mock-jwt-token',
        user: { ...mockUser, role },
      });
    }

    const user = await userModel.findByLoginOrEmail(identifierInput);
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

    const role = resolveUserRole(user);
    const token = createToken({ ...user, role });

    setSessionCookie(res, token);
    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        canBypassAuthorProposals: Boolean(user.canBypassAuthorProposals),
        canBypassBookProposals: Boolean(user.canBypassBookProposals),
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
      const role = resolveUserRole(mockUser);
      return res.json({ user: { ...mockUser, role } });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    const role = resolveUserRole(user);
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
    const fallBackLogin = normalizeLoginInput(payload.email?.split('@')[0]) || 'google-user';
    const fallbackUser = {
      id: 1000,
      login: fallBackLogin,
      firstName: payload.firstName || 'Utilisateur',
      lastName: payload.lastName || '',
      email: payload.email,
      createdAt: new Date().toISOString(),
      role: 'user',
      canBypassBookProposals: false,
      canBypassAuthorProposals: false,
    };
    const baseUser = existing || fallbackUser;
    const role = resolveUserRole(baseUser);

    setSessionCookie(res, 'mock-jwt-token');
    return res.json({
      token: 'mock-jwt-token',
      user: {
        ...baseUser,
        role,
        canBypassBookProposals: Boolean(baseUser.canBypassBookProposals),
        canBypassAuthorProposals: Boolean(baseUser.canBypassAuthorProposals),
      },
    });
    }

    const payload = await verifyGoogleCredential(credential);
    if (!payload.emailVerified) {
      const error = new Error('Votre adresse email Google doit être vérifiée');
      error.status = 401;
      throw error;
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    let user = await userModel.findByGoogleId(payload.googleId);
    if (!user) {
      const existingByEmail = await userModel.findByEmail(normalizedEmail);
      if (existingByEmail) {
        await userModel.setGoogleId(existingByEmail.id, payload.googleId);
        user = { ...existingByEmail, googleId: payload.googleId };
      } else {
        const passwordHash = await bcrypt.hash(generateRandomPassword(), 10);
        const loginSeed = payload.email?.split('@')[0] || payload.firstName || payload.lastName || 'reader';
        const login = await generateAvailableLogin(loginSeed);
        const derivedRole = 'user';
        user = await userModel.createUser({
          login,
          firstName: payload.firstName || 'Utilisateur',
          lastName: payload.lastName || '',
          email: normalizedEmail,
          passwordHash,
          googleId: payload.googleId,
          role: derivedRole,
        });
      }
    }

    const role = resolveUserRole(user);
    const token = createToken({ ...user, role });

    setSessionCookie(res, token);
    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        canBypassBookProposals: Boolean(user.canBypassBookProposals),
        canBypassAuthorProposals: Boolean(user.canBypassAuthorProposals),
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
