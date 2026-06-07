const test = require("node:test");
const assert = require("node:assert/strict");
const { uploadFiles } = require("../../../src/modules/upload/controllers/upload.controller");

test("uploadFiles returns 400 if no files are uploaded", async () => {
  const req = { files: [] };
  let errorArgs = null;
  const next = (err) => { errorArgs = err; };
  const res = {};

  await uploadFiles(req, res, next);

  assert.equal(errorArgs.statusCode, 400);
  assert.equal(errorArgs.message, "No files uploaded");
});

test("uploadFiles returns 400 if req.files is undefined", async () => {
  const req = {};
  let errorArgs = null;
  const next = (err) => { errorArgs = err; };
  const res = {};

  await uploadFiles(req, res, next);

  assert.equal(errorArgs.statusCode, 400);
  assert.equal(errorArgs.message, "No files uploaded");
});

test("uploadFiles returns formatted URLs for uploaded files", async () => {
  const req = {
    files: [
      {
        filename: "test-123.jpg",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      }
    ]
  };
  let statusCode = null;
  let jsonResponse = null;
  const res = {
    status: (code) => { statusCode = code; return res; },
    json: (data) => { jsonResponse = data; }
  };
  const next = (err) => { throw err; };

  await uploadFiles(req, res, next);

  assert.equal(statusCode, 201);
  assert.equal(jsonResponse.ok, true);
  assert.equal(jsonResponse.data.length, 1);
  assert.equal(jsonResponse.data[0].url, "/uploads/test-123.jpg");
  assert.equal(jsonResponse.data[0].originalname, "test.jpg");
});
