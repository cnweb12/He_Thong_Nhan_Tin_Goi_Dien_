module.exports = {
  nodeEnv: "test",
  mongoDbName: process.env.MONGO_TEST_DB || "chat_app_test",
  mongoUri:
    process.env.MONGO_TEST_URI ||
    "mongodb://chat_app_user:chat_app_password@127.0.0.1:27018/chat_app_test?authSource=chat_app_test",
};
