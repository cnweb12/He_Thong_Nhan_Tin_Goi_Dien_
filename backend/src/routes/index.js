const { Router } = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("../modules/auth/routes/auth.routes");
const { userRouter } = require("../modules/users/routes/user.routes");
const {
  conversationRouter,
} = require("../modules/conversations/routes/conversation.routes");
const { messageRouter } = require("../modules/messages/routes/message.routes");
const { deviceRouter } = require("../modules/devices/routes/device.routes");
const { callRouter } = require("../modules/calls/routes/calls.routes");

const router = Router();

router.use(healthRouter);
router.use("/api/auth", authRouter);
router.use("/api/users", userRouter);
router.use("/api/conversations", conversationRouter);
router.use("/api/messages", messageRouter);
router.use("/api/devices", deviceRouter);
router.use("/api/calls", callRouter);

module.exports = router;
