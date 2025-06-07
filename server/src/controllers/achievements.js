// server/controllers/achievements.js
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

// Helper function to promisify conn.query for use within async functions
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results); // For SELECT, results is an array of rows. For INSERT/UPDATE, it's a result object.
        });
    });
}

// --- GET /api/achievements ---
// (getAllAchievementsForUser - остается без изменений из ответа #51)
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


// --- Internal helper to award an achievement (idempotent) ---
// This now uses the promisified queryAsync
async function awardAchievementInternal(userId, achievementDefinitionId) {
    // console.log(`[ACH_CTRL] awardAchievementInternal: Attempting to award achId ${achievementDefinitionId} to userId ${userId}`);
    const checkQuery = 'SELECT id FROM UserAchievement WHERE user_id = ? AND achievement_definition_id = ?;';

    // For SELECT queries with mysql2, the result is typically [rows, fields]
    // We are interested in rows.
    const rows = await queryAsync(checkQuery, [userId, achievementDefinitionId]);

    if (rows.length > 0) {
        // console.log(`[ACH_CTRL] Achievement ${achievementDefinitionId} already earned by user ${userId}.`);
        return { alreadyEarned: true, achievementId: achievementDefinitionId };
    }

    const insertQuery = 'INSERT INTO UserAchievement (user_id, achievement_definition_id) VALUES (?, ?);';
    // For INSERT queries, the result is an object with insertId, affectedRows etc.
    const result = await queryAsync(insertQuery, [userId, achievementDefinitionId]);

    console.log(`[ACHIEVEMENT EARNED] User ${userId} earned achievement definition ID: ${achievementDefinitionId} (UserAchievement ID: ${result.insertId})`);
    return { earned: true, insertId: result.insertId, achievementId: achievementDefinitionId };
}

// --- Main function to check and award achievements ---
exports.checkAndAwardAchievements = async (userId, actionContext) => {
    if (!userId || !actionContext || !actionContext.type) {
        console.warn("[ACH_CTRL] checkAndAwardAchievements: Invalid call parameters.", { userId, actionContext });
        return;
    }
    // console.log(`[ACH_CTRL] checkAndAwardAchievements: Checking for userId: ${userId}, actionType: ${actionContext.type}`);

    try {
        const unearnedAchievementsQuery = `
            SELECT ad.id, ad.name, ad.criteria_type, ad.criteria_value_num, ad.criteria_value_str
            FROM AchievementDefinition ad
                     LEFT JOIN UserAchievement ua ON ad.id = ua.achievement_definition_id AND ua.user_id = ?
            WHERE ua.id IS NULL;`;

        const unearnedDefs = await queryAsync(unearnedAchievementsQuery, [userId]); // Result is directly the array of rows

        if (unearnedDefs.length === 0) {
            // console.log(`[ACH_CTRL] User ${userId}: No new achievements to check or all are earned.`);
            return;
        }

        for (const def of unearnedDefs) {
            let conditionMet = false;
            // console.log(`[ACH_CTRL] Evaluating unearned achievement: "${def.name}" (ID: ${def.id}, Type: ${def.criteria_type}) for user ${userId}`);

            switch (def.criteria_type) {
                case 'first_meal_log':
                    if (actionContext.type === 'MEAL_LOGGED') {
                        conditionMet = true;
                    }
                    break;

                case 'recipes_created_count':
                    if (actionContext.type === 'RECIPE_CREATED' || actionContext.type === 'DIARY_LOADED') {
                        const countRows = await queryAsync('SELECT COUNT(*) as count FROM Recipe WHERE user_id = ?', [userId]);
                        if (countRows[0].count >= (def.criteria_value_num || 1)) {
                            conditionMet = true;
                        }
                    }
                    break;

                case 'profile_complete':
                    if (actionContext.type === 'PROFILE_UPDATED' || actionContext.type === 'DIARY_LOADED') {
                        const userRows = await queryAsync(
                            'SELECT weight, height, age, gender, activity_level, goal FROM User WHERE id = ?', [userId]
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
                        const dateToCheck = actionContext.data?.activity_date || actionContext.data?.date || new Date().toISOString().slice(0,10);
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

            if (conditionMet) {
                // console.log(`[ACH_CTRL] Condition MET for achievement "${def.name}" (ID: ${def.id}) for user ${userId}. Attempting to award.`);
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