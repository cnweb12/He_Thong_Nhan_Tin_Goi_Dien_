const errorHandler = (err, _req, res, _next) => {
  console.error("=== GLOBAL ERROR ===", err);
  if (err.errInfo) {
    console.error("Mongo errInfo:", JSON.stringify(err.errInfo, null, 2));
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  const response = {
    ok: false,
    message,
  };

  if (process.env.NODE_ENV !== "production") {
    if (err.details) response.details = err.details;
    if (err.stack) response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  errorHandler
};
