// server/src/controllers/products.js
// Product CRUD controller with user ownership, public flag, search + pagination

const Joi = require('joi');
const db  = require('../config/dbSingleton');
const connection = db.getConnection();

/* ───────────────────────────────────────────
   Load category IDs once at startup
─────────────────────────────────────────── */
let allowedIds = [];
let idOther    = null;

connection.query('SELECT id, name FROM category', (err, rows) => {
    if (err) {
        console.error('Failed to load categories:', err);
        process.exit(1);
    }
    allowedIds = rows.map(r => r.id);
    idOther    = rows.find(r => r.name === 'other')?.id || null;
});

/* ───────────────────────────────────────────
   Joi schema for product body
─────────────────────────────────────────── */
const productSchema = Joi.object({
    name:        Joi.string().min(2).required(),
    calories:    Joi.number().positive().required(),
    fat:         Joi.number().min(0).required(),
    protein:     Joi.number().min(0).required(),
    carbs:       Joi.number().min(0).required(),
    category_id: Joi.number().valid(...allowedIds).default(() => idOther)
});

function validateBody(req, res) {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return null;
    }
    return value;
}

/* ───────────────────────────────────────────
   GET /api/products  (search + pagination)
─────────────────────────────────────────── */
exports.getAll = (req, res) => {
    const userId  = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const q      = req.query.q     ?? '';
    const page   = Math.max(+req.query.page  || 1, 1);
    const limit  = Math.max(+req.query.limit || 10, 1);
    const offset = (page - 1) * limit;

    const baseWhere = isAdmin
        ? 'WHERE p.name LIKE ?'
        : 'WHERE (p.is_public = 1 OR p.created_by = ?) AND p.name LIKE ?';

    const whereParams = isAdmin
        ? [`%${q}%`]
        : [userId, `%${q}%`];

    /* count total */
    const countSQL = `SELECT COUNT(*) AS total FROM product p ${baseWhere}`;
    connection.query(countSQL, whereParams, (err, cRows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        const total = cRows[0].total;

        /* page slice */
        const dataSQL = `
      SELECT p.*, c.name AS category
      FROM product p
      LEFT JOIN category c ON c.id = p.category_id
      ${baseWhere}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?`;
        connection.query(
            dataSQL,
            [...whereParams, limit, offset],
            (err2, rows) => {
                if (err2) return res.status(500).json({ error: 'DB error' });
                res.json({ data: rows, total, page, limit });
            }
        );
    });
};

/* ───────────────────────────────────────────
   GET /api/products/:id
─────────────────────────────────────────── */
exports.getOne = (req, res) => {
    const userId  = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let sql = `
        SELECT p.*, c.name AS category
        FROM product p
                 LEFT JOIN category c ON c.id = p.category_id
        WHERE p.id = ?`;
    const params = [req.params.id];

    if (!isAdmin) {
        sql += ' AND (p.is_public = 1 OR p.created_by = ?)';
        params.push(userId);
    }

    connection.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!rows.length) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    });
};

/* ───────────────────────────────────────────
   POST /api/products
─────────────────────────────────────────── */
exports.create = (req, res) => {
    const body = validateBody(req, res);
    if (!body) return;

    const createdBy = req.user.id;
    const isPublic  = req.user.role === 'admin' ? 1 : 0;

    const { name, calories, fat, protein, carbs, category_id } = body;
    const sql = `
        INSERT INTO product
        (name, calories, fat, protein, carbs, category_id, created_by, is_public)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category_id, createdBy, isPublic],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Insert error' });
            res.status(201).json({
                id: result.insertId,
                ...body,
                created_by: createdBy,
                is_public : isPublic
            });
        }
    );
};

/* ───────────────────────────────────────────
   PUT /api/products/:id
─────────────────────────────────────────── */
exports.update = (req, res) => {
    const body = validateBody(req, res);
    if (!body) return;

    const { id } = req.params;
    const { name, calories, fat, protein, carbs, category_id } = body;

    const sql = `
        UPDATE product
        SET name=?, calories=?, fat=?, protein=?, carbs=?, category_id=?
        WHERE id = ?`;
    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category_id, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Update error' });
            if (!result.affectedRows)
                return res.status(404).json({ error: 'Product not found' });
            res.json({ id: +id, ...body });
        }
    );
};

/* ───────────────────────────────────────────
   DELETE /api/products/:id
─────────────────────────────────────────── */
exports.remove = (req, res) => {
    connection.query(
        'DELETE FROM product WHERE id = ?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Delete error' });
            if (!result.affectedRows)
                return res.status(404).json({ error: 'Product not found' });
            res.json({ message: `Product ${req.params.id} deleted` });
        }
    );
};
