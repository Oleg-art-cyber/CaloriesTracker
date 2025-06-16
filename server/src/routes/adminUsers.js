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