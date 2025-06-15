// server/controllers/adminUsers.js
const dbSingleton = require('../config/dbSingleton'); // Adjust path if necessary
const conn = dbSingleton.getConnection();
const bcrypt = require('bcrypt');

// Helper function to promisify conn.query (as you provided)
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        if (!conn) {
            return reject(new Error("Database connection not available."));
        }
        conn.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            // For SELECT queries, 'results' is typically an array of rows.
            // For DML (INSERT, UPDATE, DELETE), 'results' is an object with info like affectedRows, insertId.
            resolve(results);
        });
    });
}

// --- GET /api/admin/users ---
// Fetches a list of users with pagination and search
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
            const searchCondition = ' WHERE (name LIKE ? OR email LIKE ?)'; // Ensure parentheses for OR
            usersQuery += searchCondition;
            countQuery += searchCondition;
            const searchPattern = `%${searchTerm}%`;
            queryParams.push(searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern);
        }

        usersQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?;';
        queryParams.push(limit, offset);

        // For SELECT COUNT(*), result is an array like [{ total: N }]
        const totalRowsData = await queryAsync(countQuery, countParams);
        const totalUsers = totalRowsData[0]?.total || 0;

        // For SELECT multiple rows, result is an array of user objects
        const users = await queryAsync(usersQuery, queryParams);

        res.json({
            data: users,
            total: totalUsers,
            page,
            limit
        });
    } catch (error) {
        console.error("getAllUsers (admin) - Error:", error);
        res.status(500).json({ error: "Failed to retrieve users.", details: error.message });
    }
};

// --- GET /api/admin/users/:userId ---
// Fetches a single user by ID
exports.getUserById = async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID." });

    try {
        // For SELECT one row, result is an array like [{user_data}]
        const userRows = await queryAsync('SELECT id, name, email, role, weight, height, age, gender, activity_level FROM User WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json(userRows[0]);
    } catch (error) {
        console.error(`getUserById (admin) for ID ${userId} - Error:`, error);
        res.status(500).json({ error: "Failed to retrieve user.", details: error.message });
    }
};

// --- PUT /api/admin/users/:userId ---
// Admin updates user details
exports.updateUserByAdmin = async (req, res) => {
    const targetUserId = parseInt(req.params.userId, 10);
    const adminUserId = req.user.id;

    if (isNaN(targetUserId)) return res.status(400).json({ error: "Invalid target user ID." });

    const { name, email, role, weight, height, age, gender, activity_level /*, newPassword */ } = req.body;
    const fieldsToUpdate = {};

    // Validation and field preparation
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') return res.status(400).json({ error: "Name cannot be empty." });
        fieldsToUpdate.name = name.trim();
    }
    if (email !== undefined) {
        if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Invalid email format.' });
        fieldsToUpdate.email = email.trim(); // Email uniqueness will be checked before update
    }
    if (role !== undefined) {
        if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: "Invalid role specified." });
        if (targetUserId === adminUserId && role !== 'admin') {
            return res.status(403).json({ error: "Admin cannot change their own role to non-admin." });
        }
        fieldsToUpdate.role = role;
    }
    if (weight !== undefined) fieldsToUpdate.weight = (String(weight).trim() === '' || weight === null) ? null : parseFloat(weight);
    if (height !== undefined) fieldsToUpdate.height = (String(height).trim() === '' || height === null) ? null : parseFloat(height);
    if (age !== undefined) fieldsToUpdate.age = (String(age).trim() === '' || age === null) ? null : parseInt(age);

    if (gender !== undefined) fieldsToUpdate.gender = ['male', 'female', 'other'].includes(gender) ? gender : null;
    if (activity_level !== undefined) fieldsToUpdate.activity_level = ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activity_level) ? activity_level : 'sedentary';

    // Optional: Password Reset
    // if (newPassword && newPassword.trim() !== '') {
    //     if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters." });
    //     fieldsToUpdate.password = await bcrypt.hash(newPassword, 10);
    // }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    try {
        // If email is being changed, check if the new email is already taken by *another* user
        if (fieldsToUpdate.email) {
            const existingEmailUserRows = await queryAsync('SELECT id FROM User WHERE email = ? AND id != ?', [fieldsToUpdate.email, targetUserId]);
            if (existingEmailUserRows.length > 0) {
                return res.status(409).json({ error: 'Email already in use by another account.' });
            }
        }

        // For UPDATE, result is an object like { affectedRows: 1, ... }
        const updateResult = await queryAsync('UPDATE User SET ? WHERE id = ?', [fieldsToUpdate, targetUserId]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes were made (data might be the same).' });
        }

        const updatedUserRows = await queryAsync('SELECT id, name, email, role, weight, height, age, gender, activity_level, created_at FROM User WHERE id = ?', [targetUserId]);
        if (updatedUserRows.length === 0) {
            return res.status(404).json({ error: 'Failed to retrieve updated user data (user may have been deleted concurrently).' });
        }
        res.json(updatedUserRows[0]);

    } catch (error) {
        console.error(`updateUserByAdmin for ID ${targetUserId} - Error:`, error);
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.toLowerCase().includes('email')) {
            return res.status(409).json({ error: 'Email already exists (unique constraint failed).' });
        }
        res.status(500).json({ error: "Failed to update user profile.", details: error.message });
    }
};

// --- DELETE /api/admin/users/:userId ---
// Admin deletes a user
exports.deleteUserByAdmin = async (req, res) => {
    const targetUserId = parseInt(req.params.userId, 10);
    const adminUserId = req.user.id;

    if (isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid target user ID." });
    }
    if (targetUserId === adminUserId) {
        return res.status(403).json({ error: "Admin cannot delete their own account." });
    }

    try {
        // For DELETE, result is an object like { affectedRows: 1, ... }
        const deleteResult = await queryAsync('DELETE FROM User WHERE id = ?', [targetUserId]);
        // console.log("Delete result:", deleteResult); // For debugging

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or already deleted.' });
        }
        res.status(200).json({ message: `User ID ${targetUserId} deleted successfully.` });
    } catch (error) {
        console.error(`deleteUserByAdmin for ID ${targetUserId} - Error:`, error);
        // ER_ROW_IS_REFERENCED_2 (MySQL) or similar for MariaDB (errno 1451)
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(409).json({
                error: "Cannot delete user: They have related data in other tables (e.g., meals, recipes, activities). Please ensure ON DELETE CASCADE or ON DELETE SET NULL is set correctly on foreign keys referencing the User table, or manually remove/reassign related data.",
                details: error.sqlMessage
            });
        }
        res.status(500).json({ error: "Failed to delete user.", details: error.message });
    }
};