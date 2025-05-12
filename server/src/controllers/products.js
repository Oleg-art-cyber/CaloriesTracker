// server/src/controllers/products.js
// Product CRUD controller (MySQL / category_id FK)

const Joi = require('joi');
const db  = require('../config/dbSingleton');
const connection = db.getConnection();

/* -----------------------------------------------------------
   Load category IDs once at startup
----------------------------------------------------------- */
let allowedIds = [];
let idOther    = null;

connection.query('SELECT id, name FROM category', (err, rows) => {
    if (err) {
        console.error('Failed to load categories:', err);
        process.exit(1);
    }
    allowedIds = rows.map(r => r.id);
    idOther    = rows.find(r => r.name === 'other')?.id;
});

/* -----------------------------------------------------------
   Joi schema
----------------------------------------------------------- */
const productSchema = Joi.object({
    name:     Joi.string().min(2).required(),
    calories: Joi.number().positive().required(),
    fat:      Joi.number().min(0).required(),
    protein:  Joi.number().min(0).required(),
    carbs:    Joi.number().min(0).required(),
    category_id: Joi.number()
        .valid(...allowedIds)
        .default(() => idOther)
});

/* Validate request body */
function validateBody(req, res) {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return null;
    }
    return value;
}

/* -----------------------------------------------------------
   GET /api/products
----------------------------------------------------------- */
exports.getAll = (_req, res) => {
    const sql = `
    SELECT p.*, c.label AS category
    FROM product p
    LEFT JOIN category c ON c.id = p.category_id
    ORDER BY p.id DESC
  `;
    connection.query(sql, (err, rows) =>
        err
            ? res.status(500).json({ error: 'DB error' })
            : res.status(200).json(rows)
    );
};

/* GET /api/products/:id */
exports.getOne = (req, res) => {
    const sql = `
    SELECT p.*, c.label AS category
    FROM product p
    LEFT JOIN category c ON c.id = p.category_id
    WHERE p.id = ?
  `;
    connection.query(sql, [req.params.id], (err, rows) => {
        if (err)   return res.status(500).json({ error: 'DB error' });
        if (!rows.length)
            return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(rows[0]);
    });
};

/* -----------------------------------------------------------
   POST /api/products
----------------------------------------------------------- */
exports.create = (req, res) => {
    const body = validateBody(req, res);
    if (!body) return;

    const { name, calories, fat, protein, carbs, category_id } = body;
    const sql = `
        INSERT INTO product (name, calories, fat, protein, carbs, category_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Insert error' });
            res.status(201).json({ id: result.insertId, ...body });
        }
    );
};

/* -----------------------------------------------------------
   PUT /api/products/:id
----------------------------------------------------------- */
exports.update = (req, res) => {
    const body = validateBody(req, res);
    if (!body) return;

    const { id } = req.params;
    const { name, calories, fat, protein, carbs, category_id } = body;
    const sql = `
        UPDATE product
        SET name = ?, calories = ?, fat = ?, protein = ?, carbs = ?, category_id = ?
        WHERE id = ?
    `;
    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category_id, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Update error' });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: 'Product not found' });
            res.status(200).json({ id: +id, ...body });
        }
    );
};

/* -----------------------------------------------------------
   DELETE /api/products/:id
----------------------------------------------------------- */
exports.remove = (req, res) => {
    connection.query(
        'DELETE FROM product WHERE id = ?', [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Delete error' });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: 'Product not found' });
            res.status(200).json({ message: `Product ${req.params.id} deleted` });
        }
    );
};
