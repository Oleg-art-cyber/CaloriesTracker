const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../src/middlewares/auth');

// Get new users in date range
router.get('/users/new', authMiddleware(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        console.log('Received request with query params:', req.query);
        console.log('Parsed dates:', { startDate, endDate });
        
        if (!startDate || !endDate) {
            console.log('Missing date parameters');
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            console.log('Invalid date format:', { startDate, endDate });
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD format',
                received: { startDate, endDate }
            });
        }

        // Convert dates to Date objects for comparison
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.log('Invalid date values:', { start, end });
            return res.status(400).json({ 
                error: 'Invalid date values',
                received: { startDate, endDate }
            });
        }

        if (start > end) {
            console.log('Start date is after end date:', { start, end });
            return res.status(400).json({ 
                error: 'Start date cannot be after end date',
                received: { startDate, endDate }
            });
        }

        const query = `
            SELECT id, name, email, role, created_at
            FROM User
            WHERE created_at >= ? AND created_at <= ?
            ORDER BY created_at DESC
        `;

        console.log('Executing query with params:', [startDate, endDate]);

        const [users] = await pool.query(query, [startDate, endDate]);
        
        console.log('Query result:', users);
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching new users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch new users', 
            details: error.message,
            sqlMessage: error.sqlMessage,
            query: query,
            params: [startDate, endDate]
        });
    }
}); 