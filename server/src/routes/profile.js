/**
 * Profile Routes
 * Handles user profile management
 * Provides endpoints for viewing and updating user profile information
 */
const router = require('express').Router();
const profileController = require('../controllers/profile'); // Adjust path
const authMiddleware = require('../middlewares/auth');    // Adjust path

// Apply authentication middleware to all profile routes
// Only authenticated users and admins can access these endpoints
router.use(authMiddleware(['user', 'admin'])); // Or just authMiddleware() if no role check needed here

/**
 * Get user profile information
 * GET /api/profile
 * 
 * Response:
 * - 200: User profile data
 * - 401: Unauthorized
 * - 500: Server error
 * 
 * Returns:
 * - Basic user information
 * - Physical attributes
 * - Activity level
 * - Dietary preferences
 * - Health goals
 */
router.get('/', profileController.getProfile);

/**
 * Update user profile information
 * PUT /api/profile
 * 
 * Request body may include:
 * - name: User's full name
 * - email: User's email address
 * - height: Height in centimeters
 * - weight: Weight in kilograms
 * - age: Age in years
 * - gender: Biological sex
 * - activity_level: Activity level coefficient
 * - goal: Weight management goal
 * 
 * Response:
 * - 200: Profile updated successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 409: Email already in use
 * - 500: Server error
 */
router.put('/', profileController.updateProfile);
// router.post('/change-password', profileController.changePassword); // For future password change

module.exports = router;