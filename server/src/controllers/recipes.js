/**
 * Recipes Controller
 * Manages recipe creation, retrieval, and updates.
 * Handles recipe ingredients and their nutritional information.
 */
const dbSingleton = require('../config/dbSingleton'); // Path to db connection singleton
const conn = dbSingleton.getConnection();
const { checkAndAwardAchievements } = require('./achievements'); // Import achievement checker

/**
 * Retrieves all recipes available to the user
 * Returns both public recipes and those created by the user
 * @param {Object} req - Express request object containing user ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing array of recipes
 * 
 * Response includes:
 * - Recipe details (ID, name, description)
 * - Creator information
 * - Public/private status
 * - Serving information
 * - Timestamps
 */
exports.getAllUserRecipes = (req, res) => {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const filterUserId = req.query.user_id ? Number(req.query.user_id) : null;

    let query = `
        SELECT 
            r.id, r.name, r.description, r.user_id, r.is_public, r.total_servings, 
            r.created_at, r.updated_at,
            u.name AS created_by_username 
        FROM Recipe r
        JOIN User u ON r.user_id = u.id
    `;

    const queryParams = [];
    
    if (isAdmin) {
        if (filterUserId) {
            query += ' WHERE r.user_id = ?';
            queryParams.push(filterUserId);
        }
    } else {
        query += ' WHERE r.is_public = 1 OR r.user_id = ?';
        queryParams.push(userId);
    }

    query += ' ORDER BY r.name ASC';

    conn.query(query, queryParams, (err, recipes) => {
        if (err) {
            console.error('getAllUserRecipes - SQL Error:', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to fetch recipes', details: err.code });
        }
        res.json(recipes);
    });
};

/**
 * Retrieves a single recipe by ID with its ingredients and nutritional information
 * Enforces access control for private recipes
 * @param {Object} req - Express request object containing recipe ID and user ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing recipe details and ingredients
 * 
 * URL parameters:
 * - id: Recipe ID to retrieve
 * 
 * Response includes:
 * - Complete recipe information
 * - List of ingredients with nutritional values
 * - Creator details
 */
exports.getRecipeById = (req, res) => {
    const recipeId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(recipeId)) {
        return res.status(400).json({ error: 'Invalid recipe ID format.' });
    }

    const recipeQuery = `
        SELECT r.id, r.name, r.description, r.user_id, r.is_public, r.total_servings, 
               r.created_at, r.updated_at,
               u.name AS created_by_username
        FROM Recipe r
        JOIN User u ON r.user_id = u.id
        WHERE r.id = ?;
    `;

    conn.query(recipeQuery, [recipeId], (err, recipeResult) => {
        if (err) {
            console.error('getRecipeById - SQL Error (fetch recipe):', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to fetch recipe details', details: err.code });
        }
        if (recipeResult.length === 0) {
            return res.status(404).json({ error: 'Recipe not found.' });
        }

        const recipe = recipeResult[0];
        if (!recipe.is_public && recipe.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied to this recipe.' });
        }

        const ingredientsQuery = `
            SELECT 
                ri.id AS recipe_ingredient_id, 
                ri.product_id, 
                p.name AS product_name, 
                ri.amount_grams,
                p.calories AS product_calories_per_100g, 
                p.protein AS product_protein_per_100g, 
                p.fat AS product_fat_per_100g, 
                p.carbs AS product_carbs_per_100g
            FROM RecipeIngredient ri
            JOIN product p ON ri.product_id = p.id
            WHERE ri.recipe_id = ?;
        `;
        conn.query(ingredientsQuery, [recipeId], (ingErr, ingredients) => {
            if (ingErr) {
                console.error('getRecipeById - SQL Error (fetch ingredients):', ingErr.code, ingErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to fetch recipe ingredients', details: ingErr.code });
            }
            recipe.ingredients = ingredients; // Attach ingredients to the recipe object
            res.json(recipe);
        });
    });
};

/**
 * Creates a new recipe with its ingredients
 * Uses a transaction to ensure data consistency
 * @param {Object} req - Express request object containing recipe data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing created recipe details
 * 
 * Request body must include:
 * - name: Recipe name
 * - ingredients: Array of ingredients with productId and amountGrams
 * - is_public: Boolean indicating if recipe is public
 * - total_servings: Number of servings (defaults to 1)
 * - description: Optional recipe description
 */
exports.createRecipe = (req, res) => {
    const { name, description, is_public, total_servings = 1, ingredients } = req.body;
    const user_id = req.user.id;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Recipe name is required and must be a non-empty string.' });
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: 'Recipe must include at least one ingredient.' });
    }
    for (const ing of ingredients) {
        if (ing.productId === undefined || isNaN(parseFloat(ing.amountGrams)) || parseFloat(ing.amountGrams) <= 0) {
            return res.status(400).json({ error: 'Each ingredient requires a valid productId and a positive amountGrams.' });
        }
    }
    const finalIsPublic = typeof is_public === 'boolean' ? is_public : false;
    const finalTotalServings = !isNaN(parseFloat(total_servings)) && parseFloat(total_servings) > 0 ? parseFloat(total_servings) : 1;

    conn.beginTransaction(transactionErr => {
        if (transactionErr) {
            console.error('createRecipe - Transaction Start Error:', transactionErr);
            return res.status(500).json({ error: 'Failed to create recipe (db transaction).', details: transactionErr.code });
        }

        const recipeQuery = 'INSERT INTO Recipe (name, description, user_id, is_public, total_servings) VALUES (?, ?, ?, ?, ?);';
        const recipeParams = [name.trim(), description ? description.trim() : null, user_id, finalIsPublic, finalTotalServings];

        conn.query(recipeQuery, recipeParams, (recipeErr, recipeResult) => {
            if (recipeErr) {
                console.error('createRecipe - SQL Error (insert recipe):', recipeErr.code, recipeErr.sqlMessage);
                return conn.rollback(() => {
                    res.status(500).json({ error: 'Failed to save recipe details.', details: recipeErr.code });
                });
            }

            const recipeId = recipeResult.insertId;
            const ingredientValues = ingredients.map(ing => [recipeId, ing.productId, parseFloat(ing.amountGrams)]);

            // If no ingredients, commit recipe and respond (though validated earlier)
            if (ingredientValues.length === 0) {
                return conn.commit(commitErr => {
                    if (commitErr) {
                        console.error('createRecipe - Commit Error (no ingredients):', commitErr);
                        return conn.rollback(() => res.status(500).json({ error: "Failed to finalize recipe (commit).", details: commitErr.code }));
                    }
                    // Call getRecipeById to fetch and return the newly created (empty) recipe.
                    // req.user is available from authMiddleware.
                    const pseudoReqForGet = { params: { id: recipeId }, user: req.user };
                    exports.getRecipeById(pseudoReqForGet, res);
                });
            }

            const ingredientsQuery = 'INSERT INTO RecipeIngredient (recipe_id, product_id, amount_grams) VALUES ?;';
            conn.query(ingredientsQuery, [ingredientValues], (ingErr) => {
                if (ingErr) {
                    console.error('createRecipe - SQL Error (insert ingredients):', ingErr.code, ingErr.sqlMessage);
                    return conn.rollback(() => {
                        res.status(500).json({ error: 'Failed to save recipe ingredients.', details: ingErr.code });
                    });
                }

                conn.commit(commitErr => {
                    if (commitErr) {
                        console.error('createRecipe - Commit Error:', commitErr);
                        return conn.rollback(() => {
                            res.status(500).json({ error: 'Failed to finalize recipe creation (commit).', details: commitErr.code });
                        });
                    }
                    
                    // Check for achievements asynchronously
                    checkAndAwardAchievements(user_id, {
                        type: 'RECIPE_CREATED',
                        data: { recipe_id: recipeId, ingredient_count: ingredients.length }
                    }).catch(achErr => console.error("[RecipesCtrl] Error during achievement check after recipe creation:", achErr));
                    
                    const pseudoReqForGet = { params: { id: recipeId }, user: req.user };
                    exports.getRecipeById(pseudoReqForGet, res); // Respond with the complete new recipe
                });
            });
        });
    });
};

/**
 * Updates an existing recipe and its ingredients
 * Replaces all existing ingredients with new ones
 * @param {Object} req - Express request object containing recipe ID and update data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing updated recipe details
 * 
 * URL parameters:
 * - id: Recipe ID to update
 * 
 * Request body may include:
 * - name: Updated recipe name
 * - description: Updated recipe description
 * - is_public: Updated public status
 * - total_servings: Updated number of servings
 * - ingredients: New array of ingredients
 */
exports.updateRecipe = (req, res) => {
    const recipeId = parseInt(req.params.id, 10);
    const { name, description, is_public, total_servings, ingredients } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(recipeId)) {
        return res.status(400).json({ error: 'Invalid recipe ID format.' });
    }
    // Input validation for update
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Recipe name is required for update.' });
    }
    if (!Array.isArray(ingredients)) {
        return res.status(400).json({ error: 'Ingredients must be provided as an array (can be empty to remove all ingredients).' });
    }
    for (const ing of ingredients) { // Validate new ingredients if any
        if (ing.productId === undefined || isNaN(parseFloat(ing.amountGrams)) || parseFloat(ing.amountGrams) <= 0) {
            return res.status(400).json({ error: 'Each new ingredient requires a valid productId and a positive amountGrams.' });
        }
    }

    conn.beginTransaction(transactionErr => {
        if (transactionErr) {
            console.error('updateRecipe - Transaction Start Error:', transactionErr);
            return res.status(500).json({ error: 'Failed to update recipe (db transaction).', details: transactionErr.code });
        }

        conn.query('SELECT user_id, is_public AS current_is_public, total_servings AS current_total_servings FROM Recipe WHERE id = ?', [recipeId], (fetchErr, recipeResults) => {
            if (fetchErr) {
                return conn.rollback(() => res.status(500).json({ error: 'Failed to verify recipe for update.', details: fetchErr.code }));
            }
            if (recipeResults.length === 0) {
                return conn.rollback(() => res.status(404).json({ error: 'Recipe not found.' }));
            }

            const existingRecipe = recipeResults[0];
            if (existingRecipe.user_id !== userId && userRole !== 'admin') {
                return conn.rollback(() => res.status(403).json({ error: 'Forbidden: You do not have permission to edit this recipe.' }));
            }

            const finalIsPublic = typeof is_public === 'boolean' ? is_public : existingRecipe.current_is_public;
            const finalTotalServings = !isNaN(parseFloat(total_servings)) && parseFloat(total_servings) > 0 ? parseFloat(total_servings) : existingRecipe.current_total_servings;
            const finalDescription = description !== undefined ? (description ? description.trim() : null) : existingRecipe.description;


            const updateRecipeQuery = 'UPDATE Recipe SET name = ?, description = ?, is_public = ?, total_servings = ? WHERE id = ?';
            conn.query(updateRecipeQuery, [name.trim(), finalDescription, finalIsPublic, finalTotalServings, recipeId], (updRecipeErr) => {
                if (updRecipeErr) {
                    return conn.rollback(() => res.status(500).json({ error: 'Failed to update recipe details.', details: updRecipeErr.code }));
                }

                conn.query('DELETE FROM RecipeIngredient WHERE recipe_id = ?', [recipeId], (delIngErr) => {
                    if (delIngErr) {
                        return conn.rollback(() => res.status(500).json({ error: 'Failed to clear old recipe ingredients.', details: delIngErr.code }));
                    }

                    if (ingredients.length > 0) {
                        const ingredientValues = ingredients.map(ing => [recipeId, ing.productId, parseFloat(ing.amountGrams)]);
                        const insertIngredientsQuery = 'INSERT INTO RecipeIngredient (recipe_id, product_id, amount_grams) VALUES ?';
                        conn.query(insertIngredientsQuery, [ingredientValues], (insIngErr) => {
                            if (insIngErr) {
                                return conn.rollback(() => res.status(500).json({ error: 'Failed to insert new recipe ingredients.', details: insIngErr.code }));
                            }
                            commitAndUpdateResponse();
                        });
                    } else { // No new ingredients to add
                        commitAndUpdateResponse();
                    }

                    function commitAndUpdateResponse() {
                        conn.commit(commitErr => {
                            if (commitErr) {
                                return conn.rollback(() => res.status(500).json({ error: 'Failed to finalize recipe update (commit).', details: commitErr.code }));
                            }
                            const pseudoReqForGet = { params: { id: recipeId }, user: req.user };
                            exports.getRecipeById(pseudoReqForGet, res);
                        });
                    }
                });
            });
        });
    });
};

// --- DELETE /api/recipes/:id ---
// Deletes a recipe. Associated RecipeIngredients are deleted via DB CASCADE constraint.
exports.deleteRecipe = (req, res) => {
    const recipeId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(recipeId)) {
        return res.status(400).json({ error: 'Invalid recipe ID format.' });
    }

    conn.query('SELECT user_id FROM Recipe WHERE id = ?', [recipeId], (err, recipes) => {
        if (err) {
            console.error('deleteRecipe - SQL Error (fetch recipe):', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to verify recipe for deletion', details: err.code });
        }
        if (recipes.length === 0) {
            return res.status(404).json({ error: 'Recipe not found.' });
        }

        const recipe = recipes[0];
        if (recipe.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this recipe.' });
        }

        // Assuming ON DELETE CASCADE is set for RecipeIngredient.recipe_id FK
        // and for MealProduct.recipe_id FK (or ON DELETE SET NULL)
        conn.query('DELETE FROM Recipe WHERE id = ?', [recipeId], (deleteErr) => {
            if (deleteErr) {
                console.error('deleteRecipe - SQL Error (delete recipe):', deleteErr.code, deleteErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to delete recipe', details: deleteErr.code });
            }
            res.status(200).json({ message: 'Recipe deleted successfully.' }); // Use 200 for successful DELETE with body, or 204 for no body
        });
    });
};