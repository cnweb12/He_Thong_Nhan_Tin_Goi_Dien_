const validators = require("../validators/device.validator");
const { deviceService } = require("../services/device.service");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createDeviceController(dependencies = {}) {
  const service = dependencies.deviceService || deviceService;
  const deviceValidators = dependencies.validators || validators;

  async function upsertCurrent(req, res, next) {
    try {
      const validation = deviceValidators.validateUpsertCurrentDeviceRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const device = await service.upsertCurrentDevice({
        userId: req.user.userId,
        deviceId: req.body.deviceId,
        platform: req.body.platform,
        pushToken: req.body.pushToken,
        isOnline: req.body.isOnline === undefined ? true : req.body.isOnline,
        lastActiveAt: req.body.lastActiveAt ? new Date(req.body.lastActiveAt) : new Date(),
      });

      res.status(201).json({
        ok: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  async function getMyDevices(req, res, next) {
    try {
      const devices = await service.listUserDevices(req.user.userId);
      res.json({
        ok: true,
        data: devices,
      });
    } catch (error) {
      next(error);
    }
  }

  async function updateCurrentPresence(req, res, next) {
    try {
      const validation = deviceValidators.validateUpdateCurrentDevicePresenceRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const device = await service.updateCurrentDevicePresence({
        userId: req.user.userId,
        deviceId: req.body.deviceId,
        isOnline: req.body.isOnline,
        lastActiveAt: req.body.lastActiveAt ? new Date(req.body.lastActiveAt) : new Date(),
      });

      res.json({
        ok: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    upsertCurrent,
    getMyDevices,
    updateCurrentPresence,
  };
}

module.exports = {
  createDeviceController,
  deviceController: createDeviceController(),
};
