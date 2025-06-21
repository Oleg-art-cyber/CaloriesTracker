/**
 * Statistics Controller
 * Handles all statistics-related operations including weight trends, calorie tracking,
 * period summaries, and macronutrient distribution analysis
 */
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();
const { getRecipeDetailsWithNutrition } = require('./diary');

/**
 * Executes a SQL query using promises instead of callbacks
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise} Promise that resolves with query results or rejects with error
 */
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        if (!conn) {
            return reject(new Error("Database connection not available."));
        }
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * Generates an array of date strings between start and end dates
 * @param {string} startDateStr - Start date in YYYY-MM-DD format
 * @param {string} endDateStr - End date in YYYY-MM-DD format
 * @returns {Array<string>} Array of date strings in YYYY-MM-DD format
 */
function getDatesInRange(startDateStr, endDateStr) {
    const dates = [];
    // Always use UTC to avoid timezone issues
    let currentDate = new Date(startDateStr + 'T00:00:00Z');
    const finalEndDate = new Date(endDateStr + 'T00:00:00Z');
    while (currentDate <= finalEndDate) {
        dates.push(currentDate.toISOString().slice(0, 10));
        currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Always increment in UTC
    }
    return dates;
}

/**
 * Calculates date range for predefined periods (week/month)
 * @param {string} period - Period type ('week' or 'month')
 * @returns {Object|null} Object containing startDate and endDate in YYYY-MM-DD format, or null if invalid period
 */
function getDateRangeForPeriod(period) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let startDate = new Date(today);
    const endDate = today.toISOString().slice(0, 10);
    if (period === 'week') {
        startDate.setDate(today.getDate() - 6);
    } else if (period === 'month') {
        startDate.setDate(today.getDate() - 29);
    } else {
        return null;
    }
    return { startDate: startDate.toISOString().slice(0, 10), endDate };
}

/**
 * Retrieves weight trend data for a user over a specified date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing weight trend data
 * 
 * Response includes:
 * - Array of {date, weight} objects
 * - Weight values are interpolated for missing dates
 */
exports.getWeightTrend = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    console.log('getWeightTrend - Received request:', { userId, startDate, endDate });

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Provide both startDate and endDate (YYYY-MM-DD).' });
    }

    try {
        // Fetch weight logs for the date range
        const weightQuery = `
            SELECT DATE(log_date) as date, weight 
            FROM weight_log 
            WHERE user_id = ? 
            AND DATE(log_date) BETWEEN ? AND ?
            ORDER BY log_date ASC;
        `;
        console.log('getWeightTrend - Executing query with params:', [userId, startDate, endDate]);
        const weightLogs = await queryAsync(weightQuery, [userId, startDate, endDate]);
        console.log('getWeightTrend - Raw query results:', weightLogs);

        // Get the last known weight before the start date
        const initialWeightQuery = `
            SELECT weight 
            FROM weight_log 
            WHERE user_id = ? 
            AND DATE(log_date) < ? 
            ORDER BY log_date DESC 
            LIMIT 1
        `;
        const initialWeightResult = await queryAsync(initialWeightQuery, [userId, startDate]);
        console.log('getWeightTrend - Initial weight result:', initialWeightResult);
        
        let lastKnownWeight = initialWeightResult[0]?.weight || null;

        // Generate trend data with interpolated values
        const allDates = getDatesInRange(startDate, endDate);
        console.log('getWeightTrend - Generated dates:', allDates);
        
        // Create a map of date to weight
        const weightMap = new Map(weightLogs.map(log => [
            typeof log.date === 'string' ? log.date.slice(0, 10) : log.date.toISOString().slice(0, 10),
            log.weight
        ]));
        console.log('getWeightTrend - Weight map:', Object.fromEntries(weightMap));
        
        const trendData = allDates.map(dateStr => {
            if (weightMap.has(dateStr)) {
                lastKnownWeight = weightMap.get(dateStr);
            }
            return { date: dateStr, weight: lastKnownWeight };
        });

        console.log('getWeightTrend - Final trend data:', trendData);
        res.json(trendData);
    } catch (error) {
        console.error("getWeightTrend - Error:", error);
        res.status(500).json({ 
            error: "Failed to retrieve weight trend data.", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Retrieves calorie consumption and burn trends for a user over a specified date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing daily calorie data
 * 
 * Response includes:
 * - Array of {date, consumed, burned} objects
 * - Values represent daily totals for calories consumed and burned
 */
exports.getCalorieTrend = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    console.log('getCalorieTrend - Received request:', { userId, startDate, endDate });

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Provide both startDate and endDate (YYYY-MM-DD).' });
    }

    // Generate all dates in the range (inclusive)
    const allDates = getDatesInRange(startDate, endDate);
    console.log('getCalorieTrend - Generated dates:', allDates);

    try {
        // Use DATE(m.meal_datetime) to match MySQL server's local time zone (IDT)
        const mealItemsQuery = `
            SELECT DATE(m.meal_datetime) as date, mp.product_id, mp.product_amount, mp.recipe_id, mp.servings_consumed, p.calories AS p_cal
            FROM meal m
            JOIN MealProduct mp ON m.id = mp.meal_id
            LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL
            WHERE m.user_id = ?
            AND DATE(m.meal_datetime) BETWEEN ? AND ?
            ORDER BY date ASC;
        `;
        const mealItems = await queryAsync(mealItemsQuery, [userId, startDate, endDate]);
        // Debug: log all meal items fetched from the database for the range
        console.log('[DEBUG] mealItems for range:', mealItems);

        // Fetch all activity data for the range, grouped by date
        const activityQuery = `
            SELECT DATE(activity_date) as date, SUM(calories_burned) as total_burned
            FROM PhysicalActivity
            WHERE user_id = ?
            AND DATE(activity_date) BETWEEN ? AND ?
            GROUP BY DATE(activity_date);
        `;
        const activityRows = await queryAsync(activityQuery, [userId, startDate, endDate]);

        // Group meal items by date using the raw string from MySQL to avoid timezone issues
        const mealMap = new Map();
        for (const item of mealItems) {
            const date = typeof item.date === 'string'
                ? item.date.slice(0, 10)
                : item.date.toISOString().slice(0, 10);
            if (!mealMap.has(date)) mealMap.set(date, []);
            mealMap.get(date).push(item);
        }

        // Map activity burned calories by date
        const activityMap = new Map();
        for (const row of activityRows) {
            const date = row.date.toISOString ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10);
            activityMap.set(date, Math.round(row.total_burned || 0));
        }

        // Collect all unique recipe IDs for the range
        const allRecipeIds = Array.from(mealMap.values()).flat().filter(i => i.recipe_id).map(i => i.recipe_id);
        const uniqueRecipeIds = [...new Set(allRecipeIds)];
        let recipesFullDetails = {};
        if (uniqueRecipeIds.length > 0) {
            try {
                recipesFullDetails = await new Promise((resolve, reject) => {
                    getRecipeDetailsWithNutrition(uniqueRecipeIds, (err, details) => {
                        if (err) return reject(err);
                        resolve(details || {});
                    });
                });
            } catch (err) {
                console.error('getCalorieTrend - Error fetching recipe details:', err);
            }
        }

        // Build daily results for each date in the range
        const dailyDataResults = allDates.map(date => {
            const items = mealMap.get(date) || [];
            let consumedKcal = 0;
            for (const item of items) {
                if (item.product_id && item.p_cal !== null) {
                    consumedKcal += (parseFloat(item.product_amount || 0) / 100.0) * parseFloat(item.p_cal);
                } else if (item.recipe_id && recipesFullDetails[item.recipe_id]) {
                    const recipeData = recipesFullDetails[item.recipe_id];
                    if (recipeData.total_servings > 0) {
                        const servingsRatio = (parseFloat(item.servings_consumed) || 0) / recipeData.total_servings;
                        consumedKcal += (recipeData.total_recipe_kcal || 0) * servingsRatio;
                    }
                }
            }
            return {
                date,
                consumed: Math.round(consumedKcal),
                burned: activityMap.get(date) || 0
            };
        });

        // Debug: log all expected dates in the range
        console.log('[getCalorieTrend] allDates:', allDates);
        // Debug: log which dates have meal items
        console.log('[getCalorieTrend] mealMap keys:', Array.from(mealMap.keys()));
        // Debug: log which dates have activity entries
        console.log('[getCalorieTrend] activityMap keys:', Array.from(activityMap.keys()));
        // Debug: log the final daily data results
        console.log('[getCalorieTrend] dailyDataResults:', dailyDataResults);

        res.json(dailyDataResults);
    } catch (error) {
        console.error("getCalorieTrend - Error:", error);
        res.status(500).json({ 
            error: "Failed to retrieve calorie trend data.", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Retrieves a summary of nutrition and activity data for a specified period
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing period summary data
 * 
 * Response includes:
 * - Period information (start date, end date, number of days)
 * - Average daily macronutrients and calories
 * - Total consumption and burn statistics
 * - Activity and food logging frequency
 */
exports.getPeriodSummary = async (req, res) => {
    const userId = req.user.id;
    let { startDate, endDate, period } = req.query;

    // Validate and process date range
    if (period) {
        const range = getDateRangeForPeriod(period.toLowerCase());
        if (!range) return res.status(400).json({ error: "Invalid period. Use 'week' or 'month'." });
        startDate = range.startDate;
        endDate = range.endDate;
    } else if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ error: "Provide a valid 'period' (week/month) or 'startDate' & 'endDate' (YYYY-MM-DD)." });
    }

    const datesInRange = getDatesInRange(startDate, endDate);
    if (datesInRange.length === 0) {
        return res.status(400).json({ error: 'Date range is invalid.' });
    }

    // Initialize summary variables
    let totalConsumedKcal = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;
    let totalBurnedExerciseKcal = 0;
    let daysWithFoodLog = 0;
    let daysWithActivityLog = 0;

    try {
        // Process each day in the range
        for (const date of datesInRange) {
            // Fetch meal items for the day, including the entire day
            const mealItemsQuery = `
                SELECT mp.product_id, mp.product_amount, mp.recipe_id, mp.servings_consumed, 
                       p.calories AS p_cal, p.protein AS p_pro, p.fat AS p_fat, p.carbs AS p_carb 
                FROM meal m 
                JOIN MealProduct mp ON m.id = mp.meal_id 
                LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL 
                WHERE m.user_id = ? 
                AND DATE(m.meal_datetime) = ?;
            `;
            const mealItems = await queryAsync(mealItemsQuery, [userId, date]);
            let dailyConsumedKcal = 0, dailyProtein = 0, dailyFat = 0, dailyCarbs = 0;

            if (mealItems.length > 0) daysWithFoodLog++;

            // Process recipes if present
            const recipeIds = [...new Set(mealItems.filter(item => item.recipe_id).map(item => item.recipe_id))];
            const recipesFullDetails = await new Promise((resolve, reject) => {
                if (recipeIds.length > 0) getRecipeDetailsWithNutrition(recipeIds, (err, d) => err ? reject(err) : resolve(d));
                else resolve({});
            });

            // Calculate daily totals
            (mealItems || []).forEach(item => {
                let itemKcal = 0, itemProtein = 0, itemFat = 0, itemCarbs = 0;
                if (item.product_id && item.p_cal !== null) {
                    const factor = (parseFloat(item.product_amount || 0) / 100.0);
                    itemKcal = (parseFloat(item.p_cal || 0) * factor);
                    itemProtein = (parseFloat(item.p_pro || 0) * factor);
                    itemFat = (parseFloat(item.p_fat || 0) * factor);
                    itemCarbs = (parseFloat(item.p_carb || 0) * factor);
                } else if (item.recipe_id && recipesFullDetails[item.recipe_id]) {
                    const recipeData = recipesFullDetails[item.recipe_id];
                    if (recipeData.total_servings > 0) {
                        const servingsRatio = (parseFloat(item.servings_consumed) || 0) / recipeData.total_servings;
                        itemKcal = (recipeData.total_recipe_kcal || 0) * servingsRatio;
                        itemProtein = (recipeData.total_recipe_protein || 0) * servingsRatio;
                        itemFat = (recipeData.total_recipe_fat || 0) * servingsRatio;
                        itemCarbs = (recipeData.total_recipe_carbs || 0) * servingsRatio;
                    }
                }
                dailyConsumedKcal += itemKcal; dailyProtein += itemProtein; dailyFat += itemFat; dailyCarbs += itemCarbs;
            });

            // Update total nutrition values
            totalConsumedKcal += dailyConsumedKcal; totalProtein += dailyProtein; totalFat += dailyFat; totalCarbs += dailyCarbs;

            // Fetch and process activity data
            const activityQuery = `SELECT SUM(calories_burned) as total_burned FROM PhysicalActivity WHERE user_id = ? AND DATE(activity_date) = ?;`;
            const activitySummaryRows = await queryAsync(activityQuery, [userId, date]);
            const dailyBurned = parseFloat(activitySummaryRows[0]?.total_burned || 0);

            if (dailyBurned > 0) daysWithActivityLog++;
            totalBurnedExerciseKcal += dailyBurned;
        }

        // Calculate averages and prepare response
        const numDays = datesInRange.length;
        res.json({
            period: { startDate, endDate, days: numDays },
            avg_daily_kcal_consumed: numDays > 0 ? Math.round(totalConsumedKcal / numDays) : 0,
            avg_daily_protein: numDays > 0 ? parseFloat((totalProtein / numDays).toFixed(1)) : 0,
            avg_daily_fat: numDays > 0 ? parseFloat((totalFat / numDays).toFixed(1)) : 0,
            avg_daily_carbs: numDays > 0 ? parseFloat((totalCarbs / numDays).toFixed(1)) : 0,
            total_kcal_consumed: Math.round(totalConsumedKcal),
            total_protein: parseFloat(totalProtein.toFixed(1)),
            total_fat: parseFloat(totalFat.toFixed(1)),
            total_carbs: parseFloat(totalCarbs.toFixed(1)),
            total_kcal_burned_exercise: Math.round(totalBurnedExerciseKcal),
            avg_daily_kcal_burned_exercise: numDays > 0 ? Math.round(totalBurnedExerciseKcal / numDays) : 0,
            days_with_food_log: daysWithFoodLog,
            days_with_activity_log: daysWithActivityLog
        });

    } catch (error) {
        console.error("getPeriodSummary - Error:", error);
        res.status(500).json({ error: "Failed to retrieve period summary data.", details: error.message });
    }
};

// --- GET /api/statistics/macronutrient-distribution ---
exports.getMacronutrientDistribution = async (req, res) => {
    const userId = req.user.id;
    let { startDate, endDate, period } = req.query;
    if (period) {
        const range = getDateRangeForPeriod(period.toLowerCase());
        if (!range) return res.status(400).json({ error: "Invalid period. Use 'week' or 'month'." });
        startDate = range.startDate;
        endDate = range.endDate;
    } else if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ error: "Provide a valid 'period' (week/month) or 'startDate' & 'endDate' (YYYY-MM-DD)." });
    }
    const datesInRange = getDatesInRange(startDate, endDate);
    if (datesInRange.length === 0) {
        return res.status(400).json({ error: 'Date range is invalid.' });
    }
    let totalProteinGrams = 0, totalFatGrams = 0, totalCarbsGrams = 0;
    try {
        for (const date of datesInRange) {
            const mealItemsQuery = `
                SELECT mp.product_id, mp.product_amount, mp.recipe_id, mp.servings_consumed, p.protein AS p_pro, p.fat AS p_fat, p.carbs AS p_carb 
                FROM meal m 
                JOIN MealProduct mp ON m.id = mp.meal_id 
                LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL 
                WHERE m.user_id = ? 
                AND DATE(m.meal_datetime) BETWEEN ? AND ?;
            `;
            const activityQuery = `
                SELECT SUM(calories_burned) as total_burned 
                FROM PhysicalActivity 
                WHERE user_id = ? 
                AND DATE(activity_date) BETWEEN ? AND ?;
            `;
            const mealItems = await queryAsync(mealItemsQuery, [userId, date, date]);
            const recipeIds = [...new Set(mealItems.filter(item => item.recipe_id).map(item => item.recipe_id))];
            const recipesFullDetails = await new Promise((resolve, reject) => {
                if (recipeIds.length > 0) getRecipeDetailsWithNutrition(recipeIds, (err, d) => err ? reject(err) : resolve(d));
                else resolve({});
            });
            (mealItems || []).forEach(item => {
                let itemProtein = 0, itemFat = 0, itemCarbs = 0;
                if (item.product_id && item.p_pro !== null) {
                    const factor = (parseFloat(item.product_amount || 0) / 100.0);
                    itemProtein = (parseFloat(item.p_pro || 0) * factor);
                    itemFat = (parseFloat(item.p_fat || 0) * factor);
                    itemCarbs = (parseFloat(item.p_carb || 0) * factor);
                } else if (item.recipe_id && recipesFullDetails[item.recipe_id]) {
                    const recipeData = recipesFullDetails[item.recipe_id];
                    if (recipeData.total_servings > 0) {
                        const servingsRatio = (parseFloat(item.servings_consumed) || 0) / recipeData.total_servings;
                        itemProtein = (recipeData.total_recipe_protein || 0) * servingsRatio;
                        itemFat = (recipeData.total_recipe_fat || 0) * servingsRatio;
                        itemCarbs = (recipeData.total_recipe_carbs || 0) * servingsRatio;
                    }
                }
                totalProteinGrams += itemProtein; totalFatGrams += itemFat; totalCarbsGrams += itemCarbs;
            });
        }
        const totalMacroGrams = totalProteinGrams + totalFatGrams + totalCarbsGrams;
        if (totalMacroGrams === 0) {
            return res.json({ protein_g: 0, fat_g: 0, carbs_g: 0, protein_pct: 0, fat_pct: 0, carbs_pct: 0 });
        }
        const proteinKcal = totalProteinGrams * 4;
        const fatKcal = totalFatGrams * 9;
        const carbsKcal = totalCarbsGrams * 4;
        const totalKcalFromMacros = proteinKcal + fatKcal + carbsKcal;
        if (totalKcalFromMacros === 0) {
            return res.json({ protein_g: parseFloat(totalProteinGrams.toFixed(1)), fat_g: parseFloat(totalFatGrams.toFixed(1)), carbs_g: parseFloat(totalCarbsGrams.toFixed(1)), protein_pct: 0, fat_pct: 0, carbs_pct: 0 });
        }
        res.json({
            protein_g: parseFloat(totalProteinGrams.toFixed(1)),
            fat_g: parseFloat(totalFatGrams.toFixed(1)),
            carbs_g: parseFloat(totalCarbsGrams.toFixed(1)),
            protein_pct: parseFloat(((proteinKcal / totalKcalFromMacros) * 100).toFixed(1)),
            fat_pct: parseFloat(((fatKcal / totalKcalFromMacros) * 100).toFixed(1)),
            carbs_pct: parseFloat(((carbsKcal / totalKcalFromMacros) * 100).toFixed(1)),
        });
    } catch (error) {
        console.error("getMacronutrientDistribution - Error:", error);
        res.status(500).json({ error: "Failed to retrieve macronutrient distribution.", details: error.message });
    }
};