// server/routes/diary.js
/**
 * Diary Routes
 * Handles meal tracking and diary management
 * Provides endpoints for logging meals and managing diary entries
 */
const router     = require('express').Router();
const diaryCtl   = require('../controllers/diary');
const auth       = require('../middlewares/auth'); // Adjust path if necessary

// Apply authentication middleware to all diary routes
// Only authenticated users and admins can access these endpoints
router.use(auth(['user', 'admin']));

/**
 * Get diary entries for a specific day
 * GET /api/diary
 * 
 * Query parameters:
 * - date: Target date (YYYY-MM-DD format)
 * 
 * Response:
 * - 200: Diary entries for the specified date
 * - 401: Unauthorized
 * - 500: Server error
 */
router.get('/', diaryCtl.getDay);

/**
 * Save a meal entry
 * POST /api/diary/:type
 * 
 * URL parameters:
 * - type: Meal type (breakfast, lunch, dinner, snack)
 * 
 * Request body:
 * - product_id: ID of the product consumed
 * - amount_grams: Amount consumed in grams
 * 
 * Response:
 * - 201: Meal entry created successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 500: Server error
 */
router.post('/:type', diaryCtl.saveMeal);

/**
 * Update a specific meal item
 * PATCH /api/diary/item/:mealProductId
 * 
 * URL parameters:
 * - mealProductId: ID of the meal item to update
 * 
 * Request body:
 * - amount_grams: New amount in grams
 * 
 * Response:
 * - 200: Meal item updated successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 404: Meal item not found
 * - 500: Server error
 */
router.patch('/item/:mealProductId', diaryCtl.updateMealItem);

/**
 * Delete a specific meal item
 * DELETE /api/diary/item/:mealProductId
 * 
 * URL parameters:
 * - mealProductId: ID of the meal item to delete
 * 
 * Response:
 * - 200: Meal item deleted successfully
 * - 401: Unauthorized
 * - 404: Meal item not found
 * - 500: Server error
 */
router.delete('/item/:mealProductId', diaryCtl.removeMealItem);

module.exports = router;
