const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { twilioController } = require("../controllers/twilio.controller");

function createTwilioRouter(dependencies = {}) {
  const router = Router();
  const controller = {
    ...twilioController,
    ...(dependencies.twilioController || {}),
  };
  const authMiddleware = dependencies.authenticate || authenticateJWT(config.jwtSecret);

  // GET /api/twilio/token is authenticated
  router.get("/token", authMiddleware, controller.getAccessToken);

  // POST /api/twilio/voice is NOT authenticated (called by Twilio)
  router.post("/voice", controller.handleVoiceWebhook);

  return router;
}

module.exports = {
  createTwilioRouter,
  twilioRouter: createTwilioRouter(),
};
