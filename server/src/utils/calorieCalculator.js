// server/utils/calorieCalculator.js

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor formula.
 * @param {number} weightKg - Weight in kilograms.
 * @param {number} heightCm - Height in centimeters.
 * @param {number} ageYears - Age in years.
 * @param {'male'|'female'|'other'|null|undefined} gender - User's gender.
 * @returns {number|null} BMR in kcal/day or null if essential params are invalid or missing.
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
 * Calculates Basal Metabolic Rate (BMR) using Harris-Benedict (revised) formula.
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} ageYears
 * @param {'male'|'female'|'other'|null|undefined} gender
 * @returns {number|null} BMR in kcal/day or null if essential params are invalid or missing.
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
 * Calculates Basal Metabolic Rate (BMR) using Katch-McArdle formula.
 * Requires Lean Body Mass (LBM). bodyFatPercentage is 0-100.
 * @param {number} weightKg
 * @param {number|null|undefined} bodyFatPercentage - Body fat percentage (e.g., 15 for 15%).
 * @returns {number|null} BMR in kcal/day or null if params are invalid or missing.
 */
function calculateKatchMcArdleBMR(weightKg, bodyFatPercentage) {
    const w = parseFloat(weightKg);
    const bfp = parseFloat(bodyFatPercentage);

    if (isNaN(w) || w <= 0 || bodyFatPercentage === null || bodyFatPercentage === undefined || isNaN(bfp) || bfp <= 0 || bfp >= 100) { // bfp must be > 0
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

const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param {number} bmr - Basal Metabolic Rate.
 * @param {'sedentary'|'light'|'moderate'|'active'|'very_active'|null|undefined} activityLevel
 * @returns {number|null} TDEE in kcal/day or null if BMR is invalid.
 */
function calculateTDEE(bmr, activityLevel) {
    if (bmr === null || bmr <= 0) return null;
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.light;
    return bmr * multiplier;
}

/**
 * Calculates target daily calories based on TDEE and goal, ensuring it doesn't drop below BMR for weight loss.
 * @param {number} tdee - Total Daily Energy Expenditure.
 * @param {number} bmr - Basal Metabolic Rate.
 * @param {'lose'|'gain'|'maintain'|null|undefined} goal
 * @param {number} [adjustmentLose=500] - Calories to subtract for weight loss.
 * @param {number} [adjustmentGain=300] - Calories to add for weight gain.
 * @param {number} [minSafeCalories=1200] - Absolute minimum safe calorie intake for most adults.
 * @returns {number|null} Target calories or null if TDEE/BMR is invalid.
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
 * Orchestrator function to get all calculated calorie details (BMR, TDEE, Target Calories).
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

    // Ensure essential data for BMR calculation is present and valid
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
        // console.warn("getCalculatedCalorieDetails: Essential data (weight, height, age) missing or invalid for BMR calculation.");
        return { bmr: null, tdee: null, targetCalories: null };
    }

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