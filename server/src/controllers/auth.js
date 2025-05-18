const bcrypt = require('bcrypt')
const jwt    = require('jsonwebtoken')
const Joi    = require('joi')
const db     = require('../config/dbSingleton').getConnection()

// Validate exactly the fields your form sends:
const regSchema = Joi.object({
    name:     Joi.string().min(2).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    weight:   Joi.number().positive().required(),
    height:   Joi.number().positive().required(),
    age:      Joi.number().min(1).required(),
    goal:     Joi.string().valid('lose','gain','maintain').required()
})

async function register(req, res) {
    // 1) validate input
    const { error, value } = regSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.message })

    const { name, email, password, weight, height, age, goal } = value
    const hash = await bcrypt.hash(password, 10)

    // 2) insert user
    const sql = `
        INSERT INTO user
            (name, email, password, weight, height, age, goal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    db.query(sql,
        [name, email, hash, weight, height, age, goal],
        (err, result) => {
            if (err && err.code === 'ER_DUP_ENTRY')
                return res.status(409).json({ error: 'Email already exists' })
            if (err)
                return res.status(500).json({ error: 'Database error' })

            // 3) generate JWT (fallback to a hardcoded secret if env var missing)
            const userId = result.insertId
            const secret = process.env.JWT_SECRET || 'supersecret'
            const token  = jwt.sign(
                { id: userId, role: 'user' },
                secret,
                { expiresIn: '7d' }
            )

            // 4) return token + user
            res.status(201).json({
                token,
                user: { id: userId, name, email, weight, height, age, goal, role: 'user' }
            })
        }
    )
}

async function login(req, res) {
    const { email, password } = req.body
    db.query('SELECT * FROM user WHERE email = ?', [email], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' })
        if (!rows.length) return res.status(401).json({ error: 'No such user' })

        const user = rows[0]
        if (!bcrypt.compareSync(password, user.password))
            return res.status(401).json({ error: 'Invalid password' })

        // sign JWT with same fallback secret
        const secret = process.env.JWT_SECRET || 'supersecret'
        const token  = jwt.sign(
            { id: user.id, role: user.role },
            secret,
            { expiresIn: '7d' }
        )
        res.json({ token })
    })
}

module.exports = { register, login }
