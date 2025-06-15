// server/controllers/profile.js
const dbSingleton = require('../config/dbSingleton'); // Adjust path to your dbSingleton
const conn = dbSingleton.getConnection();
const { getCalculatedCalorieDetails } = require('../utils/calorieCalculator');

/**
 * @route   GET /api/profile
 * @desc    Fetches the complete profile for the currently authenticated user.
 * @access  Private
 */
exports.getProfile = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            id, name, email, weight, height, age, goal, gender, 
            activity_level, bmr_formula, body_fat_percentage, 
            target_calories_override, 
            bmr, calculated_tdee, calculated_target_calories,
            role, created_at 
        FROM User 
        WHERE id = ?;
    `;

    conn.query(query, [userId], (err, results) => {
        if (err) {
            console.error("getProfile - SQL Error:", err);
            return res.status(500).json({ error: 'Failed to retrieve user profile.', details: err.code });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.json(results[0]);
    });
};

/**
 * @route   PUT /api/profile
 * @desc    Updates the profile data for the authenticated user.
 *          This includes recalculating BMR/TDEE and logging weight changes.
 * @access  Private
 */
exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const {
        name, email, weight, height, age, goal, gender, activity_level,
        bmr_formula, body_fat_percentage, target_calories_override
    } = req.body;

    // --- Input Validation (Existing logic preserved) ---
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
    // ... other validations from your original code ...

    // Fetch current user data to merge with updates
    conn.query('SELECT * FROM User WHERE id = ?', [userId], (fetchErr, currentUsers) => {
        if (fetchErr) {
            console.error("updateProfile - SQL Error (fetch current user):", fetchErr);
            return res.status(500).json({ error: 'Could not retrieve current user data for update.', details: fetchErr.code });
        }
        if (currentUsers.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentUserData = currentUsers[0];

        // Prepare fields to update, only including those present in the request body
        const fieldsToUpdate = {};
        if (req.body.hasOwnProperty('name')) fieldsToUpdate.name = name.trim();
        if (req.body.hasOwnProperty('email')) fieldsToUpdate.email = email.trim();
        if (req.body.hasOwnProperty('weight')) fieldsToUpdate.weight = (weight === '' || weight === null) ? null : parseFloat(weight);
        if (req.body.hasOwnProperty('height')) fieldsToUpdate.height = (height === '' || height === null) ? null : parseFloat(height);
        if (req.body.hasOwnProperty('age')) fieldsToUpdate.age = (age === '' || age === null) ? null : parseInt(age);
        if (req.body.hasOwnProperty('goal')) fieldsToUpdate.goal = goal;
        if (req.body.hasOwnProperty('gender')) fieldsToUpdate.gender = (gender === '') ? null : gender;
        if (req.body.hasOwnProperty('activity_level')) fieldsToUpdate.activity_level = activity_level;
        if (req.body.hasOwnProperty('bmr_formula')) fieldsToUpdate.bmr_formula = bmr_formula;
        if (req.body.hasOwnProperty('body_fat_percentage')) fieldsToUpdate.body_fat_percentage = (body_fat_percentage === '' || body_fat_percentage === null || isNaN(parseFloat(body_fat_percentage))) ? null : parseFloat(body_fat_percentage);
        if (req.body.hasOwnProperty('target_calories_override')) fieldsToUpdate.target_calories_override = (target_calories_override === '' || target_calories_override === null || isNaN(parseInt(target_calories_override))) ? null : parseInt(target_calories_override);

        // Recalculate BMR, TDEE, and target calories based on the merged data
        const profileForCalc = { ...currentUserData, ...fieldsToUpdate };
        const calculatedValues = getCalculatedCalorieDetails(profileForCalc);
        fieldsToUpdate.bmr = calculatedValues.bmr;
        fieldsToUpdate.calculated_tdee = calculatedValues.tdee;
        fieldsToUpdate.calculated_target_calories = calculatedValues.targetCalories;

        // ... (Your original logic for checking if there are actual changes) ...

        /**
         * Performs the database update within a transaction to ensure data integrity.
         * It updates the User table and logs the weight if it has changed.
         * @param {boolean} isEmailConflict - A flag indicating if an email conflict was found.
         */
        const performActualUpdate = (isEmailConflict) => {
            if (isEmailConflict) {
                return res.status(409).json({ error: 'Email already in use by another account.' });
            }

            // Start a database transaction to group multiple queries
            conn.beginTransaction(transactionErr => {
                if (transactionErr) {
                    console.error("updateProfile - Transaction Begin Error:", transactionErr);
                    return res.status(500).json({ error: 'Failed to start database transaction.' });
                }

                // Query 1: Update the User table
                const updateQuery = 'UPDATE User SET ? WHERE id = ?;';
                conn.query(updateQuery, [fieldsToUpdate, userId], (updateErr, result) => {
                    if (updateErr) {
                        return conn.rollback(() => {
                            console.error("updateProfile - SQL Error (update user):", updateErr);
                            if (updateErr.code === 'ER_DUP_ENTRY' && updateErr.sqlMessage.toLowerCase().includes('email')) {
                                return res.status(409).json({ error: 'Email already exists.' });
                            }
                            res.status(500).json({ error: 'Failed to update user profile.', details: updateErr.code });
                        });
                    }
                    if (result.affectedRows === 0) {
                        return conn.rollback(() => {
                            res.status(404).json({ error: 'User profile not found for update.' });
                        });
                    }

                    // Query 2 (Conditional): Log the new weight if it was provided
                    const newWeightProvided = req.body.hasOwnProperty('weight') && fieldsToUpdate.weight !== null;
                    if (newWeightProvided) {
                        const logDate = new Date().toISOString().slice(0, 10);
                        const weightLogQuery = `
                            INSERT INTO weight_log (user_id, log_date, weight)
                            VALUES (?, ?, ?)
                            ON DUPLICATE KEY UPDATE weight = VALUES(weight);
                        `;
                        conn.query(weightLogQuery, [userId, logDate, fieldsToUpdate.weight], (logErr) => {
                            if (logErr) {
                                return conn.rollback(() => {
                                    console.error("updateProfile - SQL Error (log weight):", logErr);
                                    res.status(500).json({ error: 'Failed to log weight history.' });
                                });
                            }
                            // If weight logging is successful, commit and send response
                            commitAndRespond();
                        });
                    } else {
                        // If no new weight was provided, just commit and send response
                        commitAndRespond();
                    }
                });

                /**
                 * Commits the transaction and sends the final updated profile to the client.
                 */
                function commitAndRespond() {
                    conn.commit(commitErr => {
                        if (commitErr) {
                            return conn.rollback(() => {
                                console.error("updateProfile - Transaction Commit Error:", commitErr);
                                res.status(500).json({ error: 'Failed to commit changes to database.' });
                            });
                        }

                        // Fetch the final, updated user profile to return
                        const selectQuery = `
                            SELECT id, name, email, weight, height, age, goal, gender, activity_level, 
                                   bmr_formula, body_fat_percentage, target_calories_override,
                                   bmr, calculated_tdee, calculated_target_calories, 
                                   role, created_at 
                            FROM User WHERE id = ?;
                        `;
                        conn.query(selectQuery, [userId], (selectErr, updatedUserRows) => {
                            if (selectErr || updatedUserRows.length === 0) {
                                console.error("updateProfile - SQL Error (fetch updated profile):", selectErr);
                                return res.status(500).json({ error: "Profile updated, but failed to retrieve current data."});
                            }
                            res.json(updatedUserRows[0]);
                        });
                    });
                }
            });
        };

        // Your original logic for checking email conflicts before performing the update
        if (fieldsToUpdate.hasOwnProperty('email') && fieldsToUpdate.email !== currentUserData.email) {
            const checkEmailQuery = 'SELECT id FROM User WHERE email = ? AND id != ?;';
            conn.query(checkEmailQuery, [fieldsToUpdate.email, userId], (emailErr, emailResults) => {
                if (emailErr) {
                    console.error("updateProfile - SQL Error (check email):", emailErr);
                    return res.status(500).json({ error: 'Error checking email availability.', details: emailErr.code });
                }
                performActualUpdate(emailResults.length > 0);
            });
        } else {
            performActualUpdate(false);
        }
    });
};