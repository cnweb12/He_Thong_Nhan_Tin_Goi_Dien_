const { mongoose } = require("./connection");
const { MONGO_READY_STATES } = require("./constants");

async function checkMongoHealth() {
  const readyState = mongoose.connection.readyState;

  return {
    ok: readyState === MONGO_READY_STATES.connected,
    readyState,
    dbName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
}

module.exports = {
  checkMongoHealth,
};
