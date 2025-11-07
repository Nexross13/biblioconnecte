const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userModel = require('../models/userModel');
const passwordResetModel = require('../models/passwordResetModel');
const { sendEmail } = require('./emailService');
const { getUsers } = require('../data/mockData');
const mockPasswordResets = require('../data/mockPasswordResets');
const { PRIMARY_FRONTEND_ORIGIN } = require('../config/frontend');

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = Number(process.env.PASSWORD_RESET_CODE_TTL_MINUTES) || 15;
const FRONTEND_URL = PRIMARY_FRONTEND_ORIGIN;

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const generateCode = () => {
  const randomNumber = Math.floor(Math.random() * 10 ** CODE_LENGTH);
  return randomNumber.toString().padStart(CODE_LENGTH, '0');
};

const normalizeEmail = (email) => email?.trim().toLowerCase();

const buildResetEmail = ({ code }) => {
  const subject = 'Réinitialisation de votre mot de passe BiblioConnecte';
  const expiresLine =
    CODE_TTL_MINUTES === 1
      ? 'Ce code expire dans 1 minute.'
      : `Ce code expire dans ${CODE_TTL_MINUTES} minutes.`;
  const resetUrl = `${FRONTEND_URL.replace(/\/$/, '')}/reset-password`;

  const text = [
    'Bonjour,',
    '',
    'Nous avons reçu une demande de réinitialisation de votre mot de passe BiblioConnecte.',
    `Votre code de validation : ${code}`,
    expiresLine,
    '',
    `Vous pouvez saisir ce code sur la page de réinitialisation : ${resetUrl}`,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.",
    '',
    'À très vite sur BiblioConnecte !',
  ].join('\n');

  const html = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f8fafc;padding:24px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:520px;width:92%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 18px 32px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;letter-spacing:0.04em;text-transform:uppercase;">BiblioConnecte</h1>
              <p style="margin:10px 0 0;font-size:14px;opacity:0.85;">Réinitialisation de mot de passe</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#0f172a;">
              <p style="margin:0 0 16px;font-size:16px;">Bonjour,</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                Nous avons reçu une demande de réinitialisation de votre mot de passe BiblioConnecte.
                Saisissez le code ci-dessous pour confirmer qu'il s'agit bien de vous :
              </p>
              <div style="display:inline-block;padding:14px 28px;margin:16px 0;font-size:24px;font-weight:700;letter-spacing:0.18em;color:#1e293b;background-color:#f8fafc;border:1px solid #cbd5f5;border-radius:12px;">
                ${code}
              </div>
              <p style="margin:0 0 16px;font-size:15px;color:#475569;">${expiresLine}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                Pour continuer, rendez-vous sur la page sécurisée de réinitialisation&nbsp;:
                <a href="${resetUrl}" style="color:#2563eb;font-weight:600;text-decoration:underline;">
                  ${resetUrl}
                </a>
              </p>
              <p style="margin:24px 0 0;font-size:14px;color:#94a3b8;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { subject, text, html };
};

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const requestPasswordReset = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw createError(400, 'Adresse email invalide');
  }

  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  const code = generateCode();
  const emailExists = await (async () => {
    if (process.env.USE_MOCKS === 'true') {
      const user = getUsers().find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return false;
      }

      mockPasswordResets.createRequest({
        email: normalizedEmail,
        userId: user.id,
        code,
        expiresAt,
      });
      return true;
    }

    const user = await userModel.findByEmail(normalizedEmail);
    if (!user) {
      return false;
    }

    await passwordResetModel.createResetRequest({
      userId: user.id,
      codeHash: hashCode(code),
      expiresAt,
    });

    const emailPayload = buildResetEmail({ code });
    await sendEmail({
      to: normalizedEmail,
      ...emailPayload,
    });
    return true;
  })();

  if (process.env.USE_MOCKS === 'true' && emailExists) {
    // For development convenience, log the code when mocks are active.
    console.info(`🔐 Code de réinitialisation mock pour ${normalizedEmail}: ${code}`);
  }

  return { emailExists };
};

const loadResetContext = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw createError(400, 'Adresse email invalide');
  }

  if (process.env.USE_MOCKS === 'true') {
    const user = getUsers().find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { user: null, request: null };
    }
    const request = mockPasswordResets.getActiveRequest(normalizedEmail);
    return { user, request };
  }

  const user = await userModel.findByEmail(normalizedEmail);
  if (!user) {
    return { user: null, request: null };
  }

  const request = await passwordResetModel.getActiveRequestForUser(user.id);
  return { user, request };
};

const verifyPasswordResetCode = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = typeof code === 'string' ? code.trim() : '';

  if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
    throw createError(400, 'Code de réinitialisation invalide');
  }

  const { user, request } = await loadResetContext(normalizedEmail);

  if (!user || !request) {
    throw createError(400, 'Code expiré ou invalide');
  }

  if (process.env.USE_MOCKS === 'true') {
    if (request.code !== normalizedCode) {
      throw createError(400, 'Code expiré ou invalide');
    }
    return { user, request };
  }

  if (request.codeHash !== hashCode(normalizedCode)) {
    throw createError(400, 'Code expiré ou invalide');
  }

  return { user, request };
};

const resetPassword = async ({ email, code, password }) => {
  const trimmedPassword = typeof password === 'string' ? password.trim() : '';
  if (!trimmedPassword || trimmedPassword.length < 8) {
    throw createError(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères');
  }

  const { user, request } = await verifyPasswordResetCode({ email, code });

  if (!user || !request) {
    throw createError(400, 'Code expiré ou invalide');
  }

  if (process.env.USE_MOCKS === 'true') {
    mockPasswordResets.consumeRequest(email);
    return { userId: user.id };
  }

  const passwordHash = await bcrypt.hash(trimmedPassword, 10);
  await userModel.updateUserPassword(user.id, passwordHash);
  await passwordResetModel.consumeRequest(request.id);

  return { userId: user.id };
};

module.exports = {
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
  loadResetContext,
};
