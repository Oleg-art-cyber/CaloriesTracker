// server/src/routes/products.js
// Product routes + validation + role/ownership guards

/**
 * Product Routes
 * Handles CRUD operations for food products, including validation and access control.
 * All routes require authentication. Some routes require ownership or admin privileges.
 *
 * Endpoints:
 *   GET    /api/products         - List all public or owned products
 *   GET    /api/products/:id     - Get a single product by ID
 *   POST   /api/products         - Create a new product (user or admin)
 *   PUT    /api/products/:id     - Update a product (admin or owner)
 *   DELETE /api/products/:id     - Delete a product (admin or owner)
 */

const express   = require('express');
const Joi       = require('joi');
const prodCtrl  = require('../controllers/products');
const auth      = require('../middlewares/auth');
const ownership = require('../middlewares/ownership');

const router = express.Router();

// Load and build productSchema for validation
// Allowed category IDs are loaded from the database at startup
const db = require('../config/dbSingleton').getConnection();
let allowedCatIds = [], idOther = null;
db.query('SELECT id, name FROM category', (e, rows) => {
    if (e) return console.error(e);
    allowedCatIds = rows.map(r => r.id);
    idOther       = rows.find(r => r.name === 'other')?.id;
});

/**
 * Joi schema for product validation
 * Ensures required fields and valid category
 */
const productSchema = Joi.object({
    name:        Joi.string().min(2).required(),
    calories:    Joi.number().positive().required(),
    fat:         Joi.number().min(0).required(),
    protein:     Joi.number().min(0).required(),
    carbs:       Joi.number().min(0).required(),
    category_id: Joi.number().valid(...allowedCatIds).default(() => idOther)
});

/**
 * Middleware for validating request body against a Joi schema
 */
const validate = schema => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    next();
};

/**
 * GET /api/products
 * Returns all public products and those owned by the authenticated user.
 * Requires authentication (user or admin).
 */
router.get(
    '/',
    auth(['user','admin']),
    prodCtrl.getAll
);

/**
 * GET /api/products/:id
 * Returns a single product by ID (public or owned).
 * No authentication required for this endpoint.
 */
router.get('/:id', prodCtrl.getOne);

/**
 * POST /api/products
 * Creates a new product. Only authenticated users or admins can create products.
 * Validates request body using productSchema.
 */
router.post(
    '/',
    auth(['user','admin']),
    validate(productSchema),
    prodCtrl.create
);

/**
 * PUT /api/products/:id
 * Updates an existing product. Only the owner or an admin can update.
 * Validates request body using productSchema.
 */
router.put(
    '/:id',
    auth(['user','admin']),
    ownership,
    validate(productSchema),
    prodCtrl.update
);

/**
 * DELETE /api/products/:id
 * Deletes a product. Only the owner or an admin can delete.
 */
router.delete(
    '/:id',
    auth(['user','admin']),
    ownership,
    prodCtrl.remove
);

module.exports = router;
