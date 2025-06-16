// server/src/middlewares/ownership.js
// Allow admin always, otherwise only owner

/**
 * Ownership Middleware
 * Verifies resource ownership for non-admin users
 * Allows admin users to bypass ownership checks
 * 
 * Usage:
 * router.put('/products/:id', auth(), ownership, updateProduct);
 * 
 * Requirements:
 * - Must be used after auth middleware
 * - Request must include user object with id and role
 * - URL must include resource id parameter
 * 
 * Response codes:
 * - 403: User is not the owner of the resource
 * - 404: Resource not found
 * - 500: Database error
 */
const db = require('../config/dbSingleton');
const connection = db.getConnection();

module.exports = (req, res, next) => {
    const { id: userId, role } = req.user;

    // Admin users bypass ownership checks
    if (role === 'admin') {
        return next();
    }

    // Get resource ID from URL parameters
    const prodId = Number(req.params.id);

    // Query database to check resource ownership
    connection.query(
        'SELECT created_by FROM product WHERE id = ?',
        [prodId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'DB error' });
            }
            if (!rows.length) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Compare resource owner ID with current user ID
            const ownerId = Number(rows[0].created_by);
            if (ownerId !== Number(userId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            next();
        }
    );
};
