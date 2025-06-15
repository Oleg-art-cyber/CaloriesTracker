// server/routes/diary.js
const router     = require('express').Router();
const diaryCtl   = require('../controllers/diary');
const auth       = require('../middlewares/auth'); // Adjust path if necessary

router.use(auth(['user', 'admin'])); // JWT guard for all diary routes

router.get('/', diaryCtl.getDay);
router.post('/:type', diaryCtl.saveMeal); // :type is 'breakfast', 'lunch', etc.

// Updated routes to target specific MealProduct entries by their ID
router.patch('/item/:mealProductId', diaryCtl.updateMealItem);
router.delete('/item/:mealProductId', diaryCtl.removeMealItem);

module.exports = router;
