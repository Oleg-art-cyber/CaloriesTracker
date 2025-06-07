// server/routes/achievements.js
const router = require('express').Router();
const achievementController = require('../controllers/achievements'); // Adjust path if necessary
const authMiddleware = require('../middlewares/auth');    // Adjust path if necessary

router.use(authMiddleware(['user', 'admin']));

router.get('/', achievementController.getAllAchievementsForUser);

module.exports = router;