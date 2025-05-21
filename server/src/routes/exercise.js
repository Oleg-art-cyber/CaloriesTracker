// server/routes/exerciseRoutes.js
const express = require('express');
const router = express.Router();
const dbSingleton = require('../config/dbSingleton'); // Assuming your dbSingleton is here
const conn = dbSingleton.getConnection(); // Get the connection pool/instance
const authMiddleware = require('../middleware/authMiddleware'); // Adjust path if necessary

// --- GET /api/exercises ---
// Fetches all public exercises and exercises created by the currently authenticated user.
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id; // Extracted from JWT by authMiddleware

    try {
        const query = `
            SELECT id, name, description, met_value, calories_per_minute, created_by, is_public, created_at, updated_at
            FROM ExerciseDefinition
            WHERE is_public = 1 OR created_by = ?
            ORDER BY name ASC;
        `;
        const [exercises] = await conn.query(query, [userId]);
        res.json(exercises);
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ error: 'Failed to fetch exercises. Please try again later.' });
    }
});

// --- POST /api/exercises ---
// Creates a new exercise definition.
router.post('/', authMiddleware, async (req, res) => {
    const { name, description, met_value, calories_per_minute, is_public } = req.body;
    const created_by = req.user.id;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Exercise name is required and must be a non-empty string.' });
    }
    if ((met_value === undefined || met_value === null || met_value === '') &&
        (calories_per_minute === undefined || calories_per_minute === null || calories_per_minute === '')) {
        return res.status(400).json({ error: 'Either MET value or Calories per minute must be provided.' });
    }
    // Ensure numeric values are positive if provided, or null otherwise
    const numMetValue = (met_value !== undefined && met_value !== null && met_value !== '') ? parseFloat(met_value) : null;
    const numCaloriesPerMinute = (calories_per_minute !== undefined && calories_per_minute !== null && calories_per_minute !== '') ? parseFloat(calories_per_minute) : null;

    if (numMetValue !== null && (isNaN(numMetValue) || numMetValue <= 0)) {
        return res.status(400).json({ error: 'MET value must be a positive number.' });
    }
    if (numCaloriesPerMinute !== null && (isNaN(numCaloriesPerMinute) || numCaloriesPerMinute <= 0)) {
        return res.status(400).json({ error: 'Calories per minute must be a positive number.' });
    }
    if (typeof is_public !== 'boolean') {
        // Default to false if not a boolean or not provided
        // Or return an error: return res.status(400).json({ error: 'is_public must be a boolean.' });
    }
    const finalIsPublic = typeof is_public === 'boolean' ? is_public : false;


    try {
        const query = `
            INSERT INTO ExerciseDefinition (name, description, met_value, calories_per_minute, created_by, is_public)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const [result] = await conn.query(query, [
            name.trim(),
            description ? description.trim() : null,
            numMetValue,
            numCaloriesPerMinute,
            created_by,
            finalIsPublic
        ]);

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
    } catch (error) {
        console.error('Error creating exercise:', error);
        // Check for specific DB errors like duplicate entry if name should be unique per user/globally
        res.status(500).json({ error: 'Failed to create exercise. Please try again later.' });
    }
});

// --- PUT /api/exercises/:id ---
// Updates an existing exercise definition.
router.put('/:id', authMiddleware, async (req, res) => {
    const exerciseId = req.params.id;
    if (isNaN(parseInt(exerciseId))) {
        return res.status(400).json({ error: 'Invalid exercise ID.' });
    }

    const { name, description, met_value, calories_per_minute, is_public } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate input (similar to POST)
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Exercise name is required.' });
    }
    if ((met_value === undefined || met_value === null || met_value === '') &&
        (calories_per_minute === undefined || calories_per_minute === null || calories_per_minute === '')) {
        return res.status(400).json({ error: 'Either MET value or Calories per minute must be provided.' });
    }
    const numMetValue = (met_value !== undefined && met_value !== null && met_value !== '') ? parseFloat(met_value) : null;
    const numCaloriesPerMinute = (calories_per_minute !== undefined && calories_per_minute !== null && calories_per_minute !== '') ? parseFloat(calories_per_minute) : null;

    if (numMetValue !== null && (isNaN(numMetValue) || numMetValue <= 0)) {
        return res.status(400).json({ error: 'MET value must be a positive number.' });
    }
    if (numCaloriesPerMinute !== null && (isNaN(numCaloriesPerMinute) || numCaloriesPerMinute <= 0)) {
        return res.status(400).json({ error: 'Calories per minute must be a positive number.' });
    }
    if (typeof is_public !== 'boolean') {
        // return res.status(400).json({ error: 'is_public must be a boolean.' });
    }
    const finalIsPublic = typeof is_public === 'boolean' ? is_public : false; // Or fetch existing if not provided

    try {
        const [existingExercises] = await conn.query('SELECT id, created_by FROM ExerciseDefinition WHERE id = ?', [exerciseId]);
        if (existingExercises.length === 0) {
            return res.status(404).json({ error: 'Exercise not found.' });
        }

        const exercise = existingExercises[0];
        if (exercise.created_by !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this exercise.' });
        }

        // Admins can change is_public status, regular users might not, or only for their own items.
        // Current logic allows changing is_public if user has edit rights.
        const query = `
            UPDATE ExerciseDefinition
            SET name = ?, description = ?, met_value = ?, calories_per_minute = ?, is_public = ?
            WHERE id = ?;
        `;
        await conn.query(query, [
            name.trim(),
            description ? description.trim() : null,
            numMetValue,
            numCaloriesPerMinute,
            finalIsPublic,
            exerciseId
        ]);

        res.json({
            id: parseInt(exerciseId),
            name: name.trim(),
            description: description ? description.trim() : null,
            met_value: numMetValue,
            calories_per_minute: numCaloriesPerMinute,
            created_by: exercise.created_by, // Keep original creator
            is_public: finalIsPublic,
            message: 'Exercise updated successfully'
        });
    } catch (error) {
        console.error('Error updating exercise:', error);
        res.status(500).json({ error: 'Failed to update exercise. Please try again later.' });
    }
});

// --- DELETE /api/exercises/:id ---
// Deletes an exercise definition.
router.delete('/:id', authMiddleware, async (req, res) => {
    const exerciseId = req.params.id;
    if (isNaN(parseInt(exerciseId))) {
        return res.status(400).json({ error: 'Invalid exercise ID.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const [existingExercises] = await conn.query('SELECT id, created_by FROM ExerciseDefinition WHERE id = ?', [exerciseId]);
        if (existingExercises.length === 0) {
            return res.status(404).json({ error: 'Exercise not found.' });
        }

        const exercise = existingExercises[0];
        if (exercise.created_by !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this exercise.' });
        }

        // The foreign key constraint `fk_pa_exercise_def` in `PhysicalActivity`
        // is set to ON DELETE SET NULL. So, if an ExerciseDefinition is deleted,
        // any `PhysicalActivity` records referencing it will have their
        // `exercise_definition_id` set to NULL. This is generally acceptable.

        await conn.query('DELETE FROM ExerciseDefinition WHERE id = ?', [exerciseId]);
        res.json({ message: 'Exercise deleted successfully.' });
    } catch (error) {
        console.error('Error deleting exercise:', error);
        // Check for FK constraint errors if PhysicalActivity FK wasn't SET NULL
        res.status(500).json({ error: 'Failed to delete exercise. Please try again later.' });
    }
});

module.exports = router;