const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { callController } = require("../controllers/call.controller");

function createCallRouter(dependencies = {}) {
  const router = Router();
  const controller = {
    ...callController,
    ...(dependencies.callController || {}),
  };
  const authMiddleware = dependencies.authenticate || authenticateJWT(config.jwtSecret);

  router.use(authMiddleware);
  router.post("/", controller.create);

  return router;
}

module.exports = {
  createCallRouter,
  callRouter: createCallRouter(),
};