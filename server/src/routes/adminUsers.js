// server/routes/adminUsers.js
/**
 * Admin Users Routes
 * Handles user management by administrators
 * Provides endpoints for viewing, updating, and deleting user accounts
 * Restricted to admin users only
 */
const router = require('express').Router();
const adminUsersController = require('../controllers/adminUsers');
const authMiddleware = require('../middlewares/auth');
const db = require('../config/dbSingleton').getConnection();

// Apply authentication middleware to all admin user routes
// Only users with admin role can access these endpoints
router.use(authMiddleware(['admin']));

/**
 * Get all users
 * GET /api/admin/users
 * 
 * Query parameters:
 * - page: Page number for pagination
 * - limit: Number of users per page
 * - search: Search term for filtering users
 * 
 * Response:
 * - 200: Paginated list of users with metadata
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 500: Server error
 */
router.get('/', adminUsersController.getAllUsers);

/**
 * Get new users in date range
 * GET /api/admin/users/new
 * 
 * Query parameters:
 * - startDate: Start date in YYYY-MM-DD format
 * - endDate: End date in YYYY-MM-DD format
 * 
 * Response:
 * - 200: List of new users in date range
 * - 400: Invalid date format or range
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 500: Server error
 */
router.get('/new', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        console.log('Received request with query params:', req.query);
        console.log('Parsed dates:', { startDate, endDate });
        
        if (!startDate || !endDate) {
            console.log('Missing date parameters');
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            console.log('Invalid date format:', { startDate, endDate });
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD format',
                received: { startDate, endDate }
            });
        }

        // Convert dates to Date objects for comparison
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.log('Invalid date values:', { start, end });
            return res.status(400).json({ 
                error: 'Invalid date values',
                received: { startDate, endDate }
            });
        }

        if (start > end) {
            console.log('Start date is after end date:', { start, end });
            return res.status(400).json({ 
                error: 'Start date cannot be after end date',
                received: { startDate, endDate }
            });
        }

        const query = `
            SELECT id, name, email, role, created_at
            FROM User
            WHERE created_at >= ? AND created_at <= ?
            ORDER BY created_at DESC
        `;

        console.log('Executing query with params:', [startDate, endDate]);

        db.query(query, [startDate, endDate], (err, results) => {
            if (err) {
                console.error('Error fetching new users:', err);
                return res.status(500).json({ 
                    error: 'Failed to fetch new users', 
                    details: err.message,
                    sqlMessage: err.sqlMessage,
                    query: query,
                    params: [startDate, endDate]
                });
            }
            
            console.log('Query result:', results);
            res.json(results);
        });
    } catch (error) {
        console.error('Error in new users route:', error);
        res.status(500).json({ 
            error: 'Failed to fetch new users', 
            details: error.message
        });
    }
});

/**
 * Get a specific user by ID
 * GET /api/admin/users/:userId
 * 
 * URL parameters:
 * - userId: ID of the user to retrieve
 * 
 * Response:
 * - 200: Detailed user information
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: User not found
 * - 500: Server error
 */
router.get('/:userId', adminUsersController.getUserById);

/**
 * Update a user's information
 * PUT /api/admin/users/:userId
 * 
 * URL parameters:
 * - userId: ID of the user to update
 * 
 * Request body may include:
 * - name: User's full name
 * - email: User's email address
 * - role: User's role (user/admin)
 * - is_active: Account status
 * 
 * Response:
 * - 200: User updated successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: User not found
 * - 409: Email already in use
 * - 500: Server error
 */
router.put('/:userId', adminUsersController.updateUserByAdmin);

/**
 * Delete a user account
 * DELETE /api/admin/users/:userId
 * 
 * URL parameters:
 * - userId: ID of the user to delete
 * 
 * Response:
 * - 200: User deleted successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: User not found
 * - 500: Server error
 */
router.delete('/:userId', adminUsersController.deleteUserByAdmin);

module.exports = router;