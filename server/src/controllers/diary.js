/**
 * Diary Controller
 * Handles all diary-related operations including meal tracking, nutrition calculations,
 * and physical activity logging
 */
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();
const { checkAndAwardAchievements } = require('./achievements'); // Import achievement checker

/**
 * Retrieves detailed recipe information including nutritional values
 * @param {Array<number>} recipeIds - Array of recipe IDs to fetch
 * @param {Function} callback - Callback function(err, recipesData)
 * @returns {Object} Object containing recipe details with calculated nutrition values
 */
const getRecipeDetailsWithNutrition = (recipeIds, callback) => {
    if (!recipeIds || recipeIds.length === 0) {
        return callback(null, {});
    }
    const placeholders = recipeIds.map(() => '?').join(',');
    const query = `
        SELECT
            ri.recipe_id,
            ri.amount_grams,
            p.name AS product_name,
            p.calories AS product_calories_per_100g,
            p.protein AS product_protein_per_100g,
            p.fat AS product_fat_per_100g,
            p.carbs AS product_carbs_per_100g,
            r.total_servings AS recipe_total_servings,
            r.name AS recipe_name
        FROM RecipeIngredient ri
                 JOIN product p ON ri.product_id = p.id
                 JOIN Recipe r ON ri.recipe_id = r.id
        WHERE ri.recipe_id IN (${placeholders});
    `;
    conn.query(query, recipeIds, (err, ingredients) => {
        if (err) {
            console.error("[DIARY_CTRL_HELPER] getRecipeDetailsWithNutrition - SQL Error:", err.code, err.sqlMessage, err);
            return callback(err, null);
        }
        const recipesData = {};
        ingredients.forEach(ing => {
            if (!recipesData[ing.recipe_id]) {
                recipesData[ing.recipe_id] = {
                    name: ing.recipe_name || 'Unnamed Recipe',
                    total_servings: ing.recipe_total_servings || 1,
                    total_recipe_kcal: 0,
                    total_recipe_protein: 0,
                    total_recipe_fat: 0,
                    total_recipe_carbs: 0,
                };
            }
            const nutrition_factor = (parseFloat(ing.amount_grams) || 0) / 100.0;
            recipesData[ing.recipe_id].total_recipe_kcal    += ((parseFloat(ing.product_calories_per_100g) || 0) * nutrition_factor);
            recipesData[ing.recipe_id].total_recipe_protein += ((parseFloat(ing.product_protein_per_100g) || 0) * nutrition_factor);
            recipesData[ing.recipe_id].total_recipe_fat     += ((parseFloat(ing.product_fat_per_100g) || 0) * nutrition_factor);
            recipesData[ing.recipe_id].total_recipe_carbs   += ((parseFloat(ing.product_carbs_per_100g) || 0) * nutrition_factor);
        });
        callback(null, recipesData);
    });
};

/**
 * Processes diary data and sends formatted response
 * @param {number} userId - User ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} mealItemRows - Raw meal items from database
 * @param {Array} loggedActivities - Physical activities for the day
 * @param {Object} recipesFullDetails - Detailed recipe information
 * @param {Object} res - Express response object
 * @param {Object} req - Express request object
 */
function processAndRespondGetDay(userId, date, mealItemRows, loggedActivities, recipesFullDetails, res, req) {
    const mealsOutput = {};
    let summaryKcalConsumed = 0, summaryProtein = 0, summaryFat = 0, summaryCarbs = 0;

    // Process each meal item and calculate nutrition totals
    (mealItemRows || []).forEach(row => {
        if (!row.meal_id) return;
        if (!mealsOutput[row.meal_type]) {
            mealsOutput[row.meal_type] = { meal_id: row.meal_id, items: [] };
        }
        if (!row.meal_product_id || (!row.product_id && !row.recipe_id)) return;

        let itemKcal = 0, itemProtein = 0, itemFat = 0, itemCarbs = 0;
        const processedItem = { meal_product_id: row.meal_product_id, name: 'Unknown Item', type: '' };

        // Process product-based items
        if (row.product_id) {
            processedItem.type = 'product';
            processedItem.product_id = row.product_id;
            processedItem.name = row.product_name || 'Unnamed Product';
            processedItem.amount_grams = parseFloat(row.product_amount) || 0;
            const factor = processedItem.amount_grams / 100.0;
            itemKcal    = (parseFloat(row.product_calories_per_100g) || 0) * factor;
            itemProtein = (parseFloat(row.product_protein_per_100g) || 0) * factor;
            itemFat     = (parseFloat(row.product_fat_per_100g) || 0) * factor;
            itemCarbs   = (parseFloat(row.product_carbs_per_100g) || 0) * factor;
        } 
        // Process recipe-based items
        else if (row.recipe_id && recipesFullDetails && recipesFullDetails[row.recipe_id]) {
            processedItem.type = 'recipe';
            processedItem.recipe_id = row.recipe_id;
            const recipeNutriData = recipesFullDetails[row.recipe_id];
            processedItem.name = recipeNutriData.name || row.recipe_name || 'Unnamed Recipe';
            processedItem.servings_consumed = parseFloat(row.servings_consumed) || 0;
            if (recipeNutriData.total_servings > 0) {
                const servingsRatio = processedItem.servings_consumed / recipeNutriData.total_servings;
                itemKcal    = (recipeNutriData.total_recipe_kcal || 0) * servingsRatio;
                itemProtein = (recipeNutriData.total_recipe_protein || 0) * servingsRatio;
                itemFat     = (recipeNutriData.total_recipe_fat || 0) * servingsRatio;
                itemCarbs   = (recipeNutriData.total_recipe_carbs || 0) * servingsRatio;
            }
        } else { return; }

        // Round nutrition values and add to processed item
        processedItem.kcal = Math.round(itemKcal);
        processedItem.protein = parseFloat(itemProtein.toFixed(1));
        processedItem.fat = parseFloat(itemFat.toFixed(1));
        processedItem.carbs = parseFloat(itemCarbs.toFixed(1));
        mealsOutput[row.meal_type].items.push(processedItem);

        // Update summary totals
        summaryKcalConsumed += itemKcal;
        summaryProtein += itemProtein;
        summaryFat     += itemFat;
        summaryCarbs   += itemCarbs;
    });

    // Calculate total calories burned from exercise
    const totalKcalBurnedExercise = (loggedActivities || []).reduce((sum, activity) => sum + (parseFloat(activity.calories_burned) || 0), 0);

    // Prepare final summary
    const finalSummary = {
        kcal_consumed: Math.round(summaryKcalConsumed),
        protein: parseFloat(summaryProtein.toFixed(1)),
        fat: parseFloat(summaryFat.toFixed(1)),
        carbs: parseFloat(summaryCarbs.toFixed(1)),
        kcal_burned_exercise: Math.round(totalKcalBurnedExercise),
        net_kcal: Math.round(summaryKcalConsumed - totalKcalBurnedExercise)
    };

    // Ensure all meal types are present in output
    const allMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    allMealTypes.forEach(mt => {
        if (!mealsOutput[mt]) {
            const mealEntryForType = (mealItemRows || []).find(mir => mir.meal_type === mt && mir.meal_id);
            if (mealEntryForType) {
                mealsOutput[mt] = { meal_id: mealEntryForType.meal_id, items: [] };
            } else {
                mealsOutput[mt] = { meal_id: null, items: [] };
            }
        }
    });

    // Send response
    res.json({ meals: mealsOutput, summary: finalSummary, activities: loggedActivities || [] });

    // Check for achievements asynchronously
    checkAndAwardAchievements(userId, {
        type: 'DIARY_LOADED',
        data: { date: date, summary: finalSummary, meals: mealsOutput, activities: loggedActivities }
    }).catch(achErr => console.error("[DiaryCtrl] Error during achievement check after diary load:", achErr));
}

/**
 * Retrieves diary entries for a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing meals, summary, and activities
 */
exports.getDay = (req, res) => {
    const userId = req.user.id;
    const date = req.query.date;

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Valid date query parameter (YYYY-MM-DD) is required.' });
    }

    // SQL queries for fetching meal items and physical activities
    const sqlMealItems = `
        SELECT
            m.id AS meal_id, m.meal_type, m.meal_datetime,
            mp.id AS meal_product_id, mp.product_id, mp.product_amount,
            mp.recipe_id, mp.servings_consumed,
            p.name AS product_name, p.calories AS product_calories_per_100g,
            p.protein AS product_protein_per_100g, p.fat AS product_fat_per_100g, p.carbs AS product_carbs_per_100g,
            r.name AS recipe_name
        FROM meal m
                 LEFT JOIN MealProduct mp ON mp.meal_id = m.id
                 LEFT JOIN product p ON p.id = mp.product_id AND mp.recipe_id IS NULL
                 LEFT JOIN Recipe r ON r.id = mp.recipe_id AND mp.product_id IS NULL
        WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?
        ORDER BY FIELD(m.meal_type, 'breakfast', 'lunch', 'dinner', 'snack'), mp.id;
    `;

    const sqlPhysicalActivities = `
        SELECT
            pa.id, pa.exercise_definition_id, ed.name AS exercise_name,
            pa.duration_minutes, pa.calories_burned, pa.activity_type
        FROM PhysicalActivity pa
                 LEFT JOIN ExerciseDefinition ed ON pa.exercise_definition_id = ed.id
        WHERE pa.user_id = ? AND pa.activity_date = ?
        ORDER BY pa.id;
    `;

    // Fetch meal items
    conn.query(sqlMealItems, [userId, date], (errMealItems, mealItemRows) => {
        if (errMealItems) {
            console.error('getDay - SQL Error (fetch meal items):', errMealItems.code, errMealItems.sqlMessage, errMealItems);
            return res.status(500).json({ error: 'Failed to fetch diary meal entries', details: errMealItems.code });
        }

        // Fetch physical activities
        conn.query(sqlPhysicalActivities, [userId, date], (errActivities, loggedActivities) => {
            if (errActivities) {
                console.error('getDay - SQL Error (fetch activities):', errActivities.code, errActivities.sqlMessage, errActivities);
                return res.status(500).json({ error: 'Failed to fetch logged activities', details: errActivities.code });
            }

            // Get unique recipe IDs from meal items
            const recipeIdsInDiary = [...new Set((mealItemRows || []).filter(r => r.recipe_id).map(r => r.recipe_id))];

            // Fetch recipe details if needed
            if (recipeIdsInDiary.length > 0) {
                getRecipeDetailsWithNutrition(recipeIdsInDiary, (recipeErr, recipesFullDetails) => {
                    if (recipeErr) {
                        return res.status(500).json({ error: 'Failed to fetch detailed recipe information for diary', details: recipeErr.code || recipeErr.message });
                    }
                    processAndRespondGetDay(userId, date, mealItemRows || [], loggedActivities || [], recipesFullDetails, res, req);
                });
            } else {
                processAndRespondGetDay(userId, date, mealItemRows || [], loggedActivities || [], {}, res, req);
            }
        });
    });
};

/**
 * Saves a meal entry to the diary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response indicating success or failure
 */
exports.saveMeal = (req, res) => {
    const userId = req.user.id;
    const mealType = req.params.type;
    const { date, items = [] } = req.body;

    // Validate input
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided to save. "items" array cannot be empty.' });
    }

    // Validate each item
    for (const item of items) {
        const hasProductId = item.productId !== undefined && item.productId !== null;
        const hasAmountGrams = item.amountGrams !== undefined && item.amountGrams !== null;
        const hasRecipeId = item.recipeId !== undefined && item.recipeId !== null;
        const hasServingsConsumed = item.servingsConsumed !== undefined && item.servingsConsumed !== null;

        if (hasProductId) {
            if (!hasAmountGrams || isNaN(parseFloat(item.amountGrams)) || parseFloat(item.amountGrams) <= 0) {
                return res.status(400).json({ error: `Invalid amountGrams for productId ${item.productId}. Must be a positive number.` });
            }
        } else if (hasRecipeId) {
            if (!hasServingsConsumed || isNaN(parseFloat(item.servingsConsumed)) || parseFloat(item.servingsConsumed) <= 0) {
                return res.status(400).json({ error: `Invalid servingsConsumed for recipeId ${item.recipeId}. Must be a positive number.` });
            }
        } else {
            return res.status(400).json({ error: 'Each item must have either a valid productId with amountGrams, or a valid recipeId with servingsConsumed.' });
        }
    }

    // Store meal_datetime as plain local time string to match MySQL DATETIME expectations
    const mealDateTime = `${date} 00:00:00`;

    const upsertMealQuery = `
        INSERT INTO meal (user_id, meal_datetime, meal_type)
        VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);`;

    // Create or update meal entry
    conn.query(upsertMealQuery, [userId, mealDateTime, mealType], (err, mealResult) => {
        if (err) {
            console.error('saveMeal - SQL Error (upsert meal):', err.code, err.sqlMessage, err);
            return res.status(500).json({ error: 'Failed to process meal entry', details: err.code });
        }

        const mealId = mealResult.insertId;
        if (!mealId || mealId === 0) {
            console.error('saveMeal - Failed to get valid mealId from upsert:', mealResult);
            return res.status(500).json({ error: 'Internal error obtaining meal ID.' });
        }

        const mealProductValues = items.map(item => {
            if (item.productId) {
                return [mealId, Number(item.productId), parseFloat(item.amountGrams), null, null];
            } else {
                return [mealId, null, null, Number(item.recipeId), parseFloat(item.servingsConsumed)];
            }
        });

        const insertMealProductsQuery = `
            INSERT INTO MealProduct (meal_id, product_id, product_amount, recipe_id, servings_consumed)
            VALUES ?;`;

        conn.query(insertMealProductsQuery, [mealProductValues], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('saveMeal - SQL Error (insert meal products):', insertErr.code, insertErr.sqlMessage, insertErr); // Keep detailed log
                return res.status(500).json({ error: 'Failed to save meal items to diary', details: insertErr.code });
            }

            checkAndAwardAchievements(userId, {
                type: 'MEAL_LOGGED',
                data: { date: date, mealType: mealType, itemCount: items.length }
            }).catch(achErr => console.error("[DiaryCtrl] Error during achievement check after meal log:", achErr));

            const pseudoReqForGetDay = { user: req.user, query: { date: date } };
            exports.getDay(pseudoReqForGetDay, res);
        });
    });
};

// --- PATCH /api/diary/item/:mealProductId ---
exports.updateMealItem = (req, res) => {
    const mealProductId = parseInt(req.params.mealProductId, 10);
    const { amountGrams, servingsConsumed } = req.body;
    const userId = req.user.id;

    if (isNaN(mealProductId)) {
        return res.status(400).json({ error: 'Invalid meal item ID.' });
    }

    const checkQuery = `
        SELECT mp.id, mp.product_id, mp.recipe_id, m.user_id, m.meal_datetime
        FROM MealProduct mp
                 JOIN meal m ON mp.meal_id = m.id
        WHERE mp.id = ?;`;
    conn.query(checkQuery, [mealProductId], (err, items) => {
        if (err) {
            console.error('updateMealItem - SQL Error (fetch item):', err.code, err.sqlMessage, err); // Keep detailed log
            return res.status(500).json({ error: 'Failed to retrieve item for update.', details: err.code });
        }
        if (items.length === 0) { return res.status(404).json({ error: 'Meal item not found.' }); }
        const item = items[0];
        if (item.user_id !== userId) { return res.status(403).json({ error: 'Forbidden: You do not own this meal item.' }); }

        let updateQuerySql;
        let params;

        if (item.product_id !== null && amountGrams !== undefined) {
            const numAmount = parseFloat(amountGrams);
            if (isNaN(numAmount) || numAmount <= 0) { return res.status(400).json({ error: 'Invalid amountGrams.' }); }
            updateQuerySql = 'UPDATE MealProduct SET product_amount = ? WHERE id = ?';
            params = [numAmount, mealProductId];
        } else if (item.recipe_id !== null && servingsConsumed !== undefined) {
            const numServings = parseFloat(servingsConsumed);
            if (isNaN(numServings) || numServings <= 0) { return res.status(400).json({ error: 'Invalid servingsConsumed.' }); }
            updateQuerySql = 'UPDATE MealProduct SET servings_consumed = ? WHERE id = ?';
            params = [numServings, mealProductId];
        } else {
            return res.status(400).json({ error: 'Invalid request payload for update.' });
        }

        conn.query(updateQuerySql, params, (updateErr) => {
            if (updateErr) {
                console.error('updateMealItem - SQL Error (update item):', updateErr.code, updateErr.sqlMessage, updateErr); // Keep detailed log
                return res.status(500).json({ error: 'Failed to update meal item.', details: updateErr.code });
            }

            const diaryDate = item.meal_datetime ? new Date(item.meal_datetime).toISOString().split('T')[0] : date;
            checkAndAwardAchievements(userId, {
                type: 'MEAL_ITEM_UPDATED',
                data: { date: diaryDate }
            }).catch(achErr => console.error("[DiaryCtrl] Error during achievement check after meal item update:", achErr));

            const pseudoReqForGetDay = { user: req.user, query: { date: diaryDate } };
            exports.getDay(pseudoReqForGetDay, res);
        });
    });
};

// --- DELETE /api/diary/item/:mealProductId ---
exports.removeMealItem = (req, res) => {
    const mealProductId = parseInt(req.params.mealProductId, 10);
    const userId = req.user.id;

    if (isNaN(mealProductId)) { return res.status(400).json({ error: 'Invalid meal item ID.' }); }

    const checkQuery = `
        SELECT mp.id, m.user_id, m.meal_datetime
        FROM MealProduct mp
                 JOIN meal m ON mp.meal_id = m.id
        WHERE mp.id = ?;`;
    conn.query(checkQuery, [mealProductId], (err, items) => {
        if (err) {
            console.error('removeMealItem - SQL Error (fetch item):', err.code, err.sqlMessage, err); // Keep detailed log
            return res.status(500).json({ error: 'Failed to verify item for deletion.', details: err.code });
        }
        if (items.length === 0) { return res.status(404).json({ error: 'Meal item not found.' }); }
        const item = items[0];
        if (item.user_id !== userId) { return res.status(403).json({ error: 'Forbidden.' }); }

        conn.query('DELETE FROM MealProduct WHERE id = ?', [mealProductId], (deleteErr) => {
            if (deleteErr) {
                console.error('removeMealItem - SQL Error (delete item):', deleteErr.code, deleteErr.sqlMessage, deleteErr); // Keep detailed log
                return res.status(500).json({ error: 'Failed to remove meal item.', details: deleteErr.code });
            }

            const diaryDate = item.meal_datetime ? new Date(item.meal_datetime).toISOString().split('T')[0] : date;
            checkAndAwardAchievements(userId, {
                type: 'MEAL_ITEM_DELETED',
                data: { date: diaryDate }
            }).catch(achErr => console.error("[DiaryCtrl] Error during achievement check after meal item deletion:", achErr));

            const pseudoReqForGetDay = { user: req.user, query: { date: diaryDate } };
            exports.getDay(pseudoReqForGetDay, res);
        });
    });
};

// --- MODULE EXPORTS ---
module.exports = {
    getDay: exports.getDay,
    saveMeal: exports.saveMeal,
    updateMealItem: exports.updateMealItem,
    removeMealItem: exports.removeMealItem,
    getRecipeDetailsWithNutrition
};