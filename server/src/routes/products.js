// server/src/routes/products.js
const express   = require('express');
const prodCtrl  = require('../controllers/products');

const router = express.Router();

// GET /api/products
router.get('/',  prodCtrl.getAll);

// POST /api/products
router.post('/', prodCtrl.create);

// PUT /api/products/:id
router.put('/:id',    prodCtrl.update);

// DELETE /api/products/:id
router.delete('/:id', prodCtrl.remove);

module.exports = router;
