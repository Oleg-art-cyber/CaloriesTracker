// server/src/controllers/auth.js
// Handles user registration and login

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const Joi    = require('joi');
const db     = require('../config/dbSingleton').getConnection();

// ---------- validation schema ----------
const regSchema = Joi.object({
    name:     Joi.string().min(2).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    weight:   Joi.number().positive().required(),
    height:   Joi.number().positive().required(),
    age:      Joi.number().min(1).required(),
    goal:     Joi.string().valid('lose', 'gain', 'maintain').required()
});

// ---------- POST /api/auth/register ----------
exports.register = (req, res) => {
    const { error, value } = regSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { name, email, password, weight, height, age, goal } = value;
    const hash = bcrypt.hashSync(password, 10);

    const sql = `INSERT INTO user
               (name, email, password, weight, height, age, goal)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql,
        [name, email, hash, weight, height, age, goal],
        (err, result) => {
            if (err && err.code === 'ER_DUP_ENTRY')
                return res.status(409).json({ error: 'Email already exists' });
            if (err)
                return res.status(500).json({ error: 'DB error' });

            res.status(201).json({ id: result.insertId, name, email });
        });
};

// ---------- POST /api/auth/login ----------
exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM user WHERE email = ?', [email], (err, rows) => {
        if (err)  return res.status(500).json({ error: 'DB error' });
        if (!rows.length)
            return res.status(401).json({ error: 'No such user' });

        const user = rows[0];
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch)
            return res.status(401).json({ error: 'Bad password' });

        // create JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            'supersecret',               // TODO: move to .env later
            { expiresIn: '7d' }
        );
        res.json({ token });
    });
};
