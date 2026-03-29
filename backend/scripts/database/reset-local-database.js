const { connectMongo, disconnectMongo, mongoConnection } = require("../../database/mongo");
const config = require("../../src/config/env");

async function resetLocalDatabase() {
  await connectMongo(config.mongoUri);
  await mongoConnection.dropDatabase();
  console.log(`[reset] Dropped database ${mongoConnection.name}.`);
}

resetLocalDatabase()
  .catch((error) => {
    console.error("[reset] Failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
