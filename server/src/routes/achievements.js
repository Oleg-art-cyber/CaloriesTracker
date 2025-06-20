/**
 * Achievements Routes
 * Handles retrieval of user achievements.
 * All routes require authentication (user or admin).
 *
 * Endpoints:
 *   GET /api/achievements - Get all achievements for the authenticated user
 */

const router = require('express').Router();
const achievementController = require('../controllers/achievements'); // Adjust path if necessary
const authMiddleware = require('../middlewares/auth');    // Adjust path if necessary

// Apply authentication middleware to all achievement routes
router.use(authMiddleware(['user', 'admin']));

/**
 * GET /api/achievements
 * Returns all achievements for the authenticated user, including which have been earned.
 * Requires authentication (user or admin).
 */
router.get('/', achievementController.getAllAchievementsForUser);

module.exports = router;