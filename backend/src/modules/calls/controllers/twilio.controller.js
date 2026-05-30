const twilio = require("twilio");
const { twilioService } = require("../services/twilio.service");

function createTwilioController(dependencies = {}) {
  const service = dependencies.twilioService || twilioService;

  async function getAccessToken(req, res, next) {
    try {
      const userId = req.user.userId;
      const token = service.generateAccessToken(userId);
      res.json({ ok: true, data: { token } });
    } catch (error) {
      next(error);
    }
  }

  async function handleVoiceWebhook(req, res, next) {
    try {
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const response = new VoiceResponse();

      const to = req.body.To;
      
      console.log(`[twilio webhook] Received voice request from: ${req.body.From}, to: ${to}`);

      if (to) {
        const dial = response.dial({
          // Set a callerId for the dialed party. If the caller is a client,
          // we can specify the From value as is or clean it up.
          callerId: req.body.From || "client:unknown",
        });
        
        // Route to the callee client
        dial.client(to);
      } else {
        response.say("Welcome to our voice system. The destination was not specified.");
      }

      res.type("text/xml");
      res.send(response.toString());
    } catch (error) {
      console.error("[twilio webhook] Error processing voice webhook:", error);
      next(error);
    }
  }

  return {
    getAccessToken,
    handleVoiceWebhook,
  };
}

module.exports = {
  createTwilioController,
  twilioController: createTwilioController(),
};
