let isRegistered = false;

function registerModels() {
  if (isRegistered) {
    return;
  }

  require("../../src/modules/users/models/user.model");
  require("../../src/modules/auth/models/refresh-token.model");
  require("../../src/modules/devices/models/user-device.model");
  require("../../src/modules/conversations/models/conversation.model");
  require("../../src/modules/conversations/models/conversation-member.model");
  require("../../src/modules/conversations/models/user-conversation-inbox.model");
  require("../../src/modules/messages/models/message.model");
  require("../../src/modules/calls/models/call.model");
  require("../../src/modules/admin/models/system-settings.model");
  require("../../src/modules/admin/models/banned-keyword.model");

  isRegistered = true;
}

module.exports = {
  registerModels,
};
