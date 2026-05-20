const { Router } = require("express");
const config = require("../../../config/env");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
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
  router.get("/search", searchLimiter, controller.searchUsers);
  router.get("/:userId", controller.getUserById);
  //router cho nghiệp vụ bạn bè
  router.get("/me/friends", controller.listFriends);
  router.get("/me/friend-requests", controller.listPendingRequests);
  router.post("/:userId/friends", controller.sendFriendRequest);
  router.post("/:userId/friends/accept", controller.acceptFriendRequest);
  router.delete("/:userId/friends", controller.removeFriend);
  
  return router;
}

module.exports = {
  createUserRouter,
  userRouter: createUserRouter(),
};
