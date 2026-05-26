const validators = require("../validators/user.validator");
const { userService } = require("../services/user.service");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createUserController(dependencies = {}) {
  const service = dependencies.userService || userService;
  const userValidators = dependencies.validators || validators;

  async function getMe(req, res, next) {
    try {
      const user = await service.getCurrentUser(req.user.userId);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async function getUserById(req, res, next) {
    try {
      const validation = userValidators.validateGetUserParams(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const user = await service.getUserById(req.params.userId);
      
      // Filter sensitive data for public profile (not current user)
      const { phone, settings, ...publicUser } = user;
      
      res.json({ ok: true, data: publicUser });
    } catch (error) {
      next(error);
    }
  }

  async function searchUsers(req, res, next) {
    try {
      const validation = userValidators.validateSearchUsersQuery(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
      const users = await service.searchUsers({
        query: req.query.q,
        limit,
        excludeUserId: req.user.userId,
      });

      res.json({ ok: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async function updateMe(req, res, next) {
    try {
      const validation = userValidators.validateUpdateProfileRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const user = await service.updateProfile(req.user.userId, req.body);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async function updateMySettings(req, res, next) {
    try {
      const validation = userValidators.validateUpdateSettingsRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const user = await service.updateSettings(req.user.userId, req.body);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async function sendFriendRequest(req, res, next) {
    try {
      await service.sendFriendRequest(req.user.userId, req.params.userId);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async function acceptFriendRequest(req, res, next) {
    try {
      await service.acceptFriendRequest(req.user.userId, req.params.userId);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async function listFriends(req, res, next) {
    try {
      const friends = await service.listFriends(req.user.userId);
      res.json({ ok: true, data: friends });
    } catch (error) {
      next(error);
    }
  }

  async function listPendingRequests(req, res, next) {
    try {
      const requests = await service.listPendingRequests(req.user.userId);
      res.json({ ok: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  async function removeFriend(req, res, next) {
    try {
      await service.removeFriend(req.user.userId, req.params.userId);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  return {
    getMe,
    getUserById,
    searchUsers,
    updateMe,
    updateMySettings,
    sendFriendRequest,
    acceptFriendRequest,
    listFriends,
    listPendingRequests,
    removeFriend,
  };
}

module.exports = {
  createUserController,
  userController: createUserController(),
};
