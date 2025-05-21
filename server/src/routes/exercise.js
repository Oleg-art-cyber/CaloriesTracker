// server/routes/exercise.js
const router = require('express').Router();
const exerciseCtl = require('../controllers/exercise'); // Adjust path
const authMiddleware = require('../middlewares/auth'); // Adjust path to your auth middleware

// Apply auth middleware to all routes in this file, allowing 'user' and 'admin' roles
router.use(authMiddleware(['user', 'admin'])); // Ensure this matches your auth middleware signature

router.get('/', exerciseCtl.getAllExercises);
router.post('/', exerciseCtl.createExercise);
router.put('/:id', exerciseCtl.updateExercise);
router.delete('/:id', exerciseCtl.deleteExercise);

module.exports = router;