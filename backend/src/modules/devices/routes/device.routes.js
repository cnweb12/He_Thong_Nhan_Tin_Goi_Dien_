const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { deviceController } = require("../controllers/device.controller");

function createDeviceRouter(dependencies = {}) {
  const router = Router();
  const controller = {
    ...deviceController,
    ...(dependencies.deviceController || {}),
  };
  const authMiddleware = dependencies.authenticate || authenticateJWT(config.jwtSecret);

  router.use(authMiddleware);
  router.put("/current", controller.upsertCurrent);
  router.get("/me", controller.getMyDevices);
  router.patch("/current/presence", controller.updateCurrentPresence);

  return router;
}

module.exports = {
  createDeviceRouter,
  deviceRouter: createDeviceRouter(),
};
