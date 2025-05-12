// server/src/routes/products.js
// Product routes + validation + role/ownership guards

const express   = require('express');
const Joi       = require('joi');
const prodCtrl  = require('../controllers/products');
const auth      = require('../middlewares/auth');
const ownership = require('../middlewares/ownership');

const router = express.Router();

// load and build productSchema (как ты делал)
const db = require('../config/dbSingleton').getConnection();
let allowedCatIds = [], idOther = null;
db.query('SELECT id, name FROM category', (e, rows) => {
    if (e) return console.error(e);
    allowedCatIds = rows.map(r => r.id);
    idOther       = rows.find(r => r.name === 'other')?.id;
});
const productSchema = Joi.object({
    name:        Joi.string().min(2).required(),
    calories:    Joi.number().positive().required(),
    fat:         Joi.number().min(0).required(),
    protein:     Joi.number().min(0).required(),
    carbs:       Joi.number().min(0).required(),
    category_id: Joi.number().valid(...allowedCatIds).default(() => idOther)
});
const validate = schema => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    next();
};

/* GET all products (public or owned) */
router.get(
    '/',
    auth(['user','admin']),
    prodCtrl.getAll
);


/* GET one product (public or owned) */
router.get('/:id', prodCtrl.getOne);

/* POST create product — both user and admin */
router.post(
    '/',
    auth(['user','admin']),
    validate(productSchema),
    prodCtrl.create
);

/* PUT update — only admin or owner */
router.put(
    '/:id',
    auth(['user','admin']),
    ownership,
    validate(productSchema),
    prodCtrl.update
);

/* DELETE remove — only admin or owner */
router.delete(
    '/:id',
    auth(['user','admin']),
    ownership,
    prodCtrl.remove
);

module.exports = router;
