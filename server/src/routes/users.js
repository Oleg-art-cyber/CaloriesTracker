const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const db = require('../config/dbSingleton');
const connection = db.getConnection();

/**
 * GET /api/users
 * Returns list of all users (admin only)
 */
router.get('/', auth(['admin']), (req, res) => {
    connection.query(
        'SELECT id, name, email FROM User ORDER BY name',
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json(rows);
        }
    );
});

module.exports = router; 