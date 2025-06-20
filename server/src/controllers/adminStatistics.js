// server/src/controllers/adminStatistics.js

const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

/**
 * Promisified wrapper for executing SQL queries.
 * Returns a Promise that resolves with the query result.
 */
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        if (!conn) return reject(new Error("Database connection not available."));
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * Calculates the start and end dates for a given period (in days) in SQL format (YYYY-MM-DD).
 */
function getSqlDateRangeForPeriod(periodInDays) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (periodInDays - 1));
    const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
        startDateSql: formatDate(startDate),
        endDateSql: formatDate(endDate)
    };
}

/**
 * GET /api/admin/statistics
 * Returns aggregated statistics for the admin dashboard, including:
 * - user growth
 * - content counts (products, recipes, exercises)
 * - user activity (food/activity logs)
 * - average nutrition values per user per day for a given period
 */
exports.getDashboardStatistics = async (req, res) => {
    const requestedPeriodForAverages = parseInt(req.query.period_days) || 7;
    const periodStartDate = req.query.startDate;
    const periodEndDate = req.query.endDate;

    if (!periodStartDate || !periodEndDate) {
        return res.status(400).json({ error: "Missing startDate or endDate" });
    }

    const { startDateSql: avgNutritionStartDate, endDateSql: avgNutritionEndDate } = getSqlDateRangeForPeriod(requestedPeriodForAverages);
    const todayStr = new Date().toISOString().slice(0, 10);
    const { startDateSql: sevenDaysAgoFixedDate } = getSqlDateRangeForPeriod(7);

    try {
        // Parallel queries for users, content, and activity statistics
        const [
            totalUsersResult,
            newUsersLast7DaysResult,
            newUsersLast30DaysResult,
            newUsersInPeriodResult,
            productStatsResult,
            recipeStatsResult,
            exerciseDefStatsResult,
            usersLoggedFoodTodayResult,
            usersLoggedActivityTodayResult,
            totalMealProductsLast7DaysResult,
            totalActivitiesLast7DaysResult,
            usersLoggedFoodInPeriodResult,
            usersLoggedActivityInPeriodResult,
            mealProductsInPeriodResult,
            activitiesInPeriodResult
        ] = await Promise.all([
            queryAsync('SELECT COUNT(*) as totalUsers FROM User;'),
            queryAsync('SELECT COUNT(*) as newUsers FROM User WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);'),
            queryAsync('SELECT COUNT(*) as newUsers FROM User WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);'),
            queryAsync('SELECT COUNT(*) as newUsers FROM User WHERE DATE(created_at) BETWEEN ? AND ?;', [periodStartDate, periodEndDate]),
            queryAsync(`SELECT COUNT(*) as total, SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count, SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count FROM product;`),
            queryAsync(`SELECT COUNT(*) as total, SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count, SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count FROM Recipe;`),
            queryAsync(`SELECT COUNT(*) as total, SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count, SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count FROM ExerciseDefinition;`),
            queryAsync('SELECT COUNT(DISTINCT user_id) as count FROM meal WHERE DATE(meal_datetime) = ?;', [todayStr]),
            queryAsync('SELECT COUNT(DISTINCT user_id) as count FROM PhysicalActivity WHERE activity_date = ?;', [todayStr]),
            queryAsync('SELECT COUNT(mp.id) as count FROM MealProduct mp JOIN meal m ON mp.meal_id = m.id WHERE DATE(m.meal_datetime) BETWEEN ? AND ?;', [sevenDaysAgoFixedDate, todayStr]),
            queryAsync('SELECT COUNT(*) as count FROM PhysicalActivity WHERE activity_date BETWEEN ? AND ?;', [sevenDaysAgoFixedDate, todayStr]),
            queryAsync('SELECT COUNT(DISTINCT user_id) as count FROM meal WHERE meal_date BETWEEN ? AND ?;', [periodStartDate, periodEndDate]),
            queryAsync('SELECT COUNT(DISTINCT user_id) as count FROM PhysicalActivity WHERE activity_date BETWEEN ? AND ?;', [periodStartDate, periodEndDate]),
            queryAsync(`SELECT COUNT(*) as count FROM MealProduct mp JOIN meal m ON mp.meal_id = m.id WHERE m.meal_date BETWEEN ? AND ?;`, [periodStartDate, periodEndDate]),
            queryAsync('SELECT COUNT(*) as count FROM PhysicalActivity WHERE activity_date BETWEEN ? AND ?;', [periodStartDate, periodEndDate])
        ]);

        /**
         * SQL query to calculate total consumed macronutrients and calories
         * across all users, normalized per 100g and by serving size for recipes.
         */
        const dailyIntakeForAveragesQuery = `
            SELECT
                COALESCE(SUM(
                                 CASE
                                     WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.calories
                                     WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                                         (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_kcal
                                     ELSE 0
                                     END
                         ), 0) AS total_kcal_sum,
                COALESCE(SUM(
                                 CASE
                                     WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.protein
                                     WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                                         (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_protein
                                     ELSE 0
                                     END
                         ), 0) AS total_protein_sum,
                COALESCE(SUM(
                                 CASE
                                     WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.fat
                                     WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                                         (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_fat
                                     ELSE 0
                                     END
                         ), 0) AS total_fat_sum,
                COALESCE(SUM(
                                 CASE
                                     WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.carbs
                                     WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN
                                         (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_carbs
                                     ELSE 0
                                     END
                         ), 0) AS total_carbs_sum,
                COUNT(DISTINCT m.user_id, DATE(m.meal_datetime)) as user_log_days
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
            WHERE DATE(m.meal_datetime) BETWEEN ? AND ?;
        `;

        const platformNutritionTotalsResult = await queryAsync(dailyIntakeForAveragesQuery, [avgNutritionStartDate, avgNutritionEndDate]);
        const platformTotals = platformNutritionTotalsResult[0];

        let avgKcal = 0, avgProtein = 0, avgFat = 0, avgCarbs = 0;
        const userLogDays = platformTotals?.user_log_days || 0;

        if (userLogDays > 0) {
            avgKcal = (platformTotals.total_kcal_sum || 0) / userLogDays;
            avgProtein = (platformTotals.total_protein_sum || 0) / userLogDays;
            avgFat = (platformTotals.total_fat_sum || 0) / userLogDays;
            avgCarbs = (platformTotals.total_carbs_sum || 0) / userLogDays;
        }

        // Final response structure for the admin dashboard
        const responsePayload = {
            users: {
                total: totalUsersResult[0]?.totalUsers || 0,
                newLast7Days: newUsersLast7DaysResult[0]?.newUsers || 0,
                newLast30Days: newUsersLast30DaysResult[0]?.newUsers || 0,
                newInPeriod: newUsersInPeriodResult[0]?.newUsers || 0
            },
            content: {
                products: {
                    total: productStatsResult[0]?.total || 0,
                    public: productStatsResult[0]?.public_count || 0,
                    private: productStatsResult[0]?.private_count || 0
                },
                recipes: {
                    total: recipeStatsResult[0]?.total || 0,
                    public: recipeStatsResult[0]?.public_count || 0,
                    private: recipeStatsResult[0]?.private_count || 0
                },
                exerciseDefinitions: {
                    total: exerciseDefStatsResult[0]?.total || 0,
                    public: exerciseDefStatsResult[0]?.public_count || 0,
                    private: exerciseDefStatsResult[0]?.private_count || 0
                }
            },
            activity: {
                usersLoggedFoodToday: usersLoggedFoodTodayResult[0]?.count || 0,
                usersLoggedActivityToday: usersLoggedActivityTodayResult[0]?.count || 0,
                mealProductsLast7Days: totalMealProductsLast7DaysResult[0]?.count || 0,
                physicalActivitiesLast7Days: totalActivitiesLast7DaysResult[0]?.count || 0,
                usersLoggedFoodInPeriod: usersLoggedFoodInPeriodResult[0]?.count || 0,
                usersLoggedActivityInPeriod: usersLoggedActivityInPeriodResult[0]?.count || 0,
                mealProductsInPeriod: mealProductsInPeriodResult[0]?.count || 0,
                physicalActivitiesInPeriod: activitiesInPeriodResult[0]?.count || 0
            },
            platformAverageNutrition: {
                periodDays: requestedPeriodForAverages,
                avgDailyKcalConsumed: Math.round(avgKcal),
                avgDailyProteinGrams: parseFloat(avgProtein.toFixed(1)),
                avgDailyFatGrams: parseFloat(avgFat.toFixed(1)),
                avgDailyCarbsGrams: parseFloat(avgCarbs.toFixed(1)),
                numberOfUserDaysLogged: userLogDays
            },
            period: {
                startDate: periodStartDate,
                endDate: periodEndDate
            }
        };

        res.json(responsePayload);

    } catch (error) {
        console.error("[AdminStatsCtrl] getDashboardStatistics - Error:", error.message);
        res.status(500).json({ error: "Failed to retrieve dashboard statistics.", details: error.message });
    }
};
