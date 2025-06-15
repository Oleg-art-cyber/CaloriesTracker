// server/controllers/statistics.js
const dbSingleton = require('../config/dbSingleton'); // Adjust path if necessary
const conn = dbSingleton.getConnection();
const { getRecipeDetailsWithNutrition } = require('./diary');

// Helper function to promisify conn.query
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

// Helper to get an array of date strings
function getDatesInRange(startDateStr, endDateStr) {
    const dates = [];
    let currentDate = new Date(startDateStr + "T00:00:00");
    const finalEndDate = new Date(endDateStr + "T00:00:00");
    if (isNaN(currentDate.getTime()) || isNaN(finalEndDate.getTime())) {
        console.error("getDatesInRange: Invalid date strings provided", { startDateStr, endDateStr });
        return [];
    }
    currentDate.setUTCHours(0, 0, 0, 0);
    finalEndDate.setUTCHours(0, 0, 0, 0);
    while (currentDate <= finalEndDate) {
        dates.push(currentDate.toISOString().slice(0, 10));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

// Helper to get start and end dates for predefined periods
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

// --- GET /api/statistics/weight-trend ---
exports.getWeightTrend = async (req, res) => {
    // This function is unchanged
    const userId = req.user.id;
    const periodDaysInput = req.query.period_days;
    let periodDays = parseInt(periodDaysInput, 10);
    if (isNaN(periodDays)) {
        if (['week', 'month'].includes(periodDaysInput?.toLowerCase())) {
            periodDays = periodDaysInput.toLowerCase() === 'week' ? 7 : 30;
        } else { periodDays = 7; }
    }
    if (periodDays <= 0 || periodDays > 365) return res.status(400).json({ error: 'Period must be between 1 and 365 days (or "week", "month").' });
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endDate = today.toISOString().slice(0, 10);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (periodDays - 1));
    const startDateStr = startDate.toISOString().slice(0, 10);
    try {
        const weightQuery = `SELECT log_date, weight FROM weight_log WHERE user_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date ASC;`;
        const weightLogs = await queryAsync(weightQuery, [userId, startDateStr, endDate]);
        const weightMap = new Map(weightLogs.map(log => [log.log_date.toISOString().slice(0, 10), log.weight]));
        const initialWeightQuery = `SELECT weight FROM weight_log WHERE user_id = ? AND log_date < ? ORDER BY log_date DESC LIMIT 1`;
        const initialWeightResult = await queryAsync(initialWeightQuery, [userId, startDateStr]);
        let lastKnownWeight = initialWeightResult[0]?.weight || null;
        const allDates = getDatesInRange(startDateStr, endDate);
        const trendData = allDates.map(dateStr => {
            if (weightMap.has(dateStr)) {
                lastKnownWeight = weightMap.get(dateStr);
            }
            return { date: dateStr, weight: lastKnownWeight, };
        });
        const finalTrendData = trendData.filter(d => d.weight !== null);
        res.json(finalTrendData);
    } catch (error) {
        console.error("getWeightTrend - Error:", error);
        res.status(500).json({ error: "Failed to retrieve weight trend data.", details: error.message });
    }
};

// --- GET /api/statistics/calories-trend ---
exports.getCalorieTrend = async (req, res) => {
    // This function is unchanged
    const userId = req.user.id;
    const periodDaysInput = req.query.period_days;
    let periodDays = parseInt(periodDaysInput, 10);
    if (isNaN(periodDays)) {
        if (['week', 'month'].includes(periodDaysInput?.toLowerCase())) {
            periodDays = periodDaysInput.toLowerCase() === 'week' ? 7 : 30;
        } else { periodDays = 7; }
    }
    if (periodDays <= 0 || periodDays > 90) return res.status(400).json({ error: 'Period must be between 1 and 90 days (or "week", "month").' });
    const dates = [];
    for (let i = 0; i < periodDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    dates.reverse();
    const dailyDataResults = [];
    try {
        for (const date of dates) {
            const mealItemsQuery = `SELECT mp.product_id, mp.product_amount, mp.recipe_id, mp.servings_consumed, p.calories AS p_cal, p.protein AS p_pro, p.fat AS p_fat, p.carbs AS p_carb FROM meal m JOIN MealProduct mp ON m.id = mp.meal_id LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?;`;
            const activityQuery = `SELECT SUM(calories_burned) as total_burned FROM PhysicalActivity WHERE user_id = ? AND activity_date = ?;`;
            const mealItems = await queryAsync(mealItemsQuery, [userId, date]);
            const activitySummaryRows = await queryAsync(activityQuery, [userId, date]);
            let consumedKcal = 0;
            const recipeIds = [...new Set((mealItems || []).filter(item => item.recipe_id).map(item => item.recipe_id))];
            const recipesFullDetails = await new Promise((resolve, reject) => {
                if (recipeIds.length > 0) {
                    getRecipeDetailsWithNutrition(recipeIds, (err, details) => { if (err) return reject(err); resolve(details); });
                } else { resolve({}); }
            });
            (mealItems || []).forEach(item => {
                if (item.product_id && item.p_cal !== null) {
                    consumedKcal += (parseFloat(item.product_amount || 0) / 100.0) * parseFloat(item.p_cal);
                } else if (item.recipe_id && recipesFullDetails[item.recipe_id]) {
                    const recipeData = recipesFullDetails[item.recipe_id];
                    if (recipeData.total_servings > 0) {
                        const servingsRatio = (parseFloat(item.servings_consumed) || 0) / recipeData.total_servings;
                        consumedKcal += (recipeData.total_recipe_kcal || 0) * servingsRatio;
                    }
                }
            });
            dailyDataResults.push({ date: date, consumed: Math.round(consumedKcal), burned: Math.round(activitySummaryRows[0]?.total_burned || 0) });
        }
        res.json(dailyDataResults);
    } catch (error) {
        console.error("getCalorieTrend - Error:", error);
        res.status(500).json({ error: "Failed to retrieve calorie trend data.", details: error.message });
    }
};

// --- GET /api/statistics/period-summary ---
exports.getPeriodSummary = async (req, res) => {
    // This function contains the single-line fix
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
    if (datesInRange.length === 0 || datesInRange.length > 90) {
        return res.status(400).json({ error: 'Date range is invalid or too large (max 90 days).' });
    }
    let totalConsumedKcal = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;
    let totalBurnedExerciseKcal = 0;
    let daysWithFoodLog = 0;
    let daysWithActivityLog = 0;
    try {
        for (const date of datesInRange) {
            const mealItemsQuery = `SELECT mp.product_id, mp.product_amount, mp.recipe_id, mp.servings_consumed, p.calories AS p_cal, p.protein AS p_pro, p.fat AS p_fat, p.carbs AS p_carb FROM meal m JOIN MealProduct mp ON m.id = mp.meal_id LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?;`;
            const mealItems = await queryAsync(mealItemsQuery, [userId, date]);
            let dailyConsumedKcal = 0, dailyProtein = 0, dailyFat = 0, dailyCarbs = 0;
            if (mealItems.length > 0) daysWithFoodLog++;
            const recipeIds = [...new Set(mealItems.filter(item => item.recipe_id).map(item => item.recipe_id))];
            const recipesFullDetails = await new Promise((resolve, reject) => {
                if (recipeIds.length > 0) getRecipeDetailsWithNutrition(recipeIds, (err, d) => err ? reject(err) : resolve(d));
                else resolve({});
            });
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
            totalConsumedKcal += dailyConsumedKcal; totalProtein += dailyProtein; totalFat += dailyFat; totalCarbs += dailyCarbs;

            const activityQuery = `SELECT SUM(calories_burned) as total_burned FROM PhysicalActivity WHERE user_id = ? AND activity_date = ?;`;
            const activitySummaryRows = await queryAsync(activityQuery, [userId, date]);

            // --- FIX IS HERE ---
            // Ensure the value is treated as a number before adding it to the total.
            const dailyBurned = parseFloat(activitySummaryRows[0]?.total_burned || 0);

            if (dailyBurned > 0) daysWithActivityLog++;
            totalBurnedExerciseKcal += dailyBurned; // This is now a numeric addition
        }

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
    // This function is unchanged
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
    if (datesInRange.length === 0 || datesInRange.length > 90) {
        return res.status(400).json({ error: 'Date range is invalid or too large (max 90 days).' });
    }
    let totalProteinGrams = 0, totalFatGrams = 0, totalCarbsGrams = 0;
    try {
        for (const date of datesInRange) {
            const mealItemsQuery = `SELECT mp.product_id, mp.product_amount, mp.recipe_id, mp.servings_consumed, p.protein AS p_pro, p.fat AS p_fat, p.carbs AS p_carb FROM meal m JOIN MealProduct mp ON m.id = mp.meal_id LEFT JOIN product p ON mp.product_id = p.id AND mp.recipe_id IS NULL WHERE m.user_id = ? AND DATE(m.meal_datetime) = ?;`;
            const mealItems = await queryAsync(mealItemsQuery, [userId, date]);
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