const { before, after, beforeEach } = require('node:test');
const { connectTestDB, closeTestDB, clearDatabase, seedStaticData } = require('./config/database/memory-db.setup');

before(async () => {
  console.log('[Hook] before: connecting to DB');
  await connectTestDB();
  console.log('[Hook] before: connected');
});

beforeEach(async () => {
  await clearDatabase();
  await seedStaticData();
});

after(async () => {
  console.log('[Hook] after: closing DB');
  await closeTestDB();
  console.log('[Hook] after: closed DB');
  // HACK: Force exit after tests are done if it hangs
  setTimeout(() => {
    console.log('[Hook] after: forcefully exiting due to hanging handles');
    process.exit(0);
  }, 100).unref();
});
