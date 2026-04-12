const validators = require("../validators/call.validator");
const { createCallLog } = require("../services/call.service");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createCallController(dependencies = {}) {
  const service = dependencies.callService || { createCallLog };
  const callValidators = dependencies.validators || validators;

  async function create(req, res, next) {
    try {
      const validation = callValidators.validateCreateCallLogRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const call = await service.createCallLog({
        ...req.body,
        initiatedBy: req.user?.userId || req.body.initiatedBy,
      });

      res.status(201).json({ ok: true, data: call });
    } catch (error) {
      next(error);
    }
  }

  return {
    create,
  };
}

module.exports = {
  createCallController,
  callController: createCallController(),
};