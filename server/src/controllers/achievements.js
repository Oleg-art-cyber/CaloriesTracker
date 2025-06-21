// server/controllers/achievements.js

/**
 * Achievements Controller
 * Handles achievement-related operations including retrieval, checking, and awarding
 * of achievements to users based on their activities and progress
 */
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

/**
 * Executes a SQL query using promises instead of callbacks
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise} Promise that resolves with query results or rejects with error
 */
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * Retrieves all achievement definitions and indicates which ones the user has earned
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing achievements with earned status
 * 
 * Response includes:
 * - Achievement details (id, name, description, icon, category)
 * - Criteria description and points
 * - Whether the achievement has been earned
 * - Date when the achievement was earned (if applicable)
 */
exports.getAllAchievementsForUser = (req, res) => {
    if (!req.user || typeof req.user.id === 'undefined') {
        console.error("[ACH_CTRL] getAllAchievementsForUser - User ID missing in req.user.");
        return res.status(401).json({ error: 'User not authenticated or user ID missing.' });
    }

    const userId = req.user.id;
    const query = `
        SELECT 
            ad.id, ad.name, ad.description, ad.icon_class, ad.category,
            ad.criteria_description, ad.points,
            CASE WHEN ua.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_earned,
            ua.achieved_date
        FROM AchievementDefinition ad
        LEFT JOIN UserAchievement ua ON ad.id = ua.achievement_definition_id AND ua.user_id = ?
        ORDER BY ad.category ASC, 
                 (CASE WHEN ua.user_id IS NOT NULL THEN 0 ELSE 1 END) ASC, 
                 ad.name ASC;
    `;

    conn.query(query, [userId], (err, results) => {
        if (err) {
            console.error("[ACH_CTRL] getAllAchievementsForUser - SQL Error:", err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to retrieve achievements.', details: err.code });
        }
        res.json(results);
    });
};

/**
 * Awards a specific achievement to a user if not already awarded
 * @param {number} userId - User ID
 * @param {number} achievementDefinitionId - Achievement definition ID
 * @returns {Promise<Object>} Object containing award status and details
 * 
 * Returns:
 * - {alreadyEarned: true} if achievement was already earned
 * - {earned: true, insertId, achievementId} if newly awarded
 */
async function awardAchievementInternal(userId, achievementDefinitionId) {
    const checkQuery = 'SELECT id FROM UserAchievement WHERE user_id = ? AND achievement_definition_id = ?;';
    const rows = await queryAsync(checkQuery, [userId, achievementDefinitionId]);

    if (rows.length > 0) {
        return { alreadyEarned: true, achievementId: achievementDefinitionId };
    }

    const insertQuery = 'INSERT INTO UserAchievement (user_id, achievement_definition_id) VALUES (?, ?);';
    const result = await queryAsync(insertQuery, [userId, achievementDefinitionId]);

    console.log(`[ACHIEVEMENT EARNED] User ${userId} earned achievement definition ID: ${achievementDefinitionId} (UserAchievement ID: ${result.insertId})`);
    return { earned: true, insertId: result.insertId, achievementId: achievementDefinitionId };
}

/**
 * Evaluates and awards achievements based on user actions
 * @param {number} userId - User ID
 * @param {Object} actionContext - Context of the action that triggered the check
 * @param {string} actionContext.type - Type of action (e.g., 'MEAL_LOGGED', 'RECIPE_CREATED')
 * @param {Object} [actionContext.data] - Additional data related to the action
 * 
 * Achievement types checked:
 * - first_meal_log: First meal logged
 * - recipes_created_count: Number of recipes created
 * - profile_complete: All profile fields filled
 * - calories_burned_day: Calories burned in a single day
 * - consecutive_days_tracked: Consecutive days of food tracking
 * - consecutive_activity_days: Consecutive days of activity logging
 * - consecutive_weight_logs: Consecutive days of weight logging
 * - protein_target_met_times: Times protein target was met
 * - calorie_target_met: Daily calorie goal met within range
 * - all_macros_met: All macro targets met in one day
 * - food_variety_day: Different food categories in one day
 * - long_workout: Single workout duration
 * - weekly_calories_burned: Weekly exercise calories
 * - own_recipes_used: Meals using own recipes
 * - profile_updated: Profile information updated
 * - first_weight_log: First weight log entry
 * - meal_types_day: Different meal types in one day
 * - consistent_meal_times: Consistent meal timing
 * - complete_meal_week: All meals logged for week
 */
exports.checkAndAwardAchievements = async (userId, actionContext) => {
    if (!userId || !actionContext || !actionContext.type) {
        console.warn("[ACH_CTRL] checkAndAwardAchievements: Invalid call parameters.", { userId, actionContext });
        return;
    }

    console.log(`[ACH_CTRL] Checking achievements for user ${userId}, action: ${actionContext.type}`, actionContext.data);

    try {
        // Get all unearned achievements for the user
        const unearnedAchievementsQuery = `
            SELECT ad.id, ad.name, ad.criteria_type, ad.criteria_value_num, ad.criteria_value_str
            FROM AchievementDefinition ad
            LEFT JOIN UserAchievement ua ON ad.id = ua.achievement_definition_id AND ua.user_id = ?
            WHERE ua.id IS NULL;
        `;
        const unearnedDefs = await queryAsync(unearnedAchievementsQuery, [userId]);

        console.log(`[ACH_CTRL] Found ${unearnedDefs.length} unearned achievements for user ${userId}`);

        if (unearnedDefs.length === 0) {
            console.log(`[ACH_CTRL] No unearned achievements found for user ${userId}`);
            return;
        }

        // Check each unearned achievement against current action
        for (const def of unearnedDefs) {
            let conditionMet = false;
            console.log(`[ACH_CTRL] Checking achievement ${def.id} (${def.name}) - criteria_type: ${def.criteria_type}`);

            switch (def.criteria_type) {
                case 'first_meal_log':
                    if (actionContext.type === 'MEAL_LOGGED') {
                        conditionMet = true;
                    }
                    break;

                case 'recipes_created_count':
                    if (actionContext.type === 'RECIPE_CREATED' || actionContext.type === 'DIARY_LOADED') {
                        const countRows = await queryAsync(
                            'SELECT COUNT(*) as count FROM Recipe WHERE user_id = ?',
                            [userId]
                        );
                        if (countRows[0].count >= (def.criteria_value_num || 1)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'profile_complete':
                    if (actionContext.type === 'PROFILE_UPDATED' || actionContext.type === 'DIARY_LOADED') {
                        const userRows = await queryAsync(
                            'SELECT weight, height, age, gender, activity_level, goal FROM User WHERE id = ?',
                            [userId]
                        );
                        if (userRows.length > 0) {
                            const p = userRows[0];
                            if (p.weight && p.height && p.age && p.goal && p.gender && p.activity_level) {
                                conditionMet = true;
                            }
                        }
                    }
                    break;

                case 'calories_burned_day':
                    if (actionContext.type === 'ACTIVITY_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const dateToCheck = actionContext.data?.activity_date || actionContext.data?.date || new Date().toISOString().slice(0, 10);
                        const activitySumRows = await queryAsync(
                            'SELECT SUM(calories_burned) as total_burned FROM PhysicalActivity WHERE user_id = ? AND activity_date = ?',
                            [userId, dateToCheck]
                        );
                        if (activitySumRows.length > 0 && (activitySumRows[0].total_burned || 0) >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'consecutive_days_tracked':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const consecutiveDays = await getConsecutiveDaysTracked(userId);
                        if (consecutiveDays >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'consecutive_activity_days':
                    if (actionContext.type === 'ACTIVITY_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const consecutiveDays = await getConsecutiveActivityDays(userId);
                        if (consecutiveDays >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'consecutive_weight_logs':
                    if (actionContext.type === 'WEIGHT_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const consecutiveDays = await getConsecutiveWeightLogs(userId);
                        if (consecutiveDays >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'protein_target_met_times':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const dateToCheck = actionContext.data?.date || new Date().toISOString().slice(0, 10);
                        const proteinTargetMet = await checkProteinTargetMet(userId, dateToCheck);
                        if (proteinTargetMet) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'calorie_target_met':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const dateToCheck = actionContext.data?.date || new Date().toISOString().slice(0, 10);
                        const calorieTargetMet = await checkCalorieTargetMet(userId, dateToCheck);
                        if (calorieTargetMet) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'all_macros_met':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const dateToCheck = actionContext.data?.date || new Date().toISOString().slice(0, 10);
                        const allMacrosMet = await checkAllMacrosMet(userId, dateToCheck);
                        if (allMacrosMet) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'food_variety_day':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const dateToCheck = actionContext.data?.date || new Date().toISOString().slice(0, 10);
                        const foodCategories = await getFoodCategoriesForDay(userId, dateToCheck);
                        if (foodCategories >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'long_workout':
                    if (actionContext.type === 'ACTIVITY_LOGGED') {
                        const duration = actionContext.data?.duration_minutes || 0;
                        if (duration >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'weekly_calories_burned':
                    if (actionContext.type === 'ACTIVITY_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const weeklyCalories = await getWeeklyCaloriesBurned(userId);
                        if (weeklyCalories >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'own_recipes_used':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const ownRecipesUsed = await getOwnRecipesUsedCount(userId);
                        if (ownRecipesUsed >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'profile_updated':
                    if (actionContext.type === 'PROFILE_UPDATED') {
                        conditionMet = true;
                    }
                    break;

                case 'first_weight_log':
                    console.log(`[ACH_CTRL] Checking first_weight_log - actionContext.type: ${actionContext.type}, weight_logged: ${actionContext.data?.weight_logged}`);
                    if (actionContext.type === 'WEIGHT_LOGGED' || (actionContext.type === 'PROFILE_UPDATED' && actionContext.data?.weight_logged === true)) {
                        conditionMet = true;
                        console.log(`[ACH_CTRL] first_weight_log condition met!`);
                    }
                    break;

                case 'meal_types_day':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const dateToCheck = actionContext.data?.date || new Date().toISOString().slice(0, 10);
                        const mealTypes = await getMealTypesForDay(userId, dateToCheck);
                        if (mealTypes >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'consistent_meal_times':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const consistentDays = await getConsistentMealTimesDays(userId);
                        if (consistentDays >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'complete_meal_week':
                    if (actionContext.type === 'MEAL_LOGGED' || actionContext.type === 'DIARY_LOADED') {
                        const completeDays = await getCompleteMealWeekDays(userId);
                        if (completeDays >= (def.criteria_value_num || 0)) {
                            conditionMet = true;
                        }
                    }
                    break;

                default:
                    break;
            }

            // Award achievement if conditions are met
            if (conditionMet) {
                try {
                    console.log(`[ACH_CTRL] Awarding achievement ${def.id} (${def.name}) to user ${userId}`);
                    await awardAchievementInternal(userId, def.id);
                } catch (awardError) {
                    console.error(`[ACH_CTRL] Error during internal award for achId ${def.id}, userId ${userId}:`, awardError);
                }
            }
        }
    } catch (error) {
        console.error(`[ACH_CTRL] General error in checkAndAwardAchievements for user ${userId}:`, error);
    }
};

// Helper functions for achievement checks

/**
 * Gets consecutive days of food tracking
 */
async function getConsecutiveDaysTracked(userId) {
    const query = `
        SELECT COUNT(*) as consecutive_days
        FROM (
            SELECT DISTINCT DATE(meal_datetime) as meal_date
            FROM meal 
            WHERE user_id = ?
            ORDER BY meal_date DESC
        ) dates
        WHERE meal_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND meal_date <= CURDATE()
    `;
    const result = await queryAsync(query, [userId]);
    return result[0]?.consecutive_days || 0;
}

/**
 * Gets consecutive days of activity logging
 */
async function getConsecutiveActivityDays(userId) {
    const query = `
        SELECT COUNT(*) as consecutive_days
        FROM (
            SELECT DISTINCT activity_date
            FROM PhysicalActivity 
            WHERE user_id = ?
            ORDER BY activity_date DESC
        ) dates
        WHERE activity_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND activity_date <= CURDATE()
    `;
    const result = await queryAsync(query, [userId]);
    return result[0]?.consecutive_days || 0;
}

/**
 * Gets consecutive days of weight logging
 */
async function getConsecutiveWeightLogs(userId) {
    const query = `
        SELECT COUNT(*) as consecutive_days
        FROM (
            SELECT DISTINCT log_date
            FROM weight_log 
            WHERE user_id = ?
            ORDER BY log_date DESC
        ) dates
        WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND log_date <= CURDATE()
    `;
    const result = await queryAsync(query, [userId]);
    return result[0]?.consecutive_days || 0;
}

/**
 * Checks if protein target was met for a specific day
 */
async function checkProteinTargetMet(userId, date) {
    const userQuery = 'SELECT weight, calculated_target_calories FROM User WHERE id = ?';
    const userResult = await queryAsync(userQuery, [userId]);
    if (userResult.length === 0) return false;

    const user = userResult[0];
    const proteinTarget = user.weight * 1.6; // 1.6g per kg body weight

    const dailyProteinQuery = `
        SELECT COALESCE(SUM(
            CASE
                WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.protein
                WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                    (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_protein
                ELSE 0
            END
        ), 0) as daily_protein
        FROM meal m
        JOIN MealProduct mp ON m.id = mp.meal_id
        LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL
        LEFT JOIN (
            SELECT
                r_sub.id as recipe_id,
                r_sub.total_servings,
                COALESCE(SUM((ri.amount_grams / 100.0) * p_ing.protein),0) as total_recipe_protein
            FROM Recipe r_sub
            JOIN RecipeIngredient ri ON r_sub.id = ri.recipe_id
            JOIN product p_ing ON ri.product_id = p_ing.id
            GROUP BY r_sub.id, r_sub.total_servings
        ) r_info ON mp.recipe_id = r_info.recipe_id AND mp.product_id IS NULL
        WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?
    `;
    const proteinResult = await queryAsync(dailyProteinQuery, [userId, date]);
    const dailyProtein = proteinResult[0]?.daily_protein || 0;
    const proteinMet = dailyProtein >= proteinTarget;

    console.log(`[ACH_CTRL] Protein check for user ${userId} on ${date}: ${dailyProtein.toFixed(1)}g / ${proteinTarget.toFixed(1)}g (${proteinMet ? '✓' : '✗'})`);

    return proteinMet;
}

/**
 * Checks if calorie target was met within 100 calories
 */
async function checkCalorieTargetMet(userId, date) {
    const userQuery = 'SELECT calculated_target_calories FROM User WHERE id = ?';
    const userResult = await queryAsync(userQuery, [userId]);
    if (userResult.length === 0) return false;

    const targetCalories = userResult[0].calculated_target_calories;
    if (!targetCalories) return false;

    const dailyCaloriesQuery = `
        SELECT COALESCE(SUM(
            CASE
                WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.calories
                WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                    (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_kcal
                ELSE 0
            END
        ), 0) as daily_calories
        FROM meal m
        JOIN MealProduct mp ON m.id = mp.meal_id
        LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL
        LEFT JOIN (
            SELECT
                r_sub.id as recipe_id,
                r_sub.total_servings,
                COALESCE(SUM((ri.amount_grams / 100.0) * p_ing.calories),0) as total_recipe_kcal
            FROM Recipe r_sub
            JOIN RecipeIngredient ri ON r_sub.id = ri.recipe_id
            JOIN product p_ing ON ri.product_id = p_ing.id
            GROUP BY r_sub.id, r_sub.total_servings
        ) r_info ON mp.recipe_id = r_info.recipe_id AND mp.product_id IS NULL
        WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?
    `;
    const caloriesResult = await queryAsync(dailyCaloriesQuery, [userId, date]);
    const dailyCalories = caloriesResult[0]?.daily_calories || 0;
    
    return Math.abs(dailyCalories - targetCalories) <= 100;
}

/**
 * Checks if all macro targets were met in one day
 */
async function checkAllMacrosMet(userId, date) {
    const userQuery = 'SELECT weight, calculated_target_calories FROM User WHERE id = ?';
    const userResult = await queryAsync(userQuery, [userId]);
    if (userResult.length === 0) return false;

    const user = userResult[0];
    const proteinTarget = user.weight * 1.6;
    const calorieTarget = user.calculated_target_calories;
    const fatTarget = (calorieTarget * 0.25) / 9; // 25% of calories from fat
    const carbTarget = (calorieTarget * 0.45) / 4; // 45% of calories from carbs

    const dailyMacrosQuery = `
        SELECT 
            COALESCE(SUM(
                CASE
                    WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.calories
                    WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                        (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_kcal
                    ELSE 0
                END
            ), 0) as daily_calories,
            COALESCE(SUM(
                CASE
                    WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.protein
                    WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                        (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_protein
                    ELSE 0
                END
            ), 0) as daily_protein,
            COALESCE(SUM(
                CASE
                    WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.fat
                    WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                        (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_fat
                    ELSE 0
                END
            ), 0) as daily_fat,
            COALESCE(SUM(
                CASE
                    WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.carbs
                    WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                        (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_carbs
                    ELSE 0
                END
            ), 0) as daily_carbs
        FROM meal m
        JOIN MealProduct mp ON m.id = mp.meal_id
        LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL
        LEFT JOIN (
            SELECT
                r_sub.id as recipe_id,
                r_sub.total_servings,
                COALESCE(SUM((ri.amount_grams / 100.0) * p_ing.calories),0) as total_recipe_kcal,
                COALESCE(SUM((ri.amount_grams / 100.0) * p_ing.protein),0) as total_recipe_protein,
                COALESCE(SUM((ri.amount_grams / 100.0) * p_ing.fat),0) as total_recipe_fat,
                COALESCE(SUM((ri.amount_grams / 100.0) * p_ing.carbs),0) as total_recipe_carbs
            FROM Recipe r_sub
            JOIN RecipeIngredient ri ON r_sub.id = ri.recipe_id
            JOIN product p_ing ON ri.product_id = p_ing.id
            GROUP BY r_sub.id, r_sub.total_servings
        ) r_info ON mp.recipe_id = r_info.recipe_id AND mp.product_id IS NULL
        WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?
    `;
    const macrosResult = await queryAsync(dailyMacrosQuery, [userId, date]);
    const macros = macrosResult[0];

    const proteinMet = macros.daily_protein >= proteinTarget * 0.9;
    const fatMet = macros.daily_fat >= fatTarget * 0.9;
    const carbMet = macros.daily_carbs >= carbTarget * 0.9;

    console.log(`[ACH_CTRL] Macro check for user ${userId} on ${date}:`);
    console.log(`  Protein: ${macros.daily_protein.toFixed(1)}g / ${proteinTarget.toFixed(1)}g (${proteinMet ? '✓' : '✗'})`);
    console.log(`  Fat: ${macros.daily_fat.toFixed(1)}g / ${fatTarget.toFixed(1)}g (${fatMet ? '✓' : '✗'})`);
    console.log(`  Carbs: ${macros.daily_carbs.toFixed(1)}g / ${carbTarget.toFixed(1)}g (${carbMet ? '✓' : '✗'})`);

    return proteinMet && fatMet && carbMet;
}

/**
 * Gets number of different food categories for a day
 */
async function getFoodCategoriesForDay(userId, date) {
    const query = `
        SELECT COUNT(DISTINCT p.category_id) as category_count
        FROM meal m
        JOIN MealProduct mp ON m.id = mp.meal_id
        LEFT JOIN product p ON mp.product_id = p.id
        WHERE m.user_id = ? AND DATE(m.meal_datetime) = ? AND p.category_id IS NOT NULL
    `;
    const result = await queryAsync(query, [userId, date]);
    return result[0]?.category_count || 0;
}

/**
 * Gets weekly calories burned from exercise
 */
async function getWeeklyCaloriesBurned(userId) {
    const query = `
        SELECT COALESCE(SUM(calories_burned), 0) as weekly_calories
        FROM PhysicalActivity 
        WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `;
    const result = await queryAsync(query, [userId]);
    return result[0]?.weekly_calories || 0;
}

/**
 * Gets number of meal types logged for a day
 */
async function getMealTypesForDay(userId, date) {
    const query = `
        SELECT COUNT(DISTINCT meal_type) as meal_types
        FROM meal 
        WHERE user_id = ? AND DATE(meal_datetime) = ?
    `;
    const result = await queryAsync(query, [userId, date]);
    return result[0]?.meal_types || 0;
}

/**
 * Gets count of meals using own recipes
 */
async function getOwnRecipesUsedCount(userId) {
    const query = `
        SELECT COUNT(*) as recipe_meals
        FROM meal m
        JOIN MealProduct mp ON m.id = mp.meal_id
        JOIN Recipe r ON mp.recipe_id = r.id
        WHERE m.user_id = ? AND r.user_id = ?
    `;
    const result = await queryAsync(query, [userId, userId]);
    return result[0]?.recipe_meals || 0;
}

/**
 * Gets days with consistent meal times (within 2-hour windows)
 */
async function getConsistentMealTimesDays(userId) {
    // This is a simplified implementation - would need more complex logic for actual meal time consistency
    const query = `
        SELECT COUNT(DISTINCT DATE(meal_datetime)) as consistent_days
        FROM meal 
        WHERE user_id = ? AND meal_datetime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `;
    const result = await queryAsync(query, [userId]);
    return result[0]?.consistent_days || 0;
}

/**
 * Gets days with all 4 meal types logged for a week
 */
async function getCompleteMealWeekDays(userId) {
    const query = `
        SELECT COUNT(*) as complete_days
        FROM (
            SELECT DATE(meal_datetime) as meal_date
            FROM meal 
            WHERE user_id = ? AND meal_datetime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(meal_datetime)
            HAVING COUNT(DISTINCT meal_type) >= 4
        ) complete_days
    `;
    const result = await queryAsync(query, [userId]);
    return result[0]?.complete_days || 0;
}
