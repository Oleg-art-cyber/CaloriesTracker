//server/src/middlewares/auth.js
// JWT / Role authorization middleware
// Usage: router.post('/route', auth(['admin']), handler);

/**
 * Authentication Middleware
 * Handles JWT token verification and role-based authorization
 * 
 * @param {string[]} roles - Array of allowed roles. If empty, any authenticated user is allowed
 * @returns {Function} Express middleware function
 * 
 * Usage:
 * - For any authenticated user: router.use(auth())
 * - For specific roles: router.use(auth(['admin', 'user']))
 * 
 * Headers required:
 * - Authorization: Bearer <jwt_token>
 * 
 * Response codes:
 * - 401: No token provided or invalid/expired token
 * - 403: User's role is not authorized
 */
const jwt = require('jsonwebtoken');
const SECRET = 'supersecret'; // TODO: move to .env

module.exports = (roles = []) => (req, res, next) => {
    // Extract token from Authorization header
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    // Check if token exists
    if (!token)
        return res.status(401).json({ error: 'No token provided' });

    try {
        // Verify and decode JWT token
        const payload = jwt.verify(token, SECRET); // { id, role, iat, exp }

        // Check role authorization if roles are specified
        if (roles.length && !roles.includes(payload.role))
            return res.status(403).json({ error: 'Forbidden' });

        // Attach user information to request object
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
