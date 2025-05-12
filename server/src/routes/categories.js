// server/src/routes/categories.js
const express = require('express');
const db      = require('../config/dbSingleton').getConnection();
const router  = express.Router();

router.get('/', (_req,res) => {
    db.query('SELECT id, name, label FROM category ORDER BY id', (e,rows)=>
        e ? res.status(500).json({error:'DB'}) : res.json(rows)
    );
});

module.exports = router;
