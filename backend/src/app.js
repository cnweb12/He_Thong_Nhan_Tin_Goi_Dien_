const express = require("express");
const routes = require("./routes");

const app = express();

app.use(express.json());
app.use(routes);

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    ok: false,
    message,
    ...(process.env.NODE_ENV !== "production" && error.details ? { details: error.details } : {}),
  });
});

module.exports = app;
