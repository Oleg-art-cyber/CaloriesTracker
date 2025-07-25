/**
 * Authentication Controller
 * Handles user registration and login functionality
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/dbSingleton').getConnection();
const { getCalculatedCalorieDetails } = require('../utils/calorieCalculator');

/**
 * Validation schema for user registration
 * Ensures all required fields are present and valid
 */
const regSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    // Password must be at least 6 characters, contain at least one letter and one digit
    password: Joi.string()
        .min(6)
        .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
        .required()
        .messages({
            'string.pattern.base': 'Password must contain at least one letter and one number.'
        }),
    weight: Joi.number().positive().required(),
    height: Joi.number().positive().required(),
    age: Joi.number().min(1).required(),
    goal: Joi.string().valid('lose', 'gain', 'maintain').required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    activity_level: Joi.string().valid('sedentary', 'light', 'moderate', 'active', 'very_active').required()
});

/**
 * Registers a new user in the system
 * @param {Object} req - Express request object containing user registration data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with JWT token and user data on success
 * 
 * Process:
 * 1. Validates input data against schema
 * 2. Hashes password for secure storage
 * 3. Stores user data in database
 * 4. Generates JWT token for authentication
 * 5. Returns token and user data
 */
async function register(req, res) {
    const { error, value } = regSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { name, email, password, weight, height, age, goal, gender, activity_level } = value;
    const hash = await bcrypt.hash(password, 10);

    // Calculate BMR, TDEE, and target calories
    const calorieDetails = getCalculatedCalorieDetails({
        weight,
        height,
        age,
        gender,
        activity_level,
        goal,
        bmr_formula: 'mifflin_st_jeor', // default formula for registration
        body_fat_percentage: null
    });
    const bmr = calorieDetails.bmr;
    const calculated_tdee = calorieDetails.tdee;
    const calculated_target_calories = calorieDetails.targetCalories;

    const sql = `
        INSERT INTO user
            (name, email, password, weight, height, age, goal, gender, activity_level, bmr, calculated_tdee, calculated_target_calories)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, email, hash, weight, height, age, goal, gender, activity_level, bmr, calculated_tdee, calculated_target_calories], (err, result) => {
        if (err && err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Email already exists' });
        if (err)
            return res.status(500).json({ error: 'Database error' });

        const userId = result.insertId;
        const secret = process.env.JWT_SECRET || 'supersecret';
        const token = jwt.sign(
            { id: userId, role: 'user' },
            secret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: userId, name, email, weight, height, age, goal, gender, activity_level, bmr, calculated_tdee, calculated_target_calories, role: 'user' }
        });
    });
}

/**
 * Authenticates an existing user
 * @param {Object} req - Express request object containing login credentials
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with JWT token on successful authentication
 * 
 * Process:
 * 1. Retrieves user by email
 * 2. Verifies password against stored hash
 * 3. Generates JWT token for authenticated session
 * 4. Returns token for client-side storage
 */
async function login(req, res) {
    const { email, password } = req.body;

    db.query('SELECT * FROM user WHERE email = ?', [email], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(401).json({ error: 'No such user' });

        const user = rows[0];
        if (!bcrypt.compareSync(password, user.password))
            return res.status(401).json({ error: 'Invalid password' });

        const secret = process.env.JWT_SECRET || 'supersecret';
        const token = jwt.sign(
            { id: user.id, role: user.role },
            secret,
            { expiresIn: '7d' }
        );

        res.json({ token });
    });
}

module.exports = { register, login };
