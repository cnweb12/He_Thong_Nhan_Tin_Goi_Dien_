const { Router } = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("../modules/auth/routes/auth.routes");
const { userRouter } = require("../modules/users/routes/user.routes");

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);

module.exports = router;
