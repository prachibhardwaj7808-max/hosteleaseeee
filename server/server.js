const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { initDb, get } = require('./db/database');
const seed = require('./db/seed');
const authRoutes = require('./routes/auth.routes');
const roomsRoutes = require('./routes/rooms.routes');
const requestsRoutes = require('./routes/requests.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const studentsRoutes = require('./routes/students.routes');
const statsRoutes = require('./routes/stats.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend Vite dev server or production host
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationsRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'HostelEase API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 Not Found Handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Express server after initializing database
const startServer = async () => {
  try {
    await initDb();

    // Auto-seed demo data if the database is empty (e.g. fresh Render deployment)
    const existingUser = await get('SELECT id FROM users LIMIT 1');
    if (!existingUser) {
      console.log('Empty database detected — running demo data seed...');
      await seed();
      console.log('Auto-seed complete. Demo accounts are ready.');
    } else {
      console.log('Database already has data — skipping auto-seed.');
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` HostelEase Backend Server running on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize database and start server:', err);
    process.exit(1);
  }
};

startServer();
