//server/src/middlewares/auth.js
// JWT / Role authorization middleware
// Usage: router.post('/route', auth(['admin']), handler);

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user information to request
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const jwt = require('jsonwebtoken');
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

module.exports = (allowedRoles = ['user', 'admin']) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const secret = process.env.JWT_SECRET || 'supersecret';
            const decoded = jwt.verify(token, secret);
            
            // Get user role from database
            const query = 'SELECT role FROM User WHERE id = ?';
            conn.query(query, [decoded.id], (err, results) => {
                if (err) {
                    console.error('Error fetching user role:', err);
                    return res.status(500).json({ error: 'Error verifying user role' });
                }

                if (results.length === 0) {
                    return res.status(401).json({ error: 'User not found' });
                }

                const userRole = results[0].role;
                
                // Check if user's role is allowed
                if (!allowedRoles.includes(userRole)) {
                    return res.status(403).json({ error: 'Insufficient permissions' });
                }

                // Attach user info to request
                req.user = {
                    id: decoded.id,
                    role: userRole
                };
                
                next();
            });
        } catch (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
};
