// server/routes/adminStatistics.js
const router = require('express').Router();
const adminStatsController = require('../controllers/adminStatistics');
const authMiddleware = require('../middlewares/auth'); // Your existing auth middleware

// Protect all routes in this file - only for 'admin' role
router.use(authMiddleware(['admin']));

router.get('/statistics', adminStatsController.getDashboardStatistics);

module.exports = router;