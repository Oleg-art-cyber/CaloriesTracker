// server/src/routes/auth.js
const express           = require('express')
const { register, login } = require('../controllers/auth')
const router            = express.Router()

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/login
router.post('/login', login)

module.exports = router

