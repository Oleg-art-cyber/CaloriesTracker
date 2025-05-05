const db = require('../config/dbSingleton');
const connection = db.getConnection();

// GET /api/products
exports.getAll = (req, res) => {
    connection.query('SELECT * FROM product', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(rows);
    });
};

// POST /api/products
exports.create = (req, res) => {
    const { name, calories, fat, protein, carbs, category = null } = req.body;
    if (!name || !calories || !fat || !protein || !carbs)
        return res.status(400).json({ error: 'Some fields are missing' });

    const sql = `INSERT INTO product (name, calories, fat, protein, carbs, category)
               VALUES (?, ?, ?, ?, ?, ?)`;
    connection.query(sql,
        [name, calories, fat, protein, carbs, category],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Adding error' });
            res.status(201).json({ id: result.insertId, name, calories, fat, protein, carbs, category });
        });
};

// PUT /api/products/:id
exports.update = (req, res) => {
    const { id } = req.params;
    const { name, calories, fat, protein, carbs, category = null } = req.body;

    if (!name || !calories || !fat || !protein || !carbs)
        return res.status(400).json({ error: 'Some fields are missing' });

    const sql = `UPDATE product
               SET name = ?, calories = ?, fat = ?, protein = ?, carbs = ?, category = ?
               WHERE id = ?`;
    connection.query(
        sql,
        [name, calories, fat, protein, carbs, category, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Update error' });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: 'Product not found' });
            res.json({ id: +id, name, calories, fat, protein, carbs, category });
        }
    );
};

// DELETE /api/products/:id
exports.remove = (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM product WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Delete error' });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Product not found' });
        res.json({ message: `Product ${id} deleted` });
    });
};