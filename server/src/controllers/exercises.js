const db = require('../config/database');

/**
 * Get all exercises available to the user
 * Returns public exercises and those created by the user
 * For admins, returns all exercises with optional user filtering
 */
exports.getAllExercises = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const filterUserId = req.query.user_id;

        console.log('--- [exerciseController.getAllExercises] ---');
        console.log('req.user from authMiddleware:', req.user);
        console.log('[exerciseController.getAllExercises] Attempting to fetch exercises for userId:', userId);

        let query = `
            SELECT e.id, e.name, e.description, e.met_value, e.calories_per_minute, 
                   e.created_by, e.is_public, e.created_at, e.updated_at,
                   u.name as created_by_username
            FROM ExerciseDefinition e
            LEFT JOIN User u ON e.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (isAdmin) {
            if (filterUserId) {
                query += ' AND e.created_by = ?';
                params.push(filterUserId);
            }
        } else {
            query += ' AND (e.is_public = 1 OR e.created_by = ?)';
            params.push(userId);
        }

        query += ' ORDER BY e.name ASC';

        console.log('[exerciseController.getAllExercises] SQL Query:', query);
        console.log('[exerciseController.getAllExercises] Query params:', params);

        const [exercises] = await db.query(query, params);
        console.log('[exerciseController.getAllExercises] Successfully fetched', exercises.length, 'exercises.');
        console.log('[exerciseController.getAllExercises] First exercise:', exercises[0]);

        res.json(exercises);
    } catch (error) {
        console.error('Error in getAllExercises:', error);
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
};

/**
 * Get a single exercise by ID
 * Returns exercise details including creator information
 */
exports.getOneExercise = async (req, res) => {
    try {
        const exerciseId = req.params.id;
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        const query = `
            SELECT e.*, u.name as created_by_username
            FROM ExerciseDefinition e
            LEFT JOIN User u ON e.created_by = u.id
            WHERE e.id = ?
        `;
        const params = [exerciseId];

        const [exercises] = await db.query(query, params);

        if (exercises.length === 0) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        const exercise = exercises[0];

        // Check if user has permission to view this exercise
        if (!exercise.is_public && exercise.created_by !== userId && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to view this exercise' });
        }

        res.json(exercise);
    } catch (error) {
        console.error('Error in getOneExercise:', error);
        res.status(500).json({ error: 'Failed to fetch exercise' });
    }
}; 