/**
 * Authentication Routes
 * Handles user registration and login endpoints
 * Provides JWT-based authentication functionality
 */
const express = require('express')
const { register, login } = require('../controllers/auth')
const router = express.Router()

/**
 * Register a new user
 * POST /api/auth/register
 * 
 * Request body:
 * - email: User's email address
 * - password: User's password
 * - name: User's full name
 * 
 * Response:
 * - 201: User created successfully
 * - 400: Invalid input data
 * - 409: Email already exists
 */
router.post('/register', register)

/**
 * Authenticate user and generate JWT token
 * POST /api/auth/login
 * 
 * Request body:
 * - email: User's email address
 * - password: User's password
 * 
 * Response:
 * - 200: Login successful, returns JWT token
 * - 401: Invalid credentials
 * - 400: Invalid input data
 */
router.post('/login', login)

module.exports = router

