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
  router.get("/conversations/:conversationId", controller.getConversationCalls);
  router.patch("/:callId/status", controller.updateStatus);
  router.patch("/:callId/participants", controller.updateParticipant);

  return router;
}

module.exports = {
  createCallRouter,
  callRouter: createCallRouter(),
};