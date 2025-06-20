/**
 * Admin Statistics Routes
 * Handles administrative statistics and analytics
 * Provides endpoints for retrieving system-wide metrics and user statistics
 * Restricted to admin users only
 */
const router = require('express').Router();
const adminStatsController = require('../controllers/adminStatistics');
const authMiddleware = require('../middlewares/auth'); // Your existing auth middleware

// Apply authentication middleware to all admin statistics routes
// Only users with admin role can access these endpoints
router.use(authMiddleware(['admin']));

/**
 * Get dashboard statistics
 * GET /api/admin/statistics
 * 
 * Response:
 * - 200: Dashboard statistics including:
 *   - Total users
 *   - Active users
 *   - Total meals logged
 *   - Total exercises logged
 *   - System usage metrics
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 500: Server error
 */
router.get('/statistics', adminStatsController.getDashboardStatistics);

module.exports = router;