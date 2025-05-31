// server/routes/profile.js
const router = require('express').Router();
const profileController = require('../controllers/profile'); // Adjust path
const authMiddleware = require('../middlewares/auth');    // Adjust path

// All routes in this file require authentication
router.use(authMiddleware(['user', 'admin'])); // Or just authMiddleware() if no role check needed here

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
// router.post('/change-password', profileController.changePassword); // For future password change

module.exports = router;