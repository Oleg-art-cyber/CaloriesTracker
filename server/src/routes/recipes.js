// server/routes/recipes.js
const router = require('express').Router();
const recipeController = require('../controllers/recipes'); // Path to the new controller
const authMiddleware = require('../middlewares/auth');   // Path to your auth middleware

// Apply auth middleware to all recipe routes
// This expects authMiddleware to be a function that takes an array of roles
// and returns the actual middleware function.
router.use(authMiddleware(['user', 'admin']));

router.get('/', recipeController.getAllUserRecipes);
router.post('/', recipeController.createRecipe);
router.get('/:id', recipeController.getRecipeById);
router.put('/:id', recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;