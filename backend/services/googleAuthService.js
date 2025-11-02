const { OAuth2Client } = require('google-auth-library');

const normalizeBase64 = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  return (value + padding).replace(/-/g, '+').replace(/_/g, '/');
};

const decodeMockCredential = (credential) => {
  if (typeof credential !== 'string' || credential.trim().length === 0) {
    throw new Error('Invalid Google credential');
  }

  const segments = credential.split('.');
  const payloadSegment = segments.length === 3 ? segments[1] : credential;

  try {
    const json = Buffer.from(normalizeBase64(payloadSegment), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    const err = new Error('Unable to decode mock Google credential');
    err.status = 400;
    throw err;
  }
};

let cachedClient;
const getOAuthClient = () => {
  if (cachedClient) {
    return cachedClient;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('GOOGLE_CLIENT_ID not configured');
    err.status = 500;
    throw err;
  }
  cachedClient = new OAuth2Client(clientId);
  return cachedClient;
};

const verifyGoogleCredential = async (credential) => {
  if (!credential) {
    const err = new Error('Google credential is required');
    err.status = 400;
    throw err;
  }

  if (process.env.USE_MOCKS === 'true') {
    const payload = decodeMockCredential(credential);
    if (!payload?.email || !payload?.sub) {
      const err = new Error('Google credential missing required claims');
      err.status = 400;
      throw err;
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? true,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      picture: payload.picture || null,
    };
  }

  try {
    const client = getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Unable to retrieve Google payload');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      picture: payload.picture || null,
    };
  } catch (error) {
    const err = new Error('Invalid Google credential');
    err.status = 401;
    throw err;
  }
};

module.exports = {
  verifyGoogleCredential,
};
