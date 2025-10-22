module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const details = err.details || undefined;

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error]', { message, stack: err.stack });
  }

  res.status(status).json({
    message,
    ...(details ? { details } : {}),
  });
};
