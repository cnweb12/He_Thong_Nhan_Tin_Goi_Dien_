const express = require("express");
const routes = require("./routes");
const { errorHandler } = require("./middleware/error.middleware");
const { createCorsMiddleware } = require("./middleware/cors.middleware");
const config = require("./config/env");

const app = express();

app.use(createCorsMiddleware(config.corsOrigins));
app.use(express.json());
app.use(routes);

app.use(errorHandler);

module.exports = app;
