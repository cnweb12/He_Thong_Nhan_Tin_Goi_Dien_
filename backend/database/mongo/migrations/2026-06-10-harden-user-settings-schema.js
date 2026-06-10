const appDbName = process.env.MONGO_APP_DB || "chat_app";
const appDb = db.getSiblingDB(appDbName);
const users = appDb.getCollection("users");

const legacyCount = users.countDocuments({ "settings.allowStrangerMessages": { $exists: true } });
if (legacyCount > 0) {
  const renameResult = users.updateMany(
    { "settings.allowStrangerMessages": { $exists: true } },
    { $rename: { "settings.allowStrangerMessages": "settings.allowStrangerMessage" } },
  );
  print(`Renamed settings.allowStrangerMessages on ${renameResult.modifiedCount} users.`);
} else {
  print("No legacy settings.allowStrangerMessages fields found.");
}

const collectionInfo = appDb.getCollectionInfos({ name: "users" })[0];
if (!collectionInfo) {
  throw new Error("Collection 'users' does not exist.");
}

const currentValidator = collectionInfo.options.validator || {};
const jsonSchema = currentValidator.$jsonSchema;
if (!jsonSchema?.properties?.settings) {
  throw new Error("Collection 'users' does not have a settings JSON schema to harden.");
}

jsonSchema.properties.settings.additionalProperties = false;

appDb.runCommand({
  collMod: "users",
  validator: {
    ...currentValidator,
    $jsonSchema: jsonSchema,
  },
  validationLevel: collectionInfo.options.validationLevel || "strict",
  validationAction: collectionInfo.options.validationAction || "error",
});

print("Hardened users.settings JSON schema with additionalProperties: false.");
