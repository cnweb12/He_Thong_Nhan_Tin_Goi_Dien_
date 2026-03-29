const { CallModel } = require("../models/call.model");

async function createCallLog(payload) {
  return CallModel.create(payload);
}

module.exports = {
  createCallLog,
};
