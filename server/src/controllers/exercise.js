// server/controllers/exercise.js
const dbSingleton = require('../config/dbSingleton'); // Adjust path as per your structure
const conn = dbSingleton.getConnection();

// --- GET /api/exercises ---
// Fetches all public exercises and exercises created by the currently authenticated user.
exports.getAllExercises = (req, res) => {
    console.log('--- [exerciseController.getAllExercises] ---');
    console.log('req.user from authMiddleware:', req.user); // CHECK THIS!

    // Ensure req.user and req.user.id exist
    if (!req.user || typeof req.user.id === 'undefined') {
        console.error('[exerciseController.getAllExercises] User ID not found in req.user. req.user:', req.user);
        return res.status(500).json({ error: 'User identification failed after authentication.' });
    }
    const userId = req.user.id; // Or req.user.userId if that's the field name in your JWT payload

    console.log(`[exerciseController.getAllExercises] Attempting to fetch exercises for userId: ${userId}`);

    const query = `
        SELECT id, name, description, met_value, calories_per_minute, created_by, is_public, created_at, updated_at
        FROM ExerciseDefinition
        WHERE is_public = 1 OR created_by = ?
        ORDER BY name ASC;
    `;

    console.log('[exerciseController.getAllExercises] SQL Query:', query.replace('?', userId.toString()));

    conn.query(query, [userId], (err, exercises) => {
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

// --- POST /api/exercises ---
// Creates a new exercise definition.
exports.createExercise = (req, res) => {
    const { name, description, met_value, calories_per_minute, is_public } = req.body;
    const created_by = req.user.id;

    // Input Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Exercise name is required and must be a non-empty string.' });
    }
    const finalIsPublic = typeof is_public === 'boolean' ? is_public : false; // Default to false
    const numMetValue = (met_value !== undefined && met_value !== null && String(met_value).trim() !== '') ? parseFloat(met_value) : null;
    const numCaloriesPerMinute = (calories_per_minute !== undefined && calories_per_minute !== null && String(calories_per_minute).trim() !== '') ? parseFloat(calories_per_minute) : null;

    if ((numMetValue === null) && (numCaloriesPerMinute === null)) {
        return res.status(400).json({ error: 'Either MET value or Calories per minute must be provided.' });
    }
    if (numMetValue !== null && (isNaN(numMetValue) || numMetValue <= 0)) {
        return res.status(400).json({ error: 'If provided, MET value must be a positive number.' });
    }
    if (numCaloriesPerMinute !== null && (isNaN(numCaloriesPerMinute) || numCaloriesPerMinute <= 0)) {
        return res.status(400).json({ error: 'If provided, Calories per minute must be a positive number.' });
    }

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

// --- PUT /api/exercises/:id ---
// Updates an existing exercise definition.
exports.updateExercise = (req, res) => {
    const exerciseId = req.params.id;
    if (isNaN(parseInt(exerciseId))) {
        return res.status(400).json({ error: 'Invalid exercise ID.' });
    }

    const { name, description, met_value, calories_per_minute, is_public } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Input Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Exercise name is required.' });
    }
    const finalIsPublic = typeof is_public === 'boolean' ? is_public : (/* fetch existing or default? For now, error if not bool */ false); // Decide handling
    if (typeof is_public !== 'boolean' && is_public !== undefined) { // Allow undefined, but not other types
        return res.status(400).json({ error: 'is_public must be a boolean if provided.' });
    }

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

    // Check if exercise exists and if user has permission
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

        const updatedIsPublic = typeof is_public === 'boolean' ? is_public : exercise.current_is_public; // Use existing if not provided

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

// --- DELETE /api/exercises/:id ---
// Deletes an exercise definition.
exports.deleteExercise = (req, res) => {
    const exerciseId = req.params.id;
    if (isNaN(parseInt(exerciseId))) {
        return res.status(400).json({ error: 'Invalid exercise ID.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;

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

        conn.query('DELETE FROM ExerciseDefinition WHERE id = ?', [exerciseId], (deleteErr) => {
            if (deleteErr) {
                console.error('Error deleting exercise:', deleteErr.code, deleteErr.sqlMessage);
                return res.status(500).json({ error: 'Failed to delete exercise', details: deleteErr.code });
            }
            res.json({ message: 'Exercise deleted successfully.' });
        });
    });
};