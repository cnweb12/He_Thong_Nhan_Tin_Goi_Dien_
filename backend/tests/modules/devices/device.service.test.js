const test = require("node:test");
const assert = require("node:assert/strict");

const { createDeviceService } = require("../../../src/modules/devices/services/device.service");

function createDeviceListQuery(items) {
  return {
    sort(sortArg) {
      this.sortArg = sortArg;
      return {
        lean: async () => items,
      };
    },
  };
}

test("upsertCurrentDevice sanitizes pushToken from response", async () => {
  let receivedUpdate;
  const service = createDeviceService({
    UserDeviceModel: {
      findOneAndUpdate: async (_filter, update) => {
        receivedUpdate = update;
        return {
          _id: "device-db-1",
          userId: "user-1",
          deviceId: "device-1",
          platform: "web",
          pushToken: "secret-token",
          isOnline: true,
          lastActiveAt: new Date("2026-04-27T10:00:00.000Z"),
          toObject() {
            return { ...this };
          },
        };
      },
    },
  });

  const device = await service.upsertCurrentDevice({
    userId: "user-1",
    deviceId: "device-1",
    platform: "web",
    pushToken: "secret-token",
  });

  assert.equal(receivedUpdate.$set.pushToken, "secret-token");
  assert.equal(device.pushToken, undefined);
  assert.equal(device.deviceId, "device-1");
});

test("listUserDevices omits pushToken", async () => {
  const service = createDeviceService({
    UserDeviceModel: {
      find: () =>
        createDeviceListQuery([
          {
            deviceId: "device-1",
            platform: "web",
            pushToken: "secret-token",
          },
        ]),
    },
  });

  const devices = await service.listUserDevices("user-1");
  assert.equal(devices[0].pushToken, undefined);
});

test("updateCurrentDevicePresence returns 404 when device does not exist", async () => {
  const service = createDeviceService({
    UserDeviceModel: {
      findOneAndUpdate: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.updateCurrentDevicePresence({
        userId: "user-1",
        deviceId: "device-1",
        isOnline: false,
      }),
    (error) => {
      assert.equal(error.statusCode, 404);
      return true;
    }
  );
});
