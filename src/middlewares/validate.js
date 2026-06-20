/**
 * Joi validation middleware factory.
 * Accepts a Joi schema and returns an Express middleware that validates
 * req.body (or req.params/req.query if specified) against the schema.
 * Returns structured 400 errors on validation failure.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Collect all errors, not just the first
      stripUnknown: true, // Remove unknown fields silently
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, "'"),
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details,
      });
    }

    // Replace the request source with the validated (and stripped) value
    req[source] = value;
    next();
  };
};

module.exports = validate;
