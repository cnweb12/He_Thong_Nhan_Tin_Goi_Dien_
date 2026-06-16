const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { conversationController } = require("../controllers/conversation.controller");

function createConversationRouter(dependencies = {}) {
  const router = Router();
  const controller = {
    ...conversationController,
    ...(dependencies.conversationController || {}),
  };
  const authMiddleware = dependencies.authenticate || authenticateJWT(config.jwtSecret);

  router.use(authMiddleware);
  router.post("/direct", controller.createDirect);
  router.get("/inbox", controller.getInbox);
  router.patch("/:conversationId/read", controller.markAsRead);
  router.delete("/:conversationId", controller.clearHistory);

  return router;
}

module.exports = {
  createConversationRouter,
  conversationRouter: createConversationRouter(),
};
