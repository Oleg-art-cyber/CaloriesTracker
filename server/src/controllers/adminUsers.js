const dbSingleton = require('../config/dbSingleton');
const conn = dbSingleton.getConnection();
const bcrypt = require('bcrypt');

/**
 * Executes a SQL query using a Promise-based wrapper.
 */
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        if (!conn) return reject(new Error("Database connection not available."));
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * GET /api/admin/users
 * Retrieves a paginated list of users with optional search.
 */
exports.getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.q || '';

    try {
        let countQuery = 'SELECT COUNT(*) as total FROM User';
        let usersQuery = 'SELECT id, name, email, role, weight, height, age, gender, activity_level, created_at FROM User';
        const queryParams = [];
        const countParams = [];

        if (searchTerm) {
            const condition = ' WHERE (name LIKE ? OR email LIKE ?)';
            usersQuery += condition;
            countQuery += condition;
            const pattern = `%${searchTerm}%`;
            queryParams.push(pattern, pattern);
            countParams.push(pattern, pattern);
        }

        usersQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?;';
        queryParams.push(limit, offset);

        const totalRowsData = await queryAsync(countQuery, countParams);
        const totalUsers = totalRowsData[0]?.total || 0;
        const users = await queryAsync(usersQuery, queryParams);

        res.json({ data: users, total: totalUsers, page, limit });
    } catch (error) {
        console.error("getAllUsers - Error:", error);
        res.status(500).json({ error: "Failed to retrieve users.", details: error.message });
    }
};

/**
 * GET /api/admin/users/:userId
 * Retrieves a specific user by ID.
 */
exports.getUserById = async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID." });

    try {
        const userRows = await queryAsync('SELECT id, name, email, role, weight, height, age, gender, activity_level FROM User WHERE id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ error: "User not found." });
        res.json(userRows[0]);
    } catch (error) {
        console.error(`getUserById - Error:`, error);
        res.status(500).json({ error: "Failed to retrieve user.", details: error.message });
    }
};

/**
 * PUT /api/admin/users/:userId
 * Updates user details by admin. Includes validation.
 */
exports.updateUserByAdmin = async (req, res) => {
    const targetUserId = parseInt(req.params.userId, 10);
    const adminUserId = req.user.id;
    if (isNaN(targetUserId)) return res.status(400).json({ error: "Invalid target user ID." });

    const { name, email, role, weight, height, age, gender, activity_level } = req.body;
    const fieldsToUpdate = {};

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') return res.status(400).json({ error: "Name cannot be empty." });
        fieldsToUpdate.name = name.trim();
    }

    if (email !== undefined) {
        if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Invalid email format.' });
        fieldsToUpdate.email = email.trim();
    }

    if (role !== undefined) {
        if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: "Invalid role specified." });
        if (targetUserId === adminUserId && role !== 'admin') {
            return res.status(403).json({ error: "Admin cannot change their own role." });
        }
        fieldsToUpdate.role = role;
    }

    if (weight !== undefined) fieldsToUpdate.weight = (String(weight).trim() === '' || weight === null) ? null : parseFloat(weight);
    if (height !== undefined) fieldsToUpdate.height = (String(height).trim() === '' || height === null) ? null : parseFloat(height);
    if (age !== undefined) fieldsToUpdate.age = (String(age).trim() === '' || age === null) ? null : parseInt(age);
    if (gender !== undefined) fieldsToUpdate.gender = ['male', 'female', 'other'].includes(gender) ? gender : null;
    if (activity_level !== undefined) fieldsToUpdate.activity_level = ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activity_level) ? activity_level : 'sedentary';

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    try {
        if (fieldsToUpdate.email) {
            const emailCheck = await queryAsync('SELECT id FROM User WHERE email = ? AND id != ?', [fieldsToUpdate.email, targetUserId]);
            if (emailCheck.length > 0) return res.status(409).json({ error: 'Email already in use.' });
        }

        const updateResult = await queryAsync('UPDATE User SET ? WHERE id = ?', [fieldsToUpdate, targetUserId]);
        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes made.' });
        }

        const updatedUserRows = await queryAsync('SELECT id, name, email, role, weight, height, age, gender, activity_level, created_at FROM User WHERE id = ?', [targetUserId]);
        if (updatedUserRows.length === 0) {
            return res.status(404).json({ error: 'User no longer exists.' });
        }

        res.json(updatedUserRows[0]);
    } catch (error) {
        console.error(`updateUserByAdmin - Error:`, error);
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.toLowerCase().includes('email')) {
            return res.status(409).json({ error: 'Email already exists.' });
        }
        res.status(500).json({ error: "Failed to update user.", details: error.message });
    }
};

/**
 * DELETE /api/admin/users/:userId
 * Deletes a user by ID. Prevents self-deletion.
 */
exports.deleteUserByAdmin = async (req, res) => {
    const targetUserId = parseInt(req.params.userId, 10);
    const adminUserId = req.user.id;

    if (isNaN(targetUserId)) return res.status(400).json({ error: "Invalid user ID." });
    if (targetUserId === adminUserId) return res.status(403).json({ error: "Admin cannot delete their own account." });

    try {
        const deleteResult = await queryAsync('DELETE FROM User WHERE id = ?', [targetUserId]);
        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or already deleted.' });
        }
        res.status(200).json({ message: `User ID ${targetUserId} deleted successfully.` });
    } catch (error) {
        console.error(`deleteUserByAdmin - Error:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(409).json({
                error: "Cannot delete user due to existing related data.",
                details: error.sqlMessage
            });
        }
        res.status(500).json({ error: "Failed to delete user.", details: error.message });
    }
};
