/**
 * Maschem Backend API Server
 * 
 * A modern Node.js/Express server with best practices:
 * - Security middleware (Helmet, CORS, Rate Limiting)
 * - Request validation
 * - Error handling
 * - Logging
 * - RESTful API design
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Server configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for development
    crossOriginEmbedderPolicy: false
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// =============================================================================
// GENERAL MIDDLEWARE
// =============================================================================

// Request logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Maschem API is running',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0'
    });
});

// Products API
app.use('/api/products', productRoutes);

// Contact API
app.use('/api/contact', contactRoutes);

// =============================================================================
// FRONTEND ROUTING
// =============================================================================

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Global error handler
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('  MASCHEM BACKEND SERVER');
    console.log('='.repeat(50));
    console.log(`  Environment: ${NODE_ENV}`);
    console.log(`  Server running on port: ${PORT}`);
    console.log(`  Local: http://localhost:${PORT}`);
    console.log(`  API Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
