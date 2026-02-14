require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { initializeFirebase } = require('./config/firebase');
const authRoutes = require('./routes/auth');
const boxRoutes = require('./routes/boxes');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/auditLogs');

// Initialize Firebase Admin SDK
initializeFirebase();

const app = express();
const PORT = process.env.PORT || 8080;

// ---------------------
// Middleware
// ---------------------

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('combined'));

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// CORS - allow frontend origins
const ALLOWED_ORIGINS = [
  'https://morganstech.org',
  'https://www.morganstech.org',
  'https://morgang213.github.io',
  'http://localhost:3000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ---------------------
// Routes
// ---------------------
app.use('/api/auth', authRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------
// Start server
// ---------------------
app.listen(PORT, () => {
  console.log(`JCAS-NARCOS API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
