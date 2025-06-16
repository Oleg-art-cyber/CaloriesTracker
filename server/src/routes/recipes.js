/**
 * Recipes Routes
 * Handles recipe management and operations
 * Provides CRUD functionality for user recipes and meal planning
 */
const router = require('express').Router();
const recipeController = require('../controllers/recipes'); // Path to the new controller
const authMiddleware = require('../middlewares/auth');   // Path to your auth middleware

// Apply authentication middleware to all recipe routes
// Only authenticated users and admins can access these endpoints
router.use(authMiddleware(['user', 'admin']));

/**
 * Get all available recipes
 * GET /api/recipes
 * 
 * Response:
 * - 200: Array of recipes
 * - 401: Unauthorized
 * - 500: Server error
 * 
 * Returns:
 * - Public recipes
 * - User's private recipes
 * - Recipe metadata and creator information
 */
router.get('/', recipeController.getAllUserRecipes);

/**
 * Create a new recipe
 * POST /api/recipes
 * 
 * Request body:
 * - name: Recipe name
 * - description: Recipe description
 * - ingredients: Array of ingredients with productId and amountGrams
 * - is_public: Boolean indicating if recipe is public
 * - total_servings: Number of servings (defaults to 1)
 * 
 * Response:
 * - 201: Recipe created successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 500: Server error
 */
router.post('/', recipeController.createRecipe);

/**
 * Get a specific recipe by ID
 * GET /api/recipes/:id
 * 
 * URL parameters:
 * - id: Recipe ID to retrieve
 * 
 * Response:
 * - 200: Recipe details with ingredients
 * - 401: Unauthorized
 * - 403: Forbidden (private recipe)
 * - 404: Recipe not found
 * - 500: Server error
 */
router.get('/:id', recipeController.getRecipeById);

/**
 * Update an existing recipe
 * PUT /api/recipes/:id
 * 
 * URL parameters:
 * - id: Recipe ID to update
 * 
 * Request body:
 * - name: Updated recipe name
 * - description: Updated recipe description
 * - ingredients: Updated array of ingredients
 * - is_public: Updated public status
 * - total_servings: Updated number of servings
 * 
 * Response:
 * - 200: Recipe updated successfully
 * - 400: Invalid input data
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Recipe not found
 * - 500: Server error
 */
router.put('/:id', recipeController.updateRecipe);

/**
 * Delete a recipe
 * DELETE /api/recipes/:id
 * 
 * URL parameters:
 * - id: Recipe ID to delete
 * 
 * Response:
 * - 200: Recipe deleted successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Recipe not found
 * - 500: Server error
 */
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;