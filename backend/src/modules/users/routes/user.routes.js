const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { requireUserRole } = require("../../auth/middleware/authorization.middleware");
const { userController } = require("../controllers/user.controller");
const { searchLimiter } = require("../../../middleware/rate-limit.middleware");

function createUserRouter(dependencies = {}) {
  const router = Router();
  const controller = {
    ...userController,
    ...(dependencies.userController || {}),
  };
  const authMiddleware = dependencies.authenticate || authenticateJWT(config.jwtSecret);
  //router cho riêng user
  router.use(authMiddleware);
  router.get("/me", controller.getMe);
  router.patch("/me", controller.updateMe);
  router.patch("/me/settings", controller.updateMySettings);
  // Specific /me routes must stay before /:userId so Express does not treat "me" as a userId.
  router.get("/me/friends", requireUserRole(), controller.listFriends);
  router.get("/me/friend-requests", requireUserRole(), controller.listPendingRequests);
  router.get("/search", searchLimiter, controller.searchUsers);
  router.get("/:userId", controller.getUserById);
  //router cho nghiệp vụ bạn bè - chỉ user thường được dùng
  router.post("/:userId/friends", requireUserRole(), controller.sendFriendRequest);
  router.post("/:userId/friends/accept", requireUserRole(), controller.acceptFriendRequest);
  router.delete("/:userId/friends", requireUserRole(), controller.removeFriend);

  return router;
}

module.exports = {
  createUserRouter,
  userRouter: createUserRouter(),
};
