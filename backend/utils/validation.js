const { validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    // eslint-disable-next-line no-await-in-loop
    await validation.run(req);
  }

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formatted = errors.array().map((error) => ({
    field: error.param,
    message: error.msg,
  }));

  const err = new Error('Validation failed');
  err.status = 422;
  err.details = formatted;
  return next(err);
};

module.exports = {
  validate,
};
