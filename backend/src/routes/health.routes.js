const { Router } = require("express");
const { checkMongoHealth } = require("../../database/mongo");

const healthRouter = Router();

healthRouter.get("/health", async (_req, res, next) => {
  try {
    const mongo = await checkMongoHealth();
    const ok = mongo.ok;

    res.status(ok ? 200 : 503).json({
      ok,
      service: "backend",
      mongo,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = healthRouter;
