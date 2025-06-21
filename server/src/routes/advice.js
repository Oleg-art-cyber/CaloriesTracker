const express = require('express');
const router = express.Router();
const adviceController = require('../controllers/advice');

router.post('/', adviceController.getAdvice);

module.exports = router; 