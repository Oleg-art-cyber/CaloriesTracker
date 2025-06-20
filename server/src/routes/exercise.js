/**
 * Exercise Routes
 * Handles exercise definition management
 * Provides CRUD operations for exercise types and their metadata
 */
const router = require('express').Router();
const exerciseCtl = require('../controllers/exercise'); // Adjust path
const authMiddleware = require('../middlewares/auth'); // Adjust path to your auth middleware

// Apply authentication middleware to all exercise routes
// Only authenticated users and admins can access these endpoints
router.use(authMiddleware(['user', 'admin'])); // Ensure this matches your auth middleware signature

/**
 * Get all available exercises
 * GET /api/exercises
 * 
 * Response:
 * - 200: Array of exercise definitions
 * - 401: Unauthorized
 * - 500: Server error
 */
router.get('/', exerciseCtl.getAllExercises);

/**
 * Get a single exercise by ID
 * GET /api/exercises/:id
 * 
 * URL parameters:
 * - id: Exercise ID to retrieve
 * 
 * Response:
 * - 200: Exercise details
 * - 401: Unauthorized
 * - 403: Forbidden (not owner and not public)
 * - 404: Exercise not found
 * - 500: Server error
 */
router.get('/:id', exerciseCtl.getOneExercise);

/**
 * Create a new exercise definition
 * POST /api/exercises
 * 
 * Request body:
 * - name: Exercise name
 * - description: Exercise description
 * - met_value: Metabolic equivalent value
 * - calories_per_minute: Optional calories burned per minute
 * 
 * Response:
 * - 201: Exercise created successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 500: Server error
 */
router.post('/', exerciseCtl.createExercise);

/**
 * Update an existing exercise definition
 * PUT /api/exercises/:id
 * 
 * URL parameters:
 * - id: Exercise ID to update
 * 
 * Request body:
 * - name: Updated exercise name
 * - description: Updated exercise description
 * - met_value: Updated MET value
 * - calories_per_minute: Updated calories per minute
 * 
 * Response:
 * - 200: Exercise updated successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Exercise not found
 * - 500: Server error
 */
router.put('/:id', exerciseCtl.updateExercise);

/**
 * Delete an exercise definition
 * DELETE /api/exercises/:id
 * 
 * URL parameters:
 * - id: Exercise ID to delete
 * 
 * Response:
 * - 200: Exercise deleted successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Exercise not found
 * - 500: Server error
 */
router.delete('/:id', exerciseCtl.deleteExercise);

module.exports = router;