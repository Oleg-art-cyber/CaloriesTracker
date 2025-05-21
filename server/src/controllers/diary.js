// server/controllers/diary.js
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

// --- SQL HELPER FOR FETCHING RECIPE DETAILS AND CALCULATING NUTRITION ---
// Fetches ingredients for given recipe IDs and calculates total nutrition for each recipe.
const getRecipeDetailsWithNutrition = (recipeIds, callback) => {
    if (!recipeIds || recipeIds.length === 0) {
        return callback(null, {}); // No recipe IDs to fetch
    }
    const placeholders = recipeIds.map(() => '?').join(',');
    const query = `
        SELECT 
            ri.recipe_id,
            ri.amount_grams,
            p.calories AS product_calories_per_100g,
            p.protein AS product_protein_per_100g,
            p.fat AS product_fat_per_100g,
            p.carbs AS product_carbs_per_100g,
            r.total_servings AS recipe_total_servings,
            r.name AS recipe_name  -- Include recipe name for context
        FROM RecipeIngredient ri
        JOIN product p ON ri.product_id = p.id
        JOIN Recipe r ON ri.recipe_id = r.id 
        WHERE ri.recipe_id IN (${placeholders});
    `;
    conn.query(query, recipeIds, (err, ingredients) => {
        if (err) {
            console.error("getRecipeDetailsWithNutrition - SQL Error:", err.code, err.sqlMessage);
            return callback(err, null);
        }

        const recipesData = {};
        ingredients.forEach(ing => {
            if (!recipesData[ing.recipe_id]) {
                recipesData[ing.recipe_id] = {
                    name: ing.recipe_name, // Store recipe name
                    total_servings: ing.recipe_total_servings,
                    // Accumulators for total nutrition of the entire recipe
                    total_recipe_kcal: 0,
                    total_recipe_protein: 0,
                    total_recipe_fat: 0,
                    total_recipe_carbs: 0,
                };
            }
            // Calculate nutrition for this ingredient and add to recipe totals
            const nutrition_factor = ing.amount_grams / 100.0;
            recipesData[ing.recipe_id].total_recipe_kcal    += (ing.product_calories_per_100g * nutrition_factor);
            recipesData[ing.recipe_id].total_recipe_protein += (ing.product_protein_per_100g * nutrition_factor);
            recipesData[ing.recipe_id].total_recipe_fat     += (ing.product_fat_per_100g * nutrition_factor);
            recipesData[ing.recipe_id].total_recipe_carbs   += (ing.product_carbs_per_100g * nutrition_factor);
        });
        callback(null, recipesData);
    });
};


// --- GET /api/diary?date=YYYY-MM-DD ---
// Fetches all meal items (products and recipes) for a given user and date,
// with calculated nutritional values for each item and a daily summary.
exports.getDay = (req, res) => {
    const userId = req.user.id;
    const date = req.query.date;

    // Validate date parameter
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Valid date query parameter (YYYY-MM-DD) is required.' });
    }

    // Fetches items from MealProduct, joining with meal, product (if product_id is set),
    // and recipe (if recipe_id is set) to get basic names and amounts.
    const sqlMealItems = `
        SELECT 
            m.id AS meal_id,
            m.meal_type,
            m.meal_datetime, -- Needed for constructing pseudo-req for other controllers if they use it
            mp.id AS meal_product_id, 
            mp.product_id,
            p.name AS product_name,
            p.calories AS product_calories_per_100g,
            p.protein AS product_protein_per_100g,
            p.fat AS product_fat_per_100g,
            p.carbs AS product_carbs_per_100g,
            mp.product_amount,
            mp.recipe_id,
            r.name AS recipe_name, -- Get recipe name directly
            mp.servings_consumed
        FROM meal m
        LEFT JOIN MealProduct mp ON mp.meal_id = m.id
        LEFT JOIN product p ON p.id = mp.product_id AND mp.recipe_id IS NULL
        LEFT JOIN Recipe r ON r.id = mp.recipe_id AND mp.product_id IS NULL
        WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?
        ORDER BY FIELD(m.meal_type, 'breakfast', 'lunch', 'dinner', 'snack'), mp.id;
    `;

    conn.query(sqlMealItems, [userId, date], (err, mealItemRows) => {
        if (err) {
            console.error('getDay - SQL Error (fetch meal items):', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to fetch diary entries', details: err.code });
        }

        // Collect all unique recipe IDs present in the current day's diary
        const recipeIdsInDiary = [...new Set(mealItemRows.filter(r => r.recipe_id).map(r => r.recipe_id))];

        // Fetch full nutritional details for these recipes
        getRecipeDetailsWithNutrition(recipeIdsInDiary, (recipeErr, recipesFullDetails) => {
            if (recipeErr) {
                // Error already logged in getRecipeDetailsWithNutrition
                return res.status(500).json({ error: 'Failed to fetch detailed recipe information for diary', details: recipeErr.code });
            }

            const mealsOutput = {}; // This will store the final structured meal data
            let summaryKcal = 0, summaryProtein = 0, summaryFat = 0, summaryCarbs = 0;

            mealItemRows.forEach(row => {
                // Ensure meal_id is present; otherwise, it's likely a meal entry with no items.
                if (!row.meal_id) return;

                // Initialize meal type in output if not already present
                if (!mealsOutput[row.meal_type]) {
                    mealsOutput[row.meal_type] = { meal_id: row.meal_id, items: [] };
                }

                // Skip if it's an empty row from MealProduct (e.g., product/recipe deleted and FKs set to NULL)
                if (!row.meal_product_id || (!row.product_id && !row.recipe_id)) {
                    return;
                }

                let itemKcal = 0, itemProtein = 0, itemFat = 0, itemCarbs = 0;
                const processedItem = {
                    meal_product_id: row.meal_product_id,
                    name: '',
                    type: '' // 'product' or 'recipe'
                    // Nutritional values will be added below
                };

                if (row.product_id) { // Item is a product
                    processedItem.type = 'product';
                    processedItem.product_id = row.product_id;
                    processedItem.name = row.product_name || 'Unknown Product';
                    processedItem.amount_grams = row.product_amount;

                    const factor = (row.product_amount || 0) / 100.0;
                    itemKcal    = (row.product_calories_per_100g || 0) * factor;
                    itemProtein = (row.product_protein_per_100g || 0) * factor;
                    itemFat     = (row.product_fat_per_100g || 0) * factor;
                    itemCarbs   = (row.product_carbs_per_100g || 0) * factor;

                } else if (row.recipe_id && recipesFullDetails[row.recipe_id]) { // Item is a recipe
                    processedItem.type = 'recipe';
                    processedItem.recipe_id = row.recipe_id;
                    processedItem.name = recipesFullDetails[row.recipe_id].name || row.recipe_name || 'Unknown Recipe';
                    processedItem.servings_consumed = row.servings_consumed;

                    const recipeNutriData = recipesFullDetails[row.recipe_id];
                    if (recipeNutriData.total_servings > 0) {
                        const servingsRatio = (row.servings_consumed || 0) / recipeNutriData.total_servings;
                        itemKcal    = recipeNutriData.total_recipe_kcal * servingsRatio;
                        itemProtein = recipeNutriData.total_recipe_protein * servingsRatio;
                        itemFat     = recipeNutriData.total_recipe_fat * servingsRatio;
                        itemCarbs   = recipeNutriData.total_recipe_carbs * servingsRatio;
                    }
                } else {
                    // This item is invalid or its details couldn't be fully resolved
                    console.warn(`getDay: Skipping unresolved meal item mp.id ${row.meal_product_id}`);
                    return;
                }

                processedItem.kcal = Math.round(itemKcal);
                processedItem.protein = parseFloat(itemProtein.toFixed(1)); // Adjusted to 1 decimal for display
                processedItem.fat = parseFloat(itemFat.toFixed(1));
                processedItem.carbs = parseFloat(itemCarbs.toFixed(1));

                mealsOutput[row.meal_type].items.push(processedItem);

                // Add to daily summary
                summaryKcal    += itemKcal;
                summaryProtein += itemProtein;
                summaryFat     += itemFat;
                summaryCarbs   += itemCarbs;
            });

            // Ensure all meal types ('breakfast', 'lunch', 'dinner', 'snack') are present in the output,
            // even if empty, by finding their meal_id from the mealItemRows if they existed in 'meal' table.
            const allMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            allMealTypes.forEach(mt => {
                if (!mealsOutput[mt]) {
                    const mealEntryForType = mealItemRows.find(mir => mir.meal_type === mt && mir.meal_id);
                    if (mealEntryForType) { // A meal of this type exists for the day, but had no valid items
                        mealsOutput[mt] = { meal_id: mealEntryForType.meal_id, items: [] };
                    } else {
                        // No meal of this type was even created for the day. Client can decide to show empty or not.
                        // To be consistent with previous behavior of always showing 4 meal cards:
                        // mealsOutput[mt] = { meal_id: null, items: [] }; // Client needs to handle meal_id: null
                        // Or, to only show meals that exist in DB (even if empty of items): see above.
                        // For now, if no meal record, don't add to mealsOutput. Client should handle.
                    }
                }
            });


            const finalSummary = {
                kcal: Math.round(summaryKcal),
                protein: parseFloat(summaryProtein.toFixed(1)),
                fat: parseFloat(summaryFat.toFixed(1)),
                carbs: parseFloat(summaryCarbs.toFixed(1))
            };

            res.json({ meals: mealsOutput, summary: finalSummary });
        });
    });
};


// --- POST /api/diary/:type ---
// Adds new items (products or recipes) to a specified meal type for a given date.
exports.saveMeal = (req, res) => {
    const userId = req.user.id;
    const mealType = req.params.type;
    const { date, items = [] } = req.body; // `items` is an array: [{productId?, amountGrams?}, {recipeId?, servingsConsumed?}]

    // Validate input
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided to save. "items" array cannot be empty.' });
    }

    // Validate each item in the items array
    for (const item of items) {
        if (item.productId) {
            if (item.amountGrams === undefined || isNaN(parseFloat(item.amountGrams)) || parseFloat(item.amountGrams) <= 0) {
                return res.status(400).json({ error: `Invalid amountGrams for productId ${item.productId}. Must be a positive number.` });
            }
        } else if (item.recipeId) {
            if (item.servingsConsumed === undefined || isNaN(parseFloat(item.servingsConsumed)) || parseFloat(item.servingsConsumed) <= 0) {
                return res.status(400).json({ error: `Invalid servingsConsumed for recipeId ${item.recipeId}. Must be a positive number.` });
            }
        } else {
            return res.status(400).json({ error: 'Each item must have either a productId or a recipeId.' });
        }
    }

    // 1. Upsert meal entry to get meal_id
    const mealDateTime = `${date} 00:00:00`; // Standardize time for daily meal grouping
    const upsertMealQuery = `
        INSERT INTO meal (user_id, meal_datetime, meal_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);`;

    conn.query(upsertMealQuery, [userId, mealDateTime, mealType], (err, mealResult) => {
        if (err) {
            console.error('saveMeal - SQL Error (upsert meal):', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to process meal entry', details: err.code });
        }

        const mealId = mealResult.insertId;
        if (!mealId || mealId === 0) { // Should not happen if ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id) works as expected
            console.error('saveMeal - Failed to get valid mealId from upsert:', mealResult);
            return res.status(500).json({ error: 'Internal error obtaining meal ID.' });
        }

        // 2. Prepare values for MealProduct insertion
        const mealProductValues = items.map(item => {
            if (item.productId) {
                return [mealId, Number(item.productId), parseFloat(item.amountGrams), null, null];
            } else { // if (item.recipeId) - validation already ensured one is present
                return [mealId, null, null, Number(item.recipeId), parseFloat(item.servingsConsumed)];
            }
        });

        const insertMealProductsQuery = `
            INSERT INTO MealProduct (meal_id, product_id, product_amount, recipe_id, servings_consumed)
            VALUES ?;`; // Using bulk insert

        conn.query(insertMealProductsQuery, [mealProductValues], (insertErr) => {
            if (insertErr) {
                console.error('saveMeal - SQL Error (insert meal products):', insertErr.code, insertErr.sqlMessage);
                // ER_NO_REFERENCED_ROW_2 here would mean productId or recipeId does not exist in parent tables
                return res.status(500).json({ error: 'Failed to save meal items to diary', details: insertErr.code });
            }
            // After successful save, refresh and return the day's data using original request's user and query date
            const pseudoReqForGetDay = { user: req.user, query: { date: date } };
            exports.getDay(pseudoReqForGetDay, res);
        });
    });
};


// --- PATCH /api/diary/item/:mealProductId ---
// Updates the amount/servings of a specific MealProduct entry.
exports.updateMealItem = (req, res) => {
    const mealProductId = parseInt(req.params.mealProductId, 10);
    const { amountGrams, servingsConsumed } = req.body; // Client sends one or the other
    const userId = req.user.id;

    if (isNaN(mealProductId)) {
        return res.status(400).json({ error: 'Invalid meal item ID.' });
    }

    // Fetch item to check type and ownership via meal's user_id
    const checkQuery = `
        SELECT mp.id, mp.product_id, mp.recipe_id, m.user_id, m.meal_datetime
        FROM MealProduct mp
                 JOIN meal m ON mp.meal_id = m.id
        WHERE mp.id = ?;`;
    conn.query(checkQuery, [mealProductId], (err, items) => {
        if (err) {
            console.error('updateMealItem - SQL Error (fetch item):', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to retrieve item for update.', details: err.code });
        }
        if (items.length === 0) {
            return res.status(404).json({ error: 'Meal item not found.' });
        }
        const item = items[0];
        if (item.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this meal item.' });
        }

        let updateQuerySql;
        let params;

        if (item.product_id && amountGrams !== undefined) {
            const numAmount = parseFloat(amountGrams);
            if (isNaN(numAmount) || numAmount <= 0) {
                return res.status(400).json({ error: 'Invalid amountGrams. Must be a positive number.' });
            }
            updateQuerySql = 'UPDATE MealProduct SET product_amount = ? WHERE id = ?';
            params = [numAmount, mealProductId];
        } else if (item.recipe_id && servingsConsumed !== undefined) {
            const numServings = parseFloat(servingsConsumed);
            if (isNaN(numServings) || numServings <= 0) {
                return res.status(400).json({ error: 'Invalid servingsConsumed. Must be a positive number.' });
            }
            updateQuerySql = 'UPDATE MealProduct SET servings_consumed = ? WHERE id = ?';
            params = [numServings, mealProductId];
        } else {
            return res.status(400).json({ error: 'Invalid request. Provide amountGrams for products or servingsConsumed for recipes.' });
        }

        conn.query(updateQuerySql, params, (updateErr) => {
            if (updateErr) {
                console.error('updateMealItem - SQL Error (update item):', updateErr.code, updateErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to update meal item.', details: updateErr.code });
            }
            const diaryDate = new Date(item.meal_datetime).toISOString().split('T')[0];
            const pseudoReqForGetDay = { user: req.user, query: { date: diaryDate } };
            exports.getDay(pseudoReqForGetDay, res);
        });
    });
};

// --- DELETE /api/diary/item/:mealProductId ---
// Removes a specific MealProduct entry.
exports.removeMealItem = (req, res) => {
    const mealProductId = parseInt(req.params.mealProductId, 10);
    const userId = req.user.id;

    if (isNaN(mealProductId)) {
        return res.status(400).json({ error: 'Invalid meal item ID.' });
    }

    // Check ownership before deleting
    const checkQuery = `
        SELECT mp.id, m.user_id, m.meal_datetime 
        FROM MealProduct mp
        JOIN meal m ON mp.meal_id = m.id
        WHERE mp.id = ?;`;
    conn.query(checkQuery, [mealProductId], (err, items) => {
        if (err) {
            console.error('removeMealItem - SQL Error (fetch item):', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to verify item for deletion.', details: err.code });
        }
        if (items.length === 0) {
            return res.status(404).json({ error: 'Meal item not found.' });
        }
        const item = items[0];
        if (item.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this meal item.' });
        }

        conn.query('DELETE FROM MealProduct WHERE id = ?', [mealProductId], (deleteErr) => {
            if (deleteErr) {
                console.error('removeMealItem - SQL Error (delete item):', deleteErr.code, deleteErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to remove meal item.', details: deleteErr.code });
            }
            const diaryDate = new Date(item.meal_datetime).toISOString().split('T')[0];
            const pseudoReqForGetDay = { user: req.user, query: { date: diaryDate } };
            exports.getDay(pseudoReqForGetDay, res);
        });
    });
};