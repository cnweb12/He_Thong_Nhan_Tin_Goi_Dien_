const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../src/modules/devices/validators/device.validator");

test("validateUpsertCurrentDeviceRequest requires device id and platform", () => {
  const result = validators.validateUpsertCurrentDeviceRequest({ body: {} });
  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 2);
});

test("validateUpdateCurrentDevicePresenceRequest accepts valid body", () => {
  const result = validators.validateUpdateCurrentDevicePresenceRequest({
    body: { deviceId: "device-1", isOnline: true, lastActiveAt: "2026-04-27T10:00:00.000Z" },
  });

  assert.equal(result.isValid, true);
});
