// server/controllers/profile.js
const dbSingleton = require('../config/dbSingleton'); // Adjust path to your dbSingleton
const conn = dbSingleton.getConnection();
// Ensure calorieCalculator.js uses module.exports and is in the correct path
const { getCalculatedCalorieDetails } = require('../utils/calorieCalculator');

// --- GET /api/profile ---
// Fetches the complete profile data for the currently authenticated user.
exports.getProfile = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            id, name, email, weight, height, age, goal, gender, 
            activity_level, bmr_formula, body_fat_percentage, 
            target_calories_override, 
            bmr, calculated_tdee, calculated_target_calories, -- Added bmr
            role, created_at 
        FROM User 
        WHERE id = ?;
    `;

    conn.query(query, [userId], (err, results) => {
        if (err) {
            console.error("getProfile - SQL Error:", err.code, err.sqlMessage, err);
            return res.status(500).json({ error: 'Failed to retrieve user profile.', details: err.code });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.json(results[0]);
    });
};

// --- PUT /api/profile ---
// Updates the profile data for the currently authenticated user.
// It also recalculates and stores BMR, TDEE, and target calories.
exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const {
        name, email, weight, height, age, goal, gender, activity_level,
        bmr_formula, body_fat_percentage, target_calories_override
    } = req.body;

    // --- Input Validation ---
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
    }
    if (email !== undefined && (typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email.trim()))) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (weight !== undefined && weight !== null && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)) {
        return res.status(400).json({ error: 'Weight must be a positive number or null.' });
    }
    if (height !== undefined && height !== null && (isNaN(parseFloat(height)) || parseFloat(height) <= 0)) {
        return res.status(400).json({ error: 'Height must be a positive number or null.' });
    }
    if (age !== undefined && age !== null && (isNaN(parseInt(age)) || parseInt(age) <= 0 || parseInt(age) > 120)) {
        return res.status(400).json({ error: 'Age must be a realistic positive integer or null.' });
    }
    const validGoals = ['lose', 'gain', 'maintain'];
    if (goal !== undefined && !validGoals.includes(goal)) {
        return res.status(400).json({ error: `Goal must be one of: ${validGoals.join(', ')}.` });
    }
    const validGenders = ['male', 'female', 'other', null];
    if (gender !== undefined && !validGenders.includes(gender)) {
        return res.status(400).json({ error: `Gender must be one of: male, female, other, or null.` });
    }
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active', null];
    if (activity_level !== undefined && !validActivityLevels.includes(activity_level)) {
        return res.status(400).json({ error: `Activity level must be one of: ${validActivityLevels.slice(0,-1).join(', ')}, or null.` });
    }
    const validFormulas = ['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle', null];
    if (bmr_formula !== undefined && !validFormulas.includes(bmr_formula)) {
        return res.status(400).json({ error: 'Invalid BMR formula selected.' });
    }
    if (body_fat_percentage !== undefined && body_fat_percentage !== null && (isNaN(parseFloat(body_fat_percentage)) || parseFloat(body_fat_percentage) < 0 || parseFloat(body_fat_percentage) >= 100)) {
        return res.status(400).json({ error: 'Body fat percentage must be a number between 0 and 99.9, or null.' });
    }
    if (target_calories_override !== undefined && target_calories_override !== null && (isNaN(parseInt(target_calories_override)) || parseInt(target_calories_override) < 0)) {
        return res.status(400).json({ error: 'Manual target calories must be a non-negative integer, or null.' });
    }

    conn.query('SELECT * FROM User WHERE id = ?', [userId], (fetchErr, currentUsers) => {
        if (fetchErr) {
            console.error("updateProfile - SQL Error (fetch current user):", fetchErr.code, fetchErr.sqlMessage);
            return res.status(500).json({ error: 'Could not retrieve current user data for update.', details: fetchErr.code });
        }
        if (currentUsers.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentUserData = currentUsers[0];

        const fieldsToUpdate = {};
        // Populate fieldsToUpdate only with properties present in req.body
        if (req.body.hasOwnProperty('name')) fieldsToUpdate.name = name.trim();
        if (req.body.hasOwnProperty('email')) fieldsToUpdate.email = email.trim(); // Email change conflict checked later
        if (req.body.hasOwnProperty('weight')) fieldsToUpdate.weight = (weight === '' || weight === null) ? null : parseFloat(weight);
        if (req.body.hasOwnProperty('height')) fieldsToUpdate.height = (height === '' || height === null) ? null : parseFloat(height);
        if (req.body.hasOwnProperty('age')) fieldsToUpdate.age = (age === '' || age === null) ? null : parseInt(age);
        if (req.body.hasOwnProperty('goal')) fieldsToUpdate.goal = goal;
        if (req.body.hasOwnProperty('gender')) fieldsToUpdate.gender = (gender === '') ? null : gender;
        if (req.body.hasOwnProperty('activity_level')) fieldsToUpdate.activity_level = activity_level;
        if (req.body.hasOwnProperty('bmr_formula')) fieldsToUpdate.bmr_formula = bmr_formula;
        if (req.body.hasOwnProperty('body_fat_percentage')) fieldsToUpdate.body_fat_percentage = (body_fat_percentage === '' || body_fat_percentage === null || isNaN(parseFloat(body_fat_percentage))) ? null : parseFloat(body_fat_percentage);
        if (req.body.hasOwnProperty('target_calories_override')) fieldsToUpdate.target_calories_override = (target_calories_override === '' || target_calories_override === null || isNaN(parseInt(target_calories_override))) ? null : parseInt(target_calories_override);

        // Construct profile data for calculation, merging incoming changes with existing data
        const profileForCalc = {
            weight: fieldsToUpdate.hasOwnProperty('weight') ? fieldsToUpdate.weight : currentUserData.weight,
            height: fieldsToUpdate.hasOwnProperty('height') ? fieldsToUpdate.height : currentUserData.height,
            age: fieldsToUpdate.hasOwnProperty('age') ? fieldsToUpdate.age : currentUserData.age,
            gender: fieldsToUpdate.hasOwnProperty('gender') ? fieldsToUpdate.gender : currentUserData.gender,
            activity_level: fieldsToUpdate.hasOwnProperty('activity_level') ? fieldsToUpdate.activity_level : currentUserData.activity_level,
            bmr_formula: fieldsToUpdate.hasOwnProperty('bmr_formula') ? fieldsToUpdate.bmr_formula : currentUserData.bmr_formula,
            body_fat_percentage: fieldsToUpdate.hasOwnProperty('body_fat_percentage') ? fieldsToUpdate.body_fat_percentage : currentUserData.body_fat_percentage,
            goal: fieldsToUpdate.hasOwnProperty('goal') ? fieldsToUpdate.goal : currentUserData.goal,
        };

        if (typeof getCalculatedCalorieDetails !== 'function') {
            console.error("updateProfile: CRITICAL - getCalculatedCalorieDetails is not a function.");
            return res.status(500).json({ error: "Internal server error: Calorie calculation service unavailable." });
        }

        const calculatedValues = getCalculatedCalorieDetails(profileForCalc);
        // Always update calculated fields based on the (potentially updated) profile data
        fieldsToUpdate.bmr = calculatedValues.bmr;                         // <-- Store calculated BMR
        fieldsToUpdate.calculated_tdee = calculatedValues.tdee;
        fieldsToUpdate.calculated_target_calories = calculatedValues.targetCalories;

        // Check if there are any actual fields to update beyond just the calculated ones if no user input was provided
        // This is to avoid an unnecessary DB write if only `req.body` was empty and calculated values matched existing ones.
        let hasUserProvidedChanges = false;
        for (const key in req.body) {
            if (req.body.hasOwnProperty(key) && !['bmr', 'calculated_tdee', 'calculated_target_calories'].includes(key)) {
                if (fieldsToUpdate[key] !== currentUserData[key]) { // Compare with current DB value
                    hasUserProvidedChanges = true;
                    break;
                }
            }
        }
        // Check if calculated values changed
        const calculatedValuesChanged = fieldsToUpdate.bmr !== currentUserData.bmr ||
            fieldsToUpdate.calculated_tdee !== currentUserData.calculated_tdee ||
            fieldsToUpdate.calculated_target_calories !== currentUserData.calculated_target_calories;

        if (!hasUserProvidedChanges && !calculatedValuesChanged && !(fieldsToUpdate.email && fieldsToUpdate.email !== currentUserData.email)) {
            // console.log("updateProfile: No actual changes to save.");
            return res.json(currentUserData); // Return current data as nothing effectively changed
        }

        const performActualUpdate = (isEmailConflict) => {
            if (isEmailConflict) {
                return res.status(409).json({ error: 'Email already in use by another account.' });
            }

            const updateQuery = 'UPDATE User SET ? WHERE id = ?;';
            conn.query(updateQuery, [fieldsToUpdate, userId], (err, result) => {
                if (err) {
                    console.error("updateProfile - SQL Error (update user):", err.code, err.sqlMessage, err);
                    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.toLowerCase().includes('email')) {
                        return res.status(409).json({ error: 'Email already exists.' });
                    }
                    return res.status(500).json({ error: 'Failed to update user profile.', details: err.code });
                }
                if (result.affectedRows === 0) {
                    // This might happen if ID doesn't exist, though auth should prevent it.
                    return res.status(404).json({ error: 'User profile not found for update.' });
                }

                // Fetch and return the fully updated profile
                const selectQuery = `
                    SELECT id, name, email, weight, height, age, goal, gender, activity_level, 
                           bmr_formula, body_fat_percentage, target_calories_override,
                           bmr, calculated_tdee, calculated_target_calories, 
                           role, created_at 
                    FROM User WHERE id = ?;
                `; // Ensure bmr is selected here too
                conn.query(selectQuery, [userId], (selectErr, updatedUserRows) => {
                    if (selectErr || updatedUserRows.length === 0) {
                        console.error("updateProfile - SQL Error (fetch updated profile):", selectErr);
                        return res.status(500).json({ error: "Profile updated, but failed to retrieve current data."});
                    }
                    res.json(updatedUserRows[0]);
                });
            });
        };

        // Check for email conflict only if email is part of the update AND it's different from current
        if (fieldsToUpdate.hasOwnProperty('email') && fieldsToUpdate.email !== currentUserData.email) {
            const checkEmailQuery = 'SELECT id FROM User WHERE email = ? AND id != ?;';
            conn.query(checkEmailQuery, [fieldsToUpdate.email, userId], (emailErr, emailResults) => {
                if (emailErr) {
                    console.error("updateProfile - SQL Error (check email):", emailErr.code, emailErr.sqlMessage);
                    return res.status(500).json({ error: 'Error checking email availability.', details: emailErr.code });
                }
                performActualUpdate(emailResults.length > 0);
            });
        } else {
            // If email was in fieldsToUpdate but same as current, remove it so it's not part of SET clause
            if (fieldsToUpdate.hasOwnProperty('email') && fieldsToUpdate.email === currentUserData.email) {
                delete fieldsToUpdate.email;
            }
            // If fieldsToUpdate is now empty (e.g. only email was provided and it was same)
            // or only contains calculated fields that haven't actually changed from what's in DB
            if (Object.keys(fieldsToUpdate).length === 0 ||
                (Object.keys(fieldsToUpdate).length === 3 &&
                    fieldsToUpdate.hasOwnProperty('bmr') && fieldsToUpdate.bmr === currentUserData.bmr &&
                    fieldsToUpdate.hasOwnProperty('calculated_tdee') && fieldsToUpdate.calculated_tdee === currentUserData.calculated_tdee &&
                    fieldsToUpdate.hasOwnProperty('calculated_target_calories') && fieldsToUpdate.calculated_target_calories === currentUserData.calculated_target_calories
                )
            ) {
                // console.log("updateProfile: No actual data changes to save to DB after checks.");
                exports.getProfile(req, res); // Re-fetch to send the latest consistent data
                return;
            }
            performActualUpdate(false);
        }
    });
};