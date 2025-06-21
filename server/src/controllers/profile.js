// server/controllers/profile.js
const dbSingleton = require('../config/dbSingleton'); // Adjust path to your dbSingleton
const conn = dbSingleton.getConnection();
const { getCalculatedCalorieDetails } = require('../utils/calorieCalculator');
const { checkAndAwardAchievements } = require('./achievements'); // Import achievement checker

/**
 * Profile Controller
 * Handles user profile management including retrieval, updates, and weight tracking.
 * Manages user data such as personal information, physical attributes, and nutritional goals.
 */

/**
 * Retrieves the complete profile for the currently authenticated user
 * @param {Object} req - Express request object containing user ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing user profile data
 * 
 * Response includes:
 * - Personal information (name, email)
 * - Physical attributes (weight, height, age, gender)
 * - Fitness goals and activity level
 * - Calculated values (BMR, TDEE, target calories)
 * - Account information (role, creation date)
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
 * Updates the profile data for the authenticated user
 * Includes validation, recalculation of nutritional values, and weight history tracking
 * @param {Object} req - Express request object containing user ID and update data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing updated user profile
 * 
 * Request body may include:
 * - name: User's full name
 * - email: User's email address
 * - weight: Current weight in kg
 * - height: Height in cm
 * - age: Age in years
 * - goal: Fitness goal (e.g., 'lose', 'maintain', 'gain')
 * - gender: User's gender
 * - activity_level: Activity level multiplier
 * - bmr_formula: Formula used for BMR calculation
 * - body_fat_percentage: Optional body fat percentage
 * - target_calories_override: Optional manual calorie target
 */
exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const {
        name, email, weight, height, age, goal, gender, activity_level,
        bmr_formula, body_fat_percentage, target_calories_override
    } = req.body;

    // Input validation for all fields
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

    // Fetch current user data for comparison and merging
    conn.query('SELECT * FROM User WHERE id = ?', [userId], (fetchErr, currentUsers) => {
        if (fetchErr) {
            console.error("updateProfile - SQL Error (fetch current user):", fetchErr);
            return res.status(500).json({ error: 'Could not retrieve current user data for update.', details: fetchErr.code });
        }
        if (currentUsers.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentUserData = currentUsers[0];

        // Prepare fields to update, only including those present in the request
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

        // Recalculate nutritional values based on updated profile data
        const profileForCalc = { ...currentUserData, ...fieldsToUpdate };
        const calculatedValues = getCalculatedCalorieDetails(profileForCalc);
        fieldsToUpdate.bmr = calculatedValues.bmr;
        fieldsToUpdate.calculated_tdee = calculatedValues.tdee;
        fieldsToUpdate.calculated_target_calories = calculatedValues.targetCalories;

        /**
         * Performs the database update within a transaction
         * Updates user profile and logs weight changes if applicable
         * @param {boolean} isEmailConflict - Indicates if the new email is already in use
         */
        const performActualUpdate = (isEmailConflict) => {
            if (isEmailConflict) {
                return res.status(409).json({ error: 'Email already in use by another account.' });
            }

            // Begin database transaction
            conn.beginTransaction(transactionErr => {
                if (transactionErr) {
                    console.error("updateProfile - Transaction Begin Error:", transactionErr);
                    return res.status(500).json({ error: 'Failed to start database transaction.' });
                }

                // Update user profile
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

                    // Log weight change if provided
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
                            
                            // Check if this is the first weight log for this user
                            const checkFirstWeightQuery = 'SELECT COUNT(*) as count FROM weight_log WHERE user_id = ?';
                            conn.query(checkFirstWeightQuery, [userId], (checkErr, checkResult) => {
                                if (checkErr) {
                                    console.error("updateProfile - SQL Error (check first weight):", checkErr);
                                } else {
                                    // Check for achievements asynchronously - this is a weight log
                                    console.log(`[ProfileCtrl] Checking achievements for weight log. First weight log: ${checkResult[0].count === 1}, Weight: ${fieldsToUpdate.weight}`);
                                    checkAndAwardAchievements(userId, {
                                        type: 'WEIGHT_LOGGED',
                                        data: { 
                                            first_weight_log: checkResult[0].count === 1, // true if this is the first weight log
                                            weight: fieldsToUpdate.weight 
                                        }
                                    }).catch(achErr => console.error("[ProfileCtrl] Error during achievement check for weight log:", achErr));
                                }
                                commitAndRespond(newWeightProvided);
                            });
                        });
                    } else {
                        commitAndRespond(newWeightProvided);
                    }
                });

                /**
                 * Commits the transaction and returns the updated profile
                 * Handles any commit errors and rolls back if necessary
                 */
                function commitAndRespond(weightLogged) {
                    conn.commit(commitErr => {
                        if (commitErr) {
                            return conn.rollback(() => {
                                console.error("updateProfile - Transaction Commit Error:", commitErr);
                                res.status(500).json({ error: 'Failed to commit changes to database.' });
                            });
                        }

                        // Fetch and return updated profile
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
                            
                            // Check for achievements asynchronously
                            checkAndAwardAchievements(userId, {
                                type: 'PROFILE_UPDATED',
                                data: { 
                                    weight_logged: weightLogged,
                                    profile_complete: updatedUserRows[0].weight && updatedUserRows[0].height && updatedUserRows[0].age && updatedUserRows[0].goal && updatedUserRows[0].gender && updatedUserRows[0].activity_level
                                }
                            }).catch(achErr => console.error("[ProfileCtrl] Error during achievement check after profile update:", achErr));
                            
                            res.json(updatedUserRows[0]);
                        });
                    });
                }
            });
        };

        // Check for email conflicts before updating
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