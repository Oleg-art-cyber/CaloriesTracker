// app.js
const express = require('express');
const cors = require('cors');
const db = require('./dbSingleton');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connection = db.getConnection();

app.get('/', (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM product';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error with adding product:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(results);
    });
});

app.post('/api/products', (req, res) => {
    const { name, calories, fat, protein, carbs, category } = req.body;

    if (!name || !calories || !fat || !protein || !carbs) {
        return res.status(400).json({ error: 'Some fields are missing' });
    }

    const query = `
        INSERT INTO product (name, calories, fat, protein, carbs, category)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(query, [name, calories, fat, protein, carbs, category || null], (err, result) => {
        if (err) {
            console.error('Error with adding: ', err);
            return res.status(500).json({ error: 'Adding error' });
        }
        res.status(201).json({
            id: result.insertId,
            name,
            calories,
            fat,
            protein,
            carbs,
            category: category || null
        });
    });
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
