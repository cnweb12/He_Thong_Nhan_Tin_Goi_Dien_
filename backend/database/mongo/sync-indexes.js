const { connectMongo, disconnectMongo, mongoose } = require("./connection");
const { registerModels } = require("./register-models");
const config = require("../../src/config/env");

async function syncIndexes() {
  registerModels();
  await connectMongo(config.mongoUri);

  const modelNames = Object.keys(mongoose.models);

  for (const modelName of modelNames) {
    const model = mongoose.models[modelName];
    await model.syncIndexes();
    console.log(`[mongo] Synced indexes for ${model.collection.collectionName}.`);
  }
}

if (require.main === module) {
  syncIndexes()
    .catch((error) => {
      console.error("[mongo] Failed to sync indexes.", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectMongo();
    });
}

module.exports = {
  syncIndexes,
};
