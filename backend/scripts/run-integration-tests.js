const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("node:path");
const fs = require("node:fs");
const { run } = require("node:test");

async function runIntegrationTests() {
  console.log("🔄 Đang khởi động In-Memory MongoDB cho integration tests...");
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'test_db' },
    replicaSet: { count: 1 }, // Enable replica set for transaction support
  });
  const uri = mongoServer.getUri();
  console.log(`✅ In-Memory DB chạy tại: ${uri}`);

  // Thiết lập biến môi trường để test file sử dụng
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret-key-for-integration-tests";

  const backendDir = path.join(__dirname, "..");
  const globalHooksPath = path.join(backendDir, "tests", "global-hooks.js");
  const globalHooksBackupPath = path.join(backendDir, "tests", "global-hooks.js.backup");
  const modulesTestPath = path.join(backendDir, "tests", "modules");
  const modulesTestBackupPath = path.join(backendDir, "tests", "modules.backup");

  // Temporarily rename global hooks and modules tests to prevent them from running
  // Integration tests need to maintain state across scenarios
  if (fs.existsSync(globalHooksPath)) {
    console.log("🔧 Temporarily disabling global hooks for integration tests...");
    fs.renameSync(globalHooksPath, globalHooksBackupPath);
  }
  
  if (fs.existsSync(modulesTestPath)) {
    console.log("🔧 Temporarily disabling unit tests for integration tests...");
    fs.renameSync(modulesTestPath, modulesTestBackupPath);
  }

  try {
    console.log("🧪 Đang tiến hành chạy integration tests...");

    const integrationDir = path.join(backendDir, "tests", "integration");
    const testFiles = [
      path.join(integrationDir, "full-user-flow.test.js"),
      path.join(integrationDir, "conversation-flow.test.js"),
      path.join(integrationDir, "device-management.test.js"),
      path.join(integrationDir, "session-management.test.js"),
      path.join(integrationDir, "admin-rbac.test.js"),
    ];

    const stream = run({
      files: testFiles,
      concurrency: 1,
      timeout: 60000, // Longer timeout for integration tests
    });

    let passed = 0;
    let failed = 0;

    for await (const event of stream) {
      if (event.type === "test:pass") {
        passed++;
      } else if (event.type === "test:fail") {
        failed++;
        // Show detailed failure information
        if (event.data) {
          console.error(`\n❌ Test failed: ${event.data.name}`);
          if (event.data.details) {
            console.error(
              `   Error: ${event.data.details.error?.message || "Unknown error"}`,
            );
            if (event.data.details.error?.stack) {
              console.error(`   Stack: ${event.data.details.error.stack}`);
            }
          }
          if (event.data.details?.error) {
            console.error(`   Full error:`, event.data.details.error);
          }
        }
      } else if (event.type === "test:stderr") {
        // Show stderr output from tests
        if (Buffer.isBuffer(event.data)) {
          process.stderr.write(event.data);
        } else if (typeof event.data === "string") {
          process.stderr.write(event.data);
        }
      } else if (event.type === "test:stdout") {
        // Show stdout output from tests
        if (Buffer.isBuffer(event.data)) {
          process.stdout.write(event.data);
        } else if (typeof event.data === "string") {
          process.stdout.write(event.data);
        }
      }
    }

    console.log(`\n📊 Kết quả: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      console.error(`❌ ${failed} test(s) thất bại.`);
      process.exitCode = 1;
    } else {
      console.log("🎉 Tất cả integration test đều thành công!");
    }
  } catch (error) {
    console.error("❌ Integration test thất bại.", error.message);
    process.exitCode = 1;
  } finally {
    console.log("🧹 Đang dọn dẹp (tắt In-Memory MongoDB)...");
    await mongoServer.stop();
    console.log("✅ Đã tắt In-Memory DB thành công.");

    // Restore global hooks and unit tests
    if (fs.existsSync(globalHooksBackupPath)) {
      console.log("🔧 Restoring global hooks...");
      fs.renameSync(globalHooksBackupPath, globalHooksPath);
    }
    
    if (fs.existsSync(modulesTestBackupPath)) {
      console.log("🔧 Restoring unit tests...");
      fs.renameSync(modulesTestBackupPath, modulesTestPath);
    }
  }

  // Explicitly exit the process to prevent hanging
  process.exit(process.exitCode || 0);
}

runIntegrationTests();
