/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and returns consistent JSON responses.
 * In production, stack traces are hidden for security.
 */

const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    if (err.name === 'SyntaxError' && err.body) {
        statusCode = 400;
        message = 'Invalid JSON in request body';
    }

    if (err.code === 'ENOENT') {
        statusCode = 404;
        message = 'Resource not found';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.details
        })
    });
};

module.exports = errorHandler;
