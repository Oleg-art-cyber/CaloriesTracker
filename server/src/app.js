/**
 * Main application entry point for the Calories Tracker API server
 * Sets up Express application with middleware and routes
 */
const express = require('express');
const cors    = require('cors');

// Import route handlers
const authRouter = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const diaryRoutes = require('./routes/diary');
const exerciseRoutes = require('./routes/exercise');
const recipeRoutes = require('./routes/recipes');
const physicalActivityRoutes = require('./routes/physicalActivity');
const profileRoutes = require('./routes/profile');
const achievementRoutes = require('./routes/achievements');
const statisticsRoutes = require('./routes/statistics');
const adminStatisticsRoutes = require('./routes/adminStatistics');
const adminUserRoutes = require('./routes/adminUsers');
const userRoutes = require('./routes/users');

// Initialize Express application
const app  = express();
const PORT = process.env.PORT || 3001;

// Configure middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Register API routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/physical-activity', physicalActivityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminStatisticsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/', (_req, res) => res.json({ message: 'Server is operational.' }));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    res.status(500).json({ error: 'Internal Server Error.' });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));