/**
 * Exercise Controller
 * Manages exercise definitions and their metadata.
 * Handles CRUD operations for exercises, including MET values and calorie calculations.
 */
const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();

/**
 * Retrieves all exercises available to the user
 * Returns both public exercises and those created by the user
 * @param {Object} req - Express request object containing user ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing array of exercises
 * 
 * Response includes:
 * - Exercise details (ID, name, description)
 * - Calorie calculation data (MET value, calories per minute)
 * - Metadata (creator, public status, timestamps)
 */
exports.getAllExercises = (req, res) => {
    console.log('--- [exerciseController.getAllExercises] ---');
    console.log('req.user from authMiddleware:', req.user);

    // Validate user authentication
    if (!req.user || typeof req.user.id === 'undefined') {
        console.error('[exerciseController.getAllExercises] User ID not found in req.user. req.user:', req.user);
        return res.status(500).json({ error: 'User identification failed after authentication.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;
    const selectedUserId = req.query.userId; // For admin filtering

    console.log(`[exerciseController.getAllExercises] Attempting to fetch exercises for userId: ${userId}, role: ${userRole}`);

    // Base query with JOIN to get creator information
    let query = `
        SELECT 
            e.id, 
            e.name, 
            e.description, 
            e.met_value, 
            e.calories_per_minute, 
            e.created_by, 
            e.is_public, 
            e.created_at, 
            e.updated_at,
            u.name as creator_name
        FROM ExerciseDefinition e
        LEFT JOIN User u ON e.created_by = u.id
    `;

    let params = [];

    // Modify query based on user role and filters
    if (userRole === 'admin') {
        if (selectedUserId) {
            query += ' WHERE e.created_by = ?';
            params.push(selectedUserId);
        }
    } else {
        query += ' WHERE e.is_public = 1 OR e.created_by = ?';
        params.push(userId);
    }

    query += ' ORDER BY e.name ASC';

    console.log('[exerciseController.getAllExercises] SQL Query:', query);
    console.log('[exerciseController.getAllExercises] Query params:', params);

    conn.query(query, params, (err, exercises) => {
        if (err) {
            console.error('[exerciseController.getAllExercises] SQL Error executing query.');
            console.error('Error Code:', err.code);
            console.error('Error SQLMessage:', err.sqlMessage);
            console.error('Error SQLState:', err.sqlState);
            console.error('Full Error Object:', err);
            return res.status(500).json({ error: 'Failed to fetch exercises from database', details: err.sqlMessage || err.code });
        }
        console.log(`[exerciseController.getAllExercises] Successfully fetched ${exercises.length} exercises.`);
        res.json(exercises);
    });
};

/**
 * Creates a new exercise definition
 * Validates input and ensures required fields are provided
 * @param {Object} req - Express request object containing exercise data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing created exercise details
 * 
 * Request body must include:
 * - name: Exercise name
 * - met_value or calories_per_minute: At least one must be provided
 * - is_public: Boolean indicating if exercise is public
 * - description: Optional exercise description
 */
exports.createExercise = (req, res) => {
    const { name, description, met_value, calories_per_minute, is_public } = req.body;
    const created_by = req.user.id;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Exercise name is required and must be a non-empty string.' });
    }
    const finalIsPublic = typeof is_public === 'boolean' ? is_public : false;
    const numMetValue = (met_value !== undefined && met_value !== null && String(met_value).trim() !== '') ? parseFloat(met_value) : null;
    const numCaloriesPerMinute = (calories_per_minute !== undefined && calories_per_minute !== null && String(calories_per_minute).trim() !== '') ? parseFloat(calories_per_minute) : null;

    // Validate calorie calculation data
    if ((numMetValue === null) && (numCaloriesPerMinute === null)) {
        return res.status(400).json({ error: 'Either MET value or Calories per minute must be provided.' });
    }
    if (numMetValue !== null && (isNaN(numMetValue) || numMetValue <= 0)) {
        return res.status(400).json({ error: 'If provided, MET value must be a positive number.' });
    }
    if (numCaloriesPerMinute !== null && (isNaN(numCaloriesPerMinute) || numCaloriesPerMinute <= 0)) {
        return res.status(400).json({ error: 'If provided, Calories per minute must be a positive number.' });
    }

    // Insert new exercise
    const query = `
        INSERT INTO ExerciseDefinition (name, description, met_value, calories_per_minute, created_by, is_public)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    const params = [
        name.trim(),
        description ? description.trim() : null,
        numMetValue,
        numCaloriesPerMinute,
        created_by,
        finalIsPublic
    ];

    conn.query(query, params, (err, result) => {
        if (err) {
            console.error('Error creating exercise:', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to create exercise', details: err.code });
        }
        res.status(201).json({
            id: result.insertId,
            name: name.trim(),
            description: description ? description.trim() : null,
            met_value: numMetValue,
            calories_per_minute: numCaloriesPerMinute,
            created_by,
            is_public: finalIsPublic,
            message: 'Exercise created successfully'
        });
    });
};

/**
 * Updates an existing exercise definition
 * Verifies user permissions before allowing updates
 * @param {Object} req - Express request object containing exercise ID and update data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing updated exercise details
 * 
 * URL parameters:
 * - id: Exercise ID to update
 * 
 * Request body may include:
 * - name: Updated exercise name
 * - description: Updated exercise description
 * - met_value: Updated MET value
 * - calories_per_minute: Updated calories per minute
 * - is_public: Updated public status
 */
exports.updateExercise = (req, res) => {
    const exerciseId = req.params.id;
    if (isNaN(parseInt(exerciseId))) {
        return res.status(400).json({ error: 'Invalid exercise ID.' });
    }

    const { name, description, met_value, calories_per_minute, is_public } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Exercise name is required.' });
    }
    if (typeof is_public !== 'boolean' && is_public !== undefined) {
        return res.status(400).json({ error: 'is_public must be a boolean if provided.' });
    }

    // Parse and validate numeric values
    const numMetValue = (met_value !== undefined && met_value !== null && String(met_value).trim() !== '') ? parseFloat(met_value) : null;
    const numCaloriesPerMinute = (calories_per_minute !== undefined && calories_per_minute !== null && String(calories_per_minute).trim() !== '') ? parseFloat(calories_per_minute) : null;

    if ((numMetValue === null) && (numCaloriesPerMinute === null)) {
        return res.status(400).json({ error: 'Either MET value or Calories per minute must be provided for update.' });
    }
    if (numMetValue !== null && (isNaN(numMetValue) || numMetValue <= 0)) {
        return res.status(400).json({ error: 'If provided, MET value must be a positive number.' });
    }
    if (numCaloriesPerMinute !== null && (isNaN(numCaloriesPerMinute) || numCaloriesPerMinute <= 0)) {
        return res.status(400).json({ error: 'If provided, Calories per minute must be a positive number.' });
    }

    // Verify exercise exists and check permissions
    conn.query('SELECT id, created_by, is_public AS current_is_public FROM ExerciseDefinition WHERE id = ?', [exerciseId], (err, existingExercises) => {
        if (err) {
            console.error('Error fetching exercise for update check:', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to verify exercise for update', details: err.code });
        }
        if (existingExercises.length === 0) {
            return res.status(404).json({ error: 'Exercise not found.' });
        }

        const exercise = existingExercises[0];
        if (exercise.created_by !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this exercise.' });
        }

        // Update exercise with new values
        const updatedIsPublic = typeof is_public === 'boolean' ? is_public : exercise.current_is_public;
        const updateQuery = `
            UPDATE ExerciseDefinition
            SET name = ?, description = ?, met_value = ?, calories_per_minute = ?, is_public = ?
            WHERE id = ?;
        `;
        const params = [
            name.trim(),
            description ? description.trim() : null,
            numMetValue,
            numCaloriesPerMinute,
            updatedIsPublic,
            exerciseId
        ];

        conn.query(updateQuery, params, (updateErr) => {
            if (updateErr) {
                console.error('Error updating exercise:', updateErr.code, updateErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to update exercise', details: updateErr.code });
            }
            res.json({
                id: parseInt(exerciseId),
                name: name.trim(),
                description: description ? description.trim() : null,
                met_value: numMetValue,
                calories_per_minute: numCaloriesPerMinute,
                created_by: exercise.created_by,
                is_public: updatedIsPublic,
                message: 'Exercise updated successfully'
            });
        });
    });
};

/**
 * Deletes an exercise definition
 * Verifies user permissions before allowing deletion
 * @param {Object} req - Express request object containing exercise ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 * 
 * URL parameters:
 * - id: Exercise ID to delete
 */
exports.deleteExercise = (req, res) => {
    const exerciseId = req.params.id;
    if (isNaN(parseInt(exerciseId))) {
        return res.status(400).json({ error: 'Invalid exercise ID.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify exercise exists and check permissions
    conn.query('SELECT id, created_by FROM ExerciseDefinition WHERE id = ?', [exerciseId], (err, existingExercises) => {
        if (err) {
            console.error('Error fetching exercise for delete check:', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Failed to verify exercise for deletion', details: err.code });
        }
        if (existingExercises.length === 0) {
            return res.status(404).json({ error: 'Exercise not found.' });
        }

        const exercise = existingExercises[0];
        if (exercise.created_by !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this exercise.' });
        }

        // Delete the exercise
        conn.query('DELETE FROM ExerciseDefinition WHERE id = ?', [exerciseId], (deleteErr) => {
            if (deleteErr) {
                console.error('Error deleting exercise:', deleteErr.code, deleteErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to delete exercise', details: deleteErr.code });
            }
            res.json({ message: 'Exercise deleted successfully.' });
        });
    });
};

/**
 * Get a single exercise by ID
 * @param {Object} req - Express request object containing exercise ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing exercise details
 */
exports.getOneExercise = (req, res) => {
    const exerciseId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
        SELECT 
            e.id, 
            e.name, 
            e.description, 
            e.met_value, 
            e.calories_per_minute, 
            e.created_by, 
            e.is_public, 
            e.created_at, 
            e.updated_at,
            u.username as creator_name
        FROM ExerciseDefinition e
        LEFT JOIN User u ON e.created_by = u.id
        WHERE e.id = ?
    `;

    conn.query(query, [exerciseId], (err, exercises) => {
        if (err) {
            console.error('Error fetching exercise:', err);
            return res.status(500).json({ error: 'Failed to fetch exercise' });
        }

        if (exercises.length === 0) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        const exercise = exercises[0];

        // Check if user has permission to view this exercise
        if (userRole !== 'admin' && exercise.created_by !== userId && !exercise.is_public) {
            return res.status(403).json({ error: 'You do not have permission to view this exercise' });
        }

        res.json(exercise);
    });
};