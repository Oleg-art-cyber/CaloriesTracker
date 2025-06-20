// server/utils/calorieCalculator.js

/**
 * Calorie Calculator Utility
 * Provides functions for calculating various metabolic and nutritional metrics
 * Includes multiple BMR formulas and TDEE calculations
 */

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor formula
 * Most accurate for general population, recommended by the Academy of Nutrition and Dietetics
 * 
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @param {number} ageYears - Age in years
 * @param {'male'|'female'|'other'|null|undefined} gender - User's gender
 * @returns {number|null} BMR in kcal/day or null if essential params are invalid
 */
function calculateMifflinStJeorBMR(weightKg, heightCm, ageYears, gender) {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const a = parseInt(ageYears);

    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
        // console.warn("Mifflin: Invalid or missing weight, height, or age for BMR calculation.");
        return null;
    }

    if (gender === 'male') {
        return (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else if (gender === 'female') {
        return (10 * w) + (6.25 * h) - (5 * a) - 161;
    } else {
        // console.warn("Mifflin: Gender not 'male' or 'female', using an average adjustment for BMR.");
        return (10 * w) + (6.25 * h) - (5 * a) - 78;
    }
}

/**
 * Calculates Basal Metabolic Rate (BMR) using Harris-Benedict (revised) formula
 * Older formula, still widely used but less accurate than Mifflin-St Jeor
 * 
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @param {number} ageYears - Age in years
 * @param {'male'|'female'|'other'|null|undefined} gender - User's gender
 * @returns {number|null} BMR in kcal/day or null if essential params are invalid
 */
function calculateHarrisBenedictBMR(weightKg, heightCm, ageYears, gender) {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const a = parseInt(ageYears);

    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
        // console.warn("Harris-Benedict: Invalid or missing weight, height, or age for BMR calculation.");
        return null;
    }

    if (gender === 'male') {
        return (13.397 * w) + (4.799 * h) - (5.677 * a) + 88.362;
    } else if (gender === 'female') {
        return (9.247 * w) + (3.098 * h) - (4.330 * a) + 447.593;
    } else {
        // console.warn("Harris-Benedict: Gender not 'male' or 'female', using an average for BMR.");
        const maleBMR = (13.397 * w) + (4.799 * h) - (5.677 * a) + 88.362;
        const femaleBMR = (9.247 * w) + (3.098 * h) - (4.330 * a) + 447.593;
        return (maleBMR + femaleBMR) / 2;
    }
}

/**
 * Calculates Basal Metabolic Rate (BMR) using Katch-McArdle formula
 * Most accurate when body fat percentage is known
 * Requires Lean Body Mass calculation
 * 
 * @param {number} weightKg - Weight in kilograms
 * @param {number|null|undefined} bodyFatPercentage - Body fat percentage (0-100)
 * @returns {number|null} BMR in kcal/day or null if params are invalid
 */
function calculateKatchMcArdleBMR(weightKg, bodyFatPercentage) {
    const w = parseFloat(weightKg);
    const bfp = parseFloat(bodyFatPercentage);

    if (isNaN(w) || w <= 0 || bodyFatPercentage === null || bodyFatPercentage === undefined || isNaN(bfp) || bfp <= 0 || bfp >= 100) {
        // console.warn("Katch-McArdle: Invalid or missing weight or body fat percentage for BMR calculation.");
        return null;
    }

    const leanBodyMass = w * (1 - (bfp / 100));
    if (leanBodyMass <= 0) {
        // console.warn("Katch-McArdle: Calculated Lean Body Mass is not positive.");
        return null;
    }
    return 370 + (21.6 * leanBodyMass);
}

/**
 * Activity level multipliers for TDEE calculation
 * Based on standard activity level classifications
 */
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9     // Very hard exercise & physical job or training twice per day
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE)
 * Multiplies BMR by activity level multiplier
 * 
 * @param {number} bmr - Basal Metabolic Rate
 * @param {'sedentary'|'light'|'moderate'|'active'|'very_active'|null|undefined} activityLevel
 * @returns {number|null} TDEE in kcal/day or null if BMR is invalid
 */
function calculateTDEE(bmr, activityLevel) {
    if (bmr === null || bmr <= 0) return null;
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.light;
    return bmr * multiplier;
}

/**
 * Calculates target daily calories based on TDEE and goal
 * Ensures safe minimum calorie intake
 * 
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {number} bmr - Basal Metabolic Rate
 * @param {'lose'|'gain'|'maintain'|null|undefined} goal
 * @param {number} [adjustmentLose=500] - Calories to subtract for weight loss
 * @param {number} [adjustmentGain=300] - Calories to add for weight gain
 * @param {number} [minSafeCalories=1200] - Absolute minimum safe calorie intake
 * @returns {number|null} Target calories or null if TDEE/BMR is invalid
 */
function calculateTargetCaloriesFromTDEE(tdee, bmr, goal, adjustmentLose = 500, adjustmentGain = 300, minSafeCalories = 1200) {
    if (tdee === null || tdee <= 0 || bmr === null || bmr <= 0) {
        // console.warn("calculateTargetCaloriesFromTDEE: Invalid TDEE or BMR provided.");
        return null;
    }

    let target = tdee;
    if (goal === 'lose') {
        target = tdee - adjustmentLose;
        // Ensure target for losing weight is not below BMR and also not below a general safe minimum.
        target = Math.max(target, bmr, minSafeCalories);
    } else if (goal === 'gain') {
        target = tdee + adjustmentGain;
    }
    // For 'maintain', target is already tdee.

    // Ensure target is at least the absolute minimum safe calories, regardless of goal (except if bmr itself is lower for 'lose')
    target = Math.max(target, minSafeCalories);

    return target;
}

/**
 * Main function to calculate all calorie-related metrics
 * Orchestrates the calculation process and handles fallbacks
 * 
 * @param {Object} profile - User profile containing physical and goal data
 * @returns {Object} Object containing calculated BMR, TDEE, and target calories
 * 
 * Profile object should include:
 * - weight: Weight in kg
 * - height: Height in cm
 * - age: Age in years
 * - gender: 'male', 'female', or 'other'
 * - activity_level: Activity level key
 * - bmr_formula: Preferred BMR formula
 * - body_fat_percentage: Body fat percentage (for Katch-McArdle)
 * - goal: Weight management goal
 */
function getCalculatedCalorieDetails(profile) {
    if (!profile) {
        return { bmr: null, tdee: null, targetCalories: null };
    }

    let bmr = null;
    const {
        weight, height, age, gender,
        activity_level, bmr_formula, body_fat_percentage, goal
    } = profile;

    // Validate essential data
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
        // console.warn("getCalculatedCalorieDetails: Essential data (weight, height, age) missing or invalid for BMR calculation.");
        return { bmr: null, tdee: null, targetCalories: null };
    }

    // Calculate BMR using selected formula with fallbacks
    if (bmr_formula === 'katch_mcardle') {
        const bfp = parseFloat(body_fat_percentage);
        // Katch-McArdle requires a valid, positive body_fat_percentage
        if (body_fat_percentage !== null && body_fat_percentage !== undefined && !isNaN(bfp) && bfp > 0 && bfp < 100) {
            bmr = calculateKatchMcArdleBMR(w, bfp);
        } else {
            // console.warn("getCalculatedCalorieDetails: Katch-McArdle selected but body_fat_percentage invalid or missing. Falling back to Mifflin-St Jeor.");
            bmr = calculateMifflinStJeorBMR(w, h, a, gender); // Fallback
        }
    } else if (bmr_formula === 'harris_benedict') {
        // Harris-Benedict requires gender
        if (gender && (gender === 'male' || gender === 'female')) {
            bmr = calculateHarrisBenedictBMR(w, h, a, gender);
        } else {
            // console.warn("getCalculatedCalorieDetails: Harris-Benedict selected but gender is missing or invalid. Falling back to Mifflin-St Jeor with 'other' gender adjustment.");
            bmr = calculateMifflinStJeorBMR(w, h, a, 'other'); // Fallback with average gender
        }
    } else { // Default to Mifflin-St Jeor
        bmr = calculateMifflinStJeorBMR(w, h, a, gender);
    }

    if (bmr === null || bmr <= 0) {
        // console.warn("getCalculatedCalorieDetails: BMR calculation resulted in null or non-positive value.");
        return { bmr: null, tdee: null, targetCalories: null };
    }

    // Calculate TDEE and target calories
    const tdee = calculateTDEE(bmr, activity_level);
    if (tdee === null || tdee <= 0) {
        // console.warn("getCalculatedCalorieDetails: TDEE calculation resulted in null or non-positive value.");
        return { bmr: Math.round(bmr), tdee: null, targetCalories: null };
    }

    const targetCalories = calculateTargetCaloriesFromTDEE(tdee, bmr, goal); // Pass BMR here

    return {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: targetCalories !== null ? Math.round(targetCalories) : null
    };
}

module.exports = {
    // Not exporting individual formula calculators unless needed elsewhere
    getCalculatedCalorieDetails
};