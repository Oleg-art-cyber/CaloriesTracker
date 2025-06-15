// app.js
const express = require('express');
const cors    = require('cors');

// Routers
const authRouter = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const diaryRoutes = require('./routes/diary');
const exerciseRoutes = require('./routes/exercise'); // or './routes/exercises'
const recipeRoutes = require('./routes/recipes');
const physicalActivityRoutes = require('./routes/physicalActivity');
const profileRoutes = require('./routes/profile');
const achievementRoutes = require('./routes/achievements');
const statisticsRoutes = require('./routes/statistics');
const adminStatisticsRoutes = require('./routes/adminStatistics');
const adminUserRoutes = require('./routes/adminUsers');

const app  = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
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

// Root route
app.get('/', (_req, res) => res.json({ message: 'Server is operational.' }));

// Basic error handling
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    res.status(500).json({ error: 'Internal Server Error.' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));