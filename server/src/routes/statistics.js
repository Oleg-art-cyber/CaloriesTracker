// server/routes/statistics.js
const router = require('express').Router();
const statisticsController = require('../controllers/statistics');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware(['user', 'admin']));

router.get('/calories-trend', statisticsController.getCalorieTrend);
router.get('/period-summary', statisticsController.getPeriodSummary);
router.get('/macronutrient-distribution', statisticsController.getMacronutrientDistribution);
router.get('/weight-trend', statisticsController.getWeightTrend);

module.exports = router;