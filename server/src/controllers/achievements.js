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
 */
exports.checkAndAwardAchievements = async (userId, actionContext) => {
    if (!userId || !actionContext || !actionContext.type) {
        console.warn("[ACH_CTRL] checkAndAwardAchievements: Invalid call parameters.", { userId, actionContext });
        return;
    }

    try {
        // Get all unearned achievements for the user
        const unearnedAchievementsQuery = `
            SELECT ad.id, ad.name, ad.criteria_type, ad.criteria_value_num, ad.criteria_value_str
            FROM AchievementDefinition ad
            LEFT JOIN UserAchievement ua ON ad.id = ua.achievement_definition_id AND ua.user_id = ?
            WHERE ua.id IS NULL;
        `;
        const unearnedDefs = await queryAsync(unearnedAchievementsQuery, [userId]);

        if (unearnedDefs.length === 0) {
            return;
        }

        // Check each unearned achievement against current action
        for (const def of unearnedDefs) {
            let conditionMet = false;

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

                default:
                    break;
            }

            // Award achievement if conditions are met
            if (conditionMet) {
                try {
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
