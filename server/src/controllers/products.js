/* Products controller — CRUD functions */

const Joi        = require('joi');
const db         = require('../config/dbSingleton');
const connection = db.getConnection();

/* ---------- Joi schema for POST / PUT ---------- */
const productSchema = Joi.object({
    name:     Joi.string().min(2).required(),
    calories: Joi.number().positive().required(),
    fat:      Joi.number().min(0).required(),
    protein:  Joi.number().min(0).required(),
    carbs:    Joi.number().min(0).required(),
    category: Joi.string().allow(null, ''),           // optional
});

/* helper: validate body against schema */
function validateBody(req, res, schema) {
    const { error, value } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return null;
    }
    return value; // validated and sanitized
}

/* ---------- GET /api/products ---------- */
exports.getAll = (_req, res) => {
    connection.query('SELECT * FROM product', (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.status(200).json(rows);
    });
};

/* ---------- GET /api/products/:id ---------- */
exports.getOne = (req, res) => {
    connection.query(
        'SELECT * FROM product WHERE id = ?',
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            if (!rows.length)
                return res.status(404).json({ error: 'Product not found' });
            res.status(200).json(rows[0]);
        }
    );
};

/* ---------- POST /api/products ---------- */
exports.create = (req, res) => {
    const body = validateBody(req, res, productSchema);
    if (!body) return;

    const { name, calories, fat, protein, carbs, category = null } = body;

    const sql = `
    INSERT INTO product (name, calories, fat, protein, carbs, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Insert error' });

            res.status(201).json({
                id: result.insertId,
                name,
                calories,
                fat,
                protein,
                carbs,
                category,
            });
        }
    );
};

/* ---------- PUT /api/products/:id ---------- */
exports.update = (req, res) => {
    const body = validateBody(req, res, productSchema);
    if (!body) return;

    const { id } = req.params;
    const { name, calories, fat, protein, carbs, category = null } = body;

    const sql = `
    UPDATE product
    SET name = ?, calories = ?, fat = ?, protein = ?, carbs = ?, category = ?
    WHERE id = ?
  `;

    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Update error' });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: 'Product not found' });

            res.status(200).json({
                id: +id,
                name,
                calories,
                fat,
                protein,
                carbs,
                category,
            });
        }
    );
};

/* ---------- DELETE /api/products/:id ---------- */
exports.remove = (req, res) => {
    const { id } = req.params;

    connection.query(
        'DELETE FROM product WHERE id = ?', [id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Delete error' });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: 'Product not found' });

            res.status(200).json({ message: `Product ${id} deleted` });
        }
    );
};
