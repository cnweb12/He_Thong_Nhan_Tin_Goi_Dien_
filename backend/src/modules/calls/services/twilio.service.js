const twilio = require("twilio");
const config = require("../../../config/env");

function createTwilioService() {
  const accountSid = config.twilioAccountSid;
  const apiKeySid = config.twilioApiKeySid;
  const apiKeySecret = config.twilioApiKeySecret;
  const twimlAppSid = config.twilioTwimlAppSid;

  function generateAccessToken(userId) {
    if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
      throw new Error("Twilio credentials are not fully configured in environment variables.");
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    const token = new AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      {
        identity: String(userId),
        // Token valid for 1 hour
        ttl: 3600,
      }
    );

    // Create a Voice grant which will allow the device to make and receive calls
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Allow receiving incoming calls
    });

    token.addGrant(voiceGrant);

    return token.toJwt();
  }

  return {
    generateAccessToken,
  };
}

module.exports = {
  createTwilioService,
  twilioService: createTwilioService(),
};
