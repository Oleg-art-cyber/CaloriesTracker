// server/controllers/adminStatistics.js
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();
// const { getRecipeDetailsWithNutrition } = require('./diary'); // Not directly needed here if query is self-contained

function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        if (!conn) return reject(new Error("Database connection not available."));
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Helper for date ranges, specific to platform average nutrition
function getStartAndEndDatesForAverageNutrition(periodInDays) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (periodInDays -1)); // Inclusive start date

    // Format for SQL DATETIME comparison
    const startDateSQL = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00:00`;
    const endDateSQL = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59`;
    return { startDateSQL, endDateSQL };
}


exports.getDashboardStatistics = async (req, res) => {
    // Admin role is checked by middleware
    const periodDaysForAverages = parseInt(req.query.period_days) || 7; // For platform average nutrition

    if (![7, 30, 180, 365].includes(periodDaysForAverages) && req.query.period_days !== undefined) {
        return res.status(400).json({ error: 'Invalid period_days for averages. Allowed: 7, 30, 180, 365 or leave empty for default (7).' });
    }

    const { startDateSQL, endDateSQL } = getStartAndEndDatesForAverageNutrition(periodDaysForAverages);

    try {
        // --- User Statistics (These are general totals, not period-dependent) ---
        const totalUsersData = await queryAsync('SELECT COUNT(*) as totalUsers FROM User;');
        const newUsersLast7DaysData = await queryAsync('SELECT COUNT(*) as newUsers FROM User WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);');
        const newUsersLast30DaysData = await queryAsync('SELECT COUNT(*) as newUsers FROM User WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);');

        // --- Content Statistics (General totals) ---
        const productStatsData = await queryAsync(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count,
                   SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count
            FROM product;`);
        const recipeStatsData = await queryAsync(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count,
                   SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count
            FROM Recipe;`);
        const exerciseDefStatsData = await queryAsync(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count,
                   SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_count
            FROM ExerciseDefinition;`);

        // --- User Activity Statistics (Specific periods, could also be parameterized if needed) ---
        const todayStr = new Date().toISOString().slice(0, 10);
        const usersLoggedFoodTodayData = await queryAsync('SELECT COUNT(DISTINCT user_id) as count FROM meal WHERE DATE(meal_datetime) = ?;', [todayStr]);
        const usersLoggedActivityTodayData = await queryAsync('SELECT COUNT(DISTINCT user_id) as count FROM PhysicalActivity WHERE activity_date = ?;', [todayStr]);

        // For "Last 7 Days" activity, we use a fixed 7-day period, not the one from query params
        const sevenDaysAgoFixed = new Date();
        sevenDaysAgoFixed.setDate(sevenDaysAgoFixed.getDate() - 6);
        const sevenDaysAgoFixedStrSQL = `${sevenDaysAgoFixed.getFullYear()}-${String(sevenDaysAgoFixed.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgoFixed.getDate()).padStart(2, '0')} 00:00:00`;
        const todayEndStrSQL = `${todayStr} 23:59:59`;

        const totalMealProductsLast7DaysData = await queryAsync(
            'SELECT COUNT(mp.id) as count FROM MealProduct mp JOIN meal m ON mp.meal_id = m.id WHERE m.meal_datetime BETWEEN ? AND ?;',
            [sevenDaysAgoFixedStrSQL, todayEndStrSQL]
        );
        const totalActivitiesLast7DaysData = await queryAsync(
            'SELECT COUNT(*) as count FROM PhysicalActivity WHERE activity_date BETWEEN ? AND ?;',
            [sevenDaysAgoFixed.toISOString().slice(0,10), todayStr]
        );


        // --- Platform Average Nutrition Statistics (Uses period_days from query) ---
        const dailyIntakePerUserQuery = `
            SELECT
                COALESCE(SUM(
                    CASE
                        WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.calories
                        WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN 
                            (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_kcal
                        ELSE 0
                    END
                ),0) AS total_kcal_sum,
                COALESCE(SUM(
                    CASE
                        WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.protein
                        WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN 
                            (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_protein
                        ELSE 0
                    END
                ),0) AS total_protein_sum,
                COALESCE(SUM(
                    CASE
                        WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.fat
                        WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN 
                            (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_fat
                        ELSE 0
                    END
                ),0) AS total_fat_sum,
                COALESCE(SUM(
                    CASE
                        WHEN mp.product_id IS NOT NULL THEN (mp.product_amount / 100.0) * p.carbs
                        WHEN mp.recipe_id IS NOT NULL AND r_info.total_servings > 0 THEN 
                            (mp.servings_consumed / r_info.total_servings) * r_info.total_recipe_carbs
                        ELSE 0
                    END
                ),0) AS total_carbs_sum,
                COUNT(DISTINCT m.user_id, DATE(m.meal_datetime)) as user_log_days
            FROM meal m
            JOIN MealProduct mp ON m.id = mp.meal_id
            LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL
            LEFT JOIN ( 
                SELECT 
                    r_sub.id as recipe_id,
                    r_sub.total_servings,
                    SUM((ri.amount_grams / 100.0) * p_ing.calories) as total_recipe_kcal,
                    SUM((ri.amount_grams / 100.0) * p_ing.protein) as total_recipe_protein,
                    SUM((ri.amount_grams / 100.0) * p_ing.fat) as total_recipe_fat,
                    SUM((ri.amount_grams / 100.0) * p_ing.carbs) as total_recipe_carbs
                FROM Recipe r_sub
                JOIN RecipeIngredient ri ON r_sub.id = ri.recipe_id
                JOIN product p_ing ON ri.product_id = p_ing.id
                GROUP BY r_sub.id, r_sub.total_servings
            ) r_info ON mp.recipe_id = r_info.recipe_id AND mp.product_id IS NULL
            WHERE m.meal_datetime >= ? AND m.meal_datetime < DATE_ADD(?, INTERVAL 1 DAY);
        `;
        // The date range for averages should be [startDateForAverages (inclusive), endDateForAverages + 1 day (exclusive)]
        // This is slightly different from the dailyIntakePerUserQuery in the previous answer for periodSummary.
        // Let's use the start and end dates derived from periodDays.
        const firstDayOfPeriod = new Date();
        firstDayOfPeriod.setDate(firstDayOfPeriod.getDate() - periodDaysForAverages + 1);
        firstDayOfPeriod.setUTCHours(0,0,0,0);

        const dayAfterLastDayOfPeriod = new Date(); // today + 1 day
        dayAfterLastDayOfPeriod.setDate(dayAfterLastDayOfPeriod.getDate() + 1);
        dayAfterLastDayOfPeriod.setUTCHours(0,0,0,0);


        const [platformNutritionTotalsData] = await queryAsync(dailyIntakePerUserQuery, [
            firstDayOfPeriod.toISOString().slice(0,10), // YYYY-MM-DD
            dayAfterLastDayOfPeriod.toISOString().slice(0,10) // YYYY-MM-DD
        ]);
        // The query above already SUMs everything for the period and counts user_log_days.
        // So, platformNutritionTotalsData is an array with ONE row.

        let avgKcal = 0, avgProtein = 0, avgFat = 0, avgCarbs = 0;
        const platformTotals = platformNutritionTotalsData; // It's already the single row of totals
        const userLogDays = platformTotals?.user_log_days || 0;

        if (userLogDays > 0) {
            avgKcal = (platformTotals.total_kcal_sum || 0) / userLogDays;
            avgProtein = (platformTotals.total_protein_sum || 0) / userLogDays;
            avgFat = (platformTotals.total_fat_sum || 0) / userLogDays;
            avgCarbs = (platformTotals.total_carbs_sum || 0) / userLogDays;
        }

        res.json({
            users: {
                total: totalUsersData[0]?.totalUsers || 0,
                newLast7Days: newUsersLast7DaysData[0]?.newUsers || 0,
                newLast30Days: newUsersLast30DaysData[0]?.newUsers || 0,
            },
            content: {
                products: { total: productStatsData[0]?.total || 0, public: productStatsData[0]?.public_count || 0, private: productStatsData[0]?.private_count || 0 },
                recipes: { total: recipeStatsData[0]?.total || 0, public: recipeStatsData[0]?.public_count || 0, private: recipeStatsData[0]?.private_count || 0 },
                exerciseDefinitions: { total: exerciseDefStatsData[0]?.total || 0, public: exerciseDefStatsData[0]?.public_count || 0, private: exerciseDefStatsData[0]?.private_count || 0 },
            },
            activity: {
                usersLoggedFoodToday: usersLoggedFoodTodayData[0]?.count || 0,
                usersLoggedActivityToday: usersLoggedActivityTodayData[0]?.count || 0,
                mealProductsLast7Days: totalMealProductsLast7DaysData[0]?.count || 0,
                physicalActivitiesLast7Days: totalActivitiesLast7DaysData[0]?.count || 0,
            },
            platformAverageNutrition: { // Renamed from platformAverageNutritionLast7Days
                periodDays: periodDaysForAverages,
                avgDailyKcalConsumed: Math.round(avgKcal),
                avgDailyProteinGrams: parseFloat(avgProtein.toFixed(1)),
                avgDailyFatGrams: parseFloat(avgFat.toFixed(1)),
                avgDailyCarbsGrams: parseFloat(avgCarbs.toFixed(1)),
                numberOfUserDaysLogged: userLogDays
            }
        });

    } catch (error) {
        console.error("getDashboardStatistics - Error:", error);
        res.status(500).json({ error: "Failed to retrieve dashboard statistics.", details: error.message });
    }
};