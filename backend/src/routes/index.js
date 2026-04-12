const { Router } = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("../modules/auth/routes/auth.routes");
const { userRouter } = require("../modules/users/routes/user.routes");
const { messageRouter } = require("../modules/messages/routes/message.routes");
const { callRouter } = require("../modules/calls/routes/calls.routes");

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/messages", messageRouter);
router.use("/calls", callRouter);

module.exports = router;
