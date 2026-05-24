/**
 * Authorization middleware - Role-based access control
 */

/**
 * Check if user has one of the required roles
 * @param {...string} allowedRoles - List of allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      return next(error);
    }

    const userRole = req.user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      const error = new Error(
        `Access denied. Required roles: ${allowedRoles.join(", ")}, but user has role: ${userRole}`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
}

/**
 * Require admin or super_admin role
 * @returns {Function} Express middleware
 */
function requireAdmin() {
  return requireRole("admin", "super_admin");
}

/**
 * Require super_admin role only
 * @returns {Function} Express middleware
 */
function requireSuperAdmin() {
  return requireRole("super_admin");
}

/**
 * Require user role only (exclude admin and super_admin)
 * This is used to prevent admin from accessing regular user endpoints
 * @returns {Function} Express middleware
 */
function requireUserRole() {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      return next(error);
    }

    const userRole = req.user.role || "user";

    if (userRole !== "user") {
      const error = new Error(
        `Access denied. This endpoint is for regular users only. User has role: ${userRole}`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
}

module.exports = {
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireUserRole,
};
