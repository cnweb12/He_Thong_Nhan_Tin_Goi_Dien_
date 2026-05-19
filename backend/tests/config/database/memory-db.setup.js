const mongoose = require('mongoose');

async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function closeTestDB() {
  await mongoose.disconnect();
}

async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}

async function seedStaticData() {
  // Bổ sung các dữ liệu tĩnh nếu cần (e.g. Roles, Settings)
}

module.exports = {
  connectTestDB,
  closeTestDB,
  clearDatabase,
  seedStaticData
};
