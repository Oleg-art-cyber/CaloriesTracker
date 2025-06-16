/**
 * Physical Activity Routes
 * Handles user exercise logging and activity tracking
 * Provides endpoints for recording and managing physical activities
 */
const router = require('express').Router();
const activityCtl = require('../controllers/physicalActivity'); // Adjust path to your controller
const authMiddleware = require('../middlewares/auth'); // Adjust path to your auth middleware

// Apply authentication middleware to all physical activity routes
// Only authenticated users and admins can access these endpoints
router.use(authMiddleware(['user', 'admin']));

/**
 * Log a new physical activity
 * POST /api/physical-activity
 * 
 * Request body:
 * - exercise_definition_id: ID of the exercise performed
 * - duration_minutes: Duration of the activity in minutes
 * - activity_date: Date of the activity (YYYY-MM-DD format)
 * 
 * Response:
 * - 201: Activity logged successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 500: Server error
 */
router.post('/', activityCtl.logActivity);

/**
 * Delete a physical activity
 * DELETE /api/physical-activity/:activityId
 * 
 * URL parameters:
 * - activityId: ID of the activity to delete
 * 
 * Response:
 * - 200: Activity deleted successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Activity not found
 * - 500: Server error
 */
router.delete('/:activityId', activityCtl.deleteActivity);
// router.put('/:activityId', activityCtl.updateActivity); // If you implement update

module.exports = router;