require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authenticate = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes (register doesn't need auth middleware since it's called right after Firebase signup)
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/register' && req.method === 'POST') {
    return next();
  }
  authenticate(req, res, next);
}, authRoutes);

// Protected routes
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api', authenticate, taskRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 NOVA API server running on http://localhost:${PORT}\n`);
});
