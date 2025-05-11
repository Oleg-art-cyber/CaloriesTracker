// server/src/routes/products.js
// Product routes + basic validation + role-based auth

const express  = require('express');
const Joi      = require('joi');
const prodCtrl = require('../controllers/products');
const auth     = require('../middlewares/auth');           // JWT/role guard

const router = express.Router();

/* ----- validation schemas ----- */
const productSchema = Joi.object({
    name:     Joi.string().min(2).required(),
    calories: Joi.number().positive().required(),
    fat:      Joi.number().min(0).required(),
    protein:  Joi.number().min(0).required(),
    carbs:    Joi.number().min(0).required(),
    category: Joi.string().allow(null, '')
});

/* helper to wrap Joi validation */
const validate = schema => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    next();
};

/* ---------- ROUTES ---------- */

// GET /api/products                  – all products (public)
router.get('/', prodCtrl.getAll);

// GET /api/products/:id              – single product (public)
router.get('/:id', prodCtrl.getOne);

// POST /api/products                 – create (admin only)
router.post(
    '/',
    auth(['admin']),                   // <- role check
    validate(productSchema),           // <- body validation
    prodCtrl.create
);

// PUT /api/products/:id              – update (admin only)
router.put(
    '/:id',
    auth(['admin']),
    validate(productSchema),
    prodCtrl.update
);

// DELETE /api/products/:id           – delete (admin only)
router.delete(
    '/:id',
    auth(['admin']),
    prodCtrl.remove
);

module.exports = router;
