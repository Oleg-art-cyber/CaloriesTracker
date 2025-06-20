/**
 * Physical Activity Controller
 * Handles logging and management of user physical activities and exercise tracking.
 * Calculates calories burned based on exercise type, duration, and user weight.
 */
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

/**
 * Logs a new physical activity for the user
 * Calculates calories burned based on exercise type, duration, and user weight
 * @param {Object} req - Express request object containing user ID and activity data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing logged activity details
 * 
 * Request body must include:
 * - exercise_definition_id: ID of the exercise type
 * - duration_minutes: Duration of the activity in minutes
 * - activity_date: Date of the activity (YYYY-MM-DD)
 * 
 * Response includes:
 * - Activity details (ID, type, duration, calories burned)
 * - Success message
 */
exports.logActivity = (req, res) => {
    const currentUserId = req.user.id;
    const { exercise_definition_id, duration_minutes, activity_date } = req.body;

    // Validate required input fields
    if (!exercise_definition_id || isNaN(parseInt(exercise_definition_id))) {
        return res.status(400).json({ error: 'Valid exercise_definition_id is required.' });
    }
    if (!duration_minutes || isNaN(parseInt(duration_minutes)) || parseInt(duration_minutes) <= 0) {
        return res.status(400).json({ error: 'Valid positive duration_minutes is required.' });
    }
    if (!activity_date || !/^\d{4}-\d{2}-\d{2}$/.test(activity_date)) {
        return res.status(400).json({ error: 'Valid activity_date (YYYY-MM-DD) is required.' });
    }

    const numExerciseDefId = parseInt(exercise_definition_id, 10);
    const numDuration = parseInt(duration_minutes, 10);

    // Fetch user's current weight and exercise details
    const getUserWeightQuery = 'SELECT weight FROM User WHERE id = ?;';
    const getExerciseDetailsQuery = 'SELECT met_value, calories_per_minute, name FROM ExerciseDefinition WHERE id = ?;';

    conn.query(getUserWeightQuery, [currentUserId], (userErr, userResults) => {
        if (userErr) {
            console.error("logActivity - SQL Error (fetch user weight):", userErr.code, userErr.sqlMessage, userErr);
            return res.status(500).json({ error: 'Failed to retrieve user data.', details: userErr.code });
        }
        if (userResults.length === 0 || userResults[0].weight === null || userResults[0].weight === undefined) {
            return res.status(400).json({ error: 'User weight not found or not set. Please update your profile.' });
        }
        const userWeightKg = parseFloat(userResults[0].weight);
        if (isNaN(userWeightKg) || userWeightKg <= 0) {
            return res.status(400).json({ error: 'User weight is invalid. Please update your profile.' });
        }

        // Fetch exercise details and calculate calories burned
        conn.query(getExerciseDetailsQuery, [numExerciseDefId], (exErr, exResults) => {
            if (exErr) {
                console.error("logActivity - SQL Error (fetch exercise details):", exErr.code, exErr.sqlMessage, exErr);
                return res.status(500).json({ error: 'Failed to retrieve exercise details.', details: exErr.code });
            }
            if (exResults.length === 0) {
                return res.status(404).json({ error: 'Exercise definition not found.' });
            }

            const exercise = exResults[0];
            let caloriesBurned = 0;

            // Calculate calories burned using MET value or calories per minute
            if (exercise.met_value && userWeightKg) {
                caloriesBurned = (parseFloat(exercise.met_value) || 0) * userWeightKg * (numDuration / 60.0);
            } else if (exercise.calories_per_minute) {
                caloriesBurned = (parseFloat(exercise.calories_per_minute) || 0) * numDuration;
            } else {
                console.warn(`logActivity: No MET value or calories_per_minute for exercise ID ${numExerciseDefId}. Calories burned set to 0.`);
            }
            caloriesBurned = Math.round(caloriesBurned);
            const activityTypeFromName = exercise.name || 'Logged Activity';

            // Insert the activity record
            const insertActivityQuery = `
                INSERT INTO PhysicalActivity (user_id, exercise_definition_id, activity_date, duration_minutes, calories_burned, activity_type)
                VALUES (?, ?, ?, ?, ?, ?); 
            `;
            conn.query(insertActivityQuery, [currentUserId, numExerciseDefId, activity_date, numDuration, caloriesBurned, activityTypeFromName], (insertErr, result) => {
                if (insertErr) {
                    console.error("logActivity - SQL Error (insert activity):", insertErr.code, insertErr.sqlMessage, insertErr);
                    return res.status(500).json({ error: 'Failed to log physical activity.', details: insertErr.code });
                }
                res.status(201).json({
                    id: result.insertId,
                    user_id: currentUserId,
                    exercise_definition_id: numExerciseDefId,
                    activity_date,
                    duration_minutes: numDuration,
                    calories_burned: caloriesBurned,
                    activity_type: activityTypeFromName,
                    message: 'Activity logged successfully.'
                });
            });
        });
    });
};

/**
 * Deletes a physical activity record
 * Verifies ownership before deletion
 * @param {Object} req - Express request object containing user ID and activity ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 * 
 * URL parameters:
 * - activityId: ID of the activity to delete
 */
exports.deleteActivity = (req, res) => {
    const currentUserId = req.user.id;
    const activityId = parseInt(req.params.activityId, 10);

    if (isNaN(activityId)) {
        return res.status(400).json({ error: 'Invalid activity ID.' });
    }

    // Verify activity ownership before deletion
    const checkOwnerQuery = 'SELECT user_id FROM PhysicalActivity WHERE id = ?;';
    conn.query(checkOwnerQuery, [activityId], (ownerErr, results) => {
        if (ownerErr) {
            console.error("deleteActivity - SQL Error (check owner):", ownerErr.code, ownerErr.sqlMessage, ownerErr);
            return res.status(500).json({ error: 'Failed to verify activity.', details: ownerErr.code });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Activity not found.' });
        }
        if (results[0].user_id !== currentUserId) {
            return res.status(403).json({ error: 'Forbidden: You cannot delete this activity.' });
        }

        // Delete the activity record
        const deleteQuery = 'DELETE FROM PhysicalActivity WHERE id = ?;';
        conn.query(deleteQuery, [activityId], (deleteErr) => {
            if (deleteErr) {
                console.error("deleteActivity - SQL Error (delete activity):", deleteErr.code, deleteErr.sqlMessage, deleteErr);
                return res.status(500).json({ error: 'Failed to delete activity.', details: deleteErr.code });
            }
            res.status(200).json({ message: 'Activity deleted successfully.' });
        });
    });
};