const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("node:path");
const { test } = require("node:test");
const fs = require("node:fs");

async function runTests() {
  console.log("🔄 Đang khởi động In-Memory MongoDB...");
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log(`✅ In-Memory DB chạy tại: ${uri}`);

  // Thiết lập biến môi trường để test file sử dụng
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = "test";

  const backendDir = path.join(__dirname, "..");

  try {
    console.log("🧪 Đang tiến hành chạy test...");

    // Load global hooks
    require(path.join(backendDir, "tests", "global-hooks.js"));

    // Find all test files recursively
    const testFiles = [];
    const testsDir = path.join(backendDir, "tests");

    const args = process.argv.slice(2);
    if (args.length > 0) {
      for (const arg of args) {
        testFiles.push(path.resolve(process.cwd(), arg));
      }
    } else {
      function findTestFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            findTestFiles(fullPath);
          } else if (entry.name.endsWith(".test.js")) {
            testFiles.push(fullPath);
          }
        }
      }
      findTestFiles(testsDir);
    }
    console.log(`📝 Tìm thấy ${testFiles.length} test files`);

    // Run tests using Node's test runner with concurrency=1
    const { run } = require("node:test");

    const stream = run({
      files: testFiles,
      concurrency: 1,
      timeout: 30000,
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
      console.log("🎉 Tất cả test đều thành công!");
    }
  } catch (error) {
    console.error("❌ Test thất bại.", error.message);
    process.exitCode = 1;
  } finally {
    console.log("🧹 Đang dọn dẹp (tắt In-Memory MongoDB)...");
    await mongoServer.stop();
    console.log("✅ Đã tắt In-Memory DB thành công.");
  }

  // Explicitly exit the process to prevent hanging
  process.exit(process.exitCode || 0);
}

runTests();
