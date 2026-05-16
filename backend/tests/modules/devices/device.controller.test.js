const test = require("node:test");
const assert = require("node:assert/strict");

const { createDeviceController } = require("../../../src/modules/devices/controllers/device.controller");

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
}

test("upsertCurrent delegates to service with authenticated user id", async () => {
  let serviceCall;
  const controller = createDeviceController({
    validators: {
      validateUpsertCurrentDeviceRequest: () => ({ isValid: true, errors: [] }),
    },
    deviceService: {
      upsertCurrentDevice: async (payload) => {
        serviceCall = payload;
        return { deviceId: payload.deviceId };
      },
    },
  });
  const res = createResponse();

  await controller.upsertCurrent(
    {
      user: { userId: "user-1" },
      body: { deviceId: "device-1", platform: "web", isOnline: true },
    },
    res,
    () => {
      throw new Error("next should not be called");
    }
  );

  assert.equal(serviceCall.userId, "user-1");
  assert.equal(res.statusCode, 201);
});

test("getMyDevices returns service payload", async () => {
  const controller = createDeviceController({
    deviceService: {
      listUserDevices: async () => [{ deviceId: "device-1" }],
    },
  });
  const res = createResponse();

  await controller.getMyDevices({ user: { userId: "user-1" } }, res, () => {
    throw new Error("next should not be called");
  });

  assert.deepEqual(res.payload, {
    ok: true,
    data: [{ deviceId: "device-1" }],
  });
});

test("updateCurrentPresence forwards validation errors to next", async () => {
  const controller = createDeviceController({
    validators: {
      validateUpdateCurrentDevicePresenceRequest: () => ({
        isValid: false,
        errors: [{ field: "deviceId", message: "Device ID is required" }],
      }),
    },
  });
  let receivedError;

  await controller.updateCurrentPresence({ body: {}, user: { userId: "user-1" } }, createResponse(), (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 400);
});
