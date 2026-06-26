const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const charityRoutes = require('./routes/charities');
const scoreRoutes = require('./routes/scores');
const drawRoutes = require('./routes/draws');
const winnerRoutes = require('./routes/winners');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json());

// Serve static uploaded screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date() });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/winners', winnerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Digital Heroes server running on port ${PORT}`);
  console.log(`📂 Proof uploads path: ${path.join(__dirname, 'uploads')}`);
});

module.exports = app;
