/**
 * Categories Routes
 * Handles product category management
 * Provides read-only access to category information
 */
const express = require('express');
const db      = require('../config/dbSingleton').getConnection();
const router  = express.Router();

/**
 * Get all product categories
 * GET /api/categories
 * 
 * Response:
 * - 200: Array of categories with id, name, and label
 * - 500: Database error
 * 
 * Categories are sorted by ID in ascending order
 */
router.get('/', (_req, res) => {
    db.query('SELECT id, name, label FROM category ORDER BY id', (e, rows) =>
        e ? res.status(500).json({ error: 'DB' }) : res.json(rows)
    );
});

module.exports = router;
