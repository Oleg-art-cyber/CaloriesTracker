// server/src/middlewares/ownership.js
// Allow admin always, otherwise only owner

const db = require('../config/dbSingleton');
const connection = db.getConnection();

module.exports = (req, res, next) => {
    const { id: userId, role } = req.user;

    // admin can do anything
    if (role === 'admin') {
        return next();
    }

    const prodId = Number(req.params.id);

    connection.query(
        'SELECT created_by FROM product WHERE id = ?',
        [prodId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'DB error' });
            }
            if (!rows.length) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // cast both sides to numbers
            const ownerId = Number(rows[0].created_by);
            if (ownerId !== Number(userId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            next();
        }
    );
};
