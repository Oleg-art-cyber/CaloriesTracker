// server/routes/physicalActivity.js
const router = require('express').Router();
const activityCtl = require('../controllers/physicalActivity'); // Adjust path to your controller
const authMiddleware = require('../middlewares/auth'); // Adjust path to your auth middleware

// Apply auth middleware to all routes in this file
router.use(authMiddleware(['user', 'admin']));

router.post('/', activityCtl.logActivity);
router.delete('/:activityId', activityCtl.deleteActivity);
// router.put('/:activityId', activityCtl.updateActivity); // If you implement update

module.exports = router;