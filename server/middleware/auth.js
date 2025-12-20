/**
 * Authentication middleware for protecting routes
 */

const userManager = require('../managers/userManager');

/**
 * Authenticate JWT token from Authorization header
 * Sets req.user if valid
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: true,
      code: 'NO_TOKEN',
      message: 'Access token required',
      status: 401
    });
  }

  const result = userManager.verify(token);
  if (!result.success) {
    return res.status(403).json({
      error: true,
      code: 'INVALID_TOKEN',
      message: result.error,
      status: 403
    });
  }

  req.user = result.decoded;
  next();
};

/**
 * Check if user has required permission
 * @param {array} requiredPermissions - array of permission strings
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        code: 'NOT_AUTHENTICATED',
        message: 'User not authenticated',
        status: 401
      });
    }

    const hasPermission = requiredPermissions.some(perm => 
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: true,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to access this resource',
        status: 403
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requirePermission
};
