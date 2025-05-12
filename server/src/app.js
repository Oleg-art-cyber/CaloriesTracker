const express = require('express');
const cors    = require('cors');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const catRoutes = require('./routes/categories');

const app  = express();
const PORT = 3001;

app.use('/api/categories', catRoutes);
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ message: 'Server is working!' }));
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter)

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
