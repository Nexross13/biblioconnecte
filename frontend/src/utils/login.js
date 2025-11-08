export const LOGIN_REGEX = /^[a-z0-9._-]{3,30}$/;

export const normalizeLogin = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const isLoginValid = (value) => LOGIN_REGEX.test(value);
