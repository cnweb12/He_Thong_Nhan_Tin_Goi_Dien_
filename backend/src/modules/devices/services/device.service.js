const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { UserDeviceModel } = require("../models/user-device.model");

function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

function toPlainObject(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toObject === "function") {
    return value.toObject();
  }

  return value;
}

function sanitizeDevice(device) {
  const value = toPlainObject(device);
  if (!value) {
    return null;
  }

  const { pushToken, ...safeDevice } = value;
  return safeDevice;
}

function createDeviceService(dependencies = {}) {
  const mongoErrorMapper = dependencies.mapMongoError || mapMongoError;
  const deviceModel = dependencies.UserDeviceModel || UserDeviceModel;

  async function upsertCurrentDevice({ userId, deviceId, platform, pushToken, isOnline = true, lastActiveAt = new Date() }) {
    try {
      const update = {
        $set: {
          platform,
          isOnline,
          lastActiveAt,
        },
        $setOnInsert: {
          userId,
          deviceId,
        },
      };

      if (pushToken !== undefined) {
        update.$set.pushToken = pushToken;
      }

      const device = await deviceModel.findOneAndUpdate({ userId, deviceId }, update, {
        new: true,
        upsert: true,
        runValidators: true,
      });

      return sanitizeDevice(device);
    } catch (error) {
      const mapped = mongoErrorMapper(error);
      error.statusCode = error.statusCode || mapped.statusCode;
      error.details = error.details || mapped.details;
      error.message = error.statusCode === 500 ? mapped.message : error.message;
      throw error;
    }
  }

  async function listUserDevices(userId) {
    const devices = await deviceModel.find({ userId }).sort({ lastActiveAt: -1, createdAt: -1 }).lean();
    return devices.map(sanitizeDevice);
  }

  async function updateCurrentDevicePresence({ userId, deviceId, isOnline, lastActiveAt = new Date() }) {
    try {
      const device = await deviceModel.findOneAndUpdate(
        { userId, deviceId },
        {
          $set: {
            isOnline,
            lastActiveAt,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!device) {
        throw createHttpError(404, "Device not found");
      }

      return sanitizeDevice(device);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  return {
    upsertCurrentDevice,
    listUserDevices,
    updateCurrentDevicePresence,
    sanitizeDevice,
  };
}

module.exports = {
  createDeviceService,
  deviceService: createDeviceService(),
};
