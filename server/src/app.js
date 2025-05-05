const express = require('express');
const cors    = require('cors');
const productsRouter = require('./routes/products');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ message: 'Server is working!' }));
app.use('/api/products', productsRouter);


app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
