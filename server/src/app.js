// app.js
const express = require('express');
const cors    = require('cors');

// Routers
const authRouter = require('./routes/auth');
const categoryRoutes = require('./routes/categories'); // Renamed from catRoutes for clarity
const productRoutes = require('./routes/products');
const diaryRoutes = require('./routes/diary');
const exerciseRoutes = require('./routes/exercise'); // Ensure this path is correct; might be './routes/exercises'
const recipeRoutes = require('./routes/recipes');   // New router for recipes

const app  = express();
const PORT = process.env.PORT || 3001;

// Core Middlewares
app.use(cors()); // Apply CORS to all incoming requests
app.use(express.json()); // Parse JSON request bodies

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/recipes', recipeRoutes); // Mount recipe routes

// Root/Health Check Route
app.get('/', (_req, res) => res.json({ message: 'Server is operational.' }));

// Optional: Basic global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));