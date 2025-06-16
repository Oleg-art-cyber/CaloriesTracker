/**
 * Statistics Routes
 * Handles user statistics and analytics
 * Provides endpoints for retrieving various health and nutrition metrics
 */
const router = require('express').Router();
const statisticsController = require('../controllers/statistics');
const authMiddleware = require('../middlewares/auth');

// Apply authentication middleware to all statistics routes
// Only authenticated users and admins can access these endpoints
router.use(authMiddleware(['user', 'admin']));

/**
 * Get calorie consumption trend
 * GET /api/statistics/calories-trend
 * 
 * Query parameters:
 * - start_date: Start date for trend (YYYY-MM-DD)
 * - end_date: End date for trend (YYYY-MM-DD)
 * 
 * Response:
 * - 200: Array of daily calorie data points
 * - 400: Invalid date range
 * - 401: Unauthorized
 * - 500: Server error
 */
router.get('/calories-trend', statisticsController.getCalorieTrend);

/**
 * Get summary statistics for a period
 * GET /api/statistics/period-summary
 * 
 * Query parameters:
 * - start_date: Start date for summary (YYYY-MM-DD)
 * - end_date: End date for summary (YYYY-MM-DD)
 * 
 * Response:
 * - 200: Summary statistics including averages and totals
 * - 400: Invalid date range
 * - 401: Unauthorized
 * - 500: Server error
 */
router.get('/period-summary', statisticsController.getPeriodSummary);

/**
 * Get macronutrient distribution
 * GET /api/statistics/macronutrient-distribution
 * 
 * Query parameters:
 * - start_date: Start date for analysis (YYYY-MM-DD)
 * - end_date: End date for analysis (YYYY-MM-DD)
 * 
 * Response:
 * - 200: Macronutrient breakdown (protein, fat, carbs)
 * - 400: Invalid date range
 * - 401: Unauthorized
 * - 500: Server error
 */
router.get('/macronutrient-distribution', statisticsController.getMacronutrientDistribution);

/**
 * Get weight tracking trend
 * GET /api/statistics/weight-trend
 * 
 * Query parameters:
 * - start_date: Start date for trend (YYYY-MM-DD)
 * - end_date: End date for trend (YYYY-MM-DD)
 * 
 * Response:
 * - 200: Array of weight data points
 * - 400: Invalid date range
 * - 401: Unauthorized
 * - 500: Server error
 */
router.get('/weight-trend', statisticsController.getWeightTrend);

module.exports = router;