// server/src/routes/auth.js
const express = require('express');
const ctrl    = require('../controllers/auth');

const router = express.Router();

// POST /api/auth/register  → ctrl.register
router.post('/register', ctrl.register);

// POST /api/auth/login     → ctrl.login
router.post('/login',    ctrl.login);

module.exports = router;
