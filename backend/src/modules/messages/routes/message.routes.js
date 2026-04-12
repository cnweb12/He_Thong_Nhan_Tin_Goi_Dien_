const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { messageController } = require("../controllers/message.controller");

function createMessageRouter(dependencies = {}) {
  const router = Router();
  const controller = {
    ...messageController,
    ...(dependencies.messageController || {}),
  };
  const authMiddleware = dependencies.authenticate || authenticateJWT(config.jwtSecret);

  router.use(authMiddleware);
  router.post("/", controller.sendMessage);
  router.get("/conversations/:conversationId", controller.getConversationMessages);

  return router;
}

module.exports = {
  createMessageRouter,
  messageRouter: createMessageRouter(),
};
