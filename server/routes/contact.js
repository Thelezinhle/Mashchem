/**
 * Contact API Routes
 * 
 * Endpoints for contact form submissions:
 * - POST /api/contact - Submit contact form
 * - GET /api/contact/submissions - Get all submissions (admin)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Path to contact submissions file
const SUBMISSIONS_FILE = path.join(__dirname, '..', 'data', 'contact-submissions.json');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ensure data directory exists
 */
async function ensureDataDirectory() {
    const dataDir = path.dirname(SUBMISSIONS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

/**
 * Read contact submissions from file
 */
async function getSubmissions() {
    try {
        await ensureDataDirectory();
        const data = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error reading submissions file:', error);
        return [];
    }
}

/**
 * Save contact submissions to file
 */
async function saveSubmissions(submissions) {
    try {
        await ensureDataDirectory();
        await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 4), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing submissions file:', error);
        return false;
    }
}

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/contact
 * Submit a contact form
 */
router.post('/',
    [
        body('firstName')
            .trim()
            .notEmpty().withMessage('First name is required')
            .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
        body('lastName')
            .trim()
            .notEmpty().withMessage('Last name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('phone')
            .optional()
            .trim()
            .matches(/^[+]?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),
        body('subject')
            .trim()
            .notEmpty().withMessage('Subject is required')
            .isIn(['general', 'products', 'orders', 'support', 'partnership'])
            .withMessage('Invalid subject selected'),
        body('message')
            .trim()
            .notEmpty().withMessage('Message is required')
            .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const submissions = await getSubmissions();
            
            // Create new submission
            const newSubmission = {
                id: uuidv4(),
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: req.body.phone || null,
                subject: req.body.subject,
                message: req.body.message,
                status: 'pending',
                createdAt: new Date().toISOString(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            };
            
            submissions.push(newSubmission);
            const saved = await saveSubmissions(submissions);
            
            if (!saved) {
                throw new Error('Failed to save submission');
            }
            
            // Log submission for development
            console.log('New contact submission:', {
                id: newSubmission.id,
                name: `${newSubmission.firstName} ${newSubmission.lastName}`,
                email: newSubmission.email,
                subject: newSubmission.subject
            });
            
            res.status(201).json({
                success: true,
                message: 'Thank you for your message! We will get back to you soon.',
                data: {
                    id: newSubmission.id,
                    submittedAt: newSubmission.createdAt
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/contact/submissions
 * Get all contact submissions (admin endpoint)
 */
router.get('/submissions', async (req, res, next) => {
    try {
        const submissions = await getSubmissions();
        
        // Filter by status if provided
        let filteredSubmissions = submissions;
        const { status, sort } = req.query;
        
        if (status) {
            filteredSubmissions = filteredSubmissions.filter(s => s.status === status);
        }
        
        // Sort by date (newest first by default)
        if (sort === 'oldest') {
            filteredSubmissions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
            filteredSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        res.json({
            success: true,
            count: filteredSubmissions.length,
            data: filteredSubmissions
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/contact/submissions/:id
 * Update submission status
 */
router.patch('/submissions/:id',
    body('status')
        .isIn(['pending', 'read', 'responded', 'archived'])
        .withMessage('Invalid status'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const submissions = await getSubmissions();
            const index = submissions.findIndex(s => s.id === req.params.id);
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Submission not found'
                });
            }
            
            submissions[index] = {
                ...submissions[index],
                status: req.body.status,
                updatedAt: new Date().toISOString()
            };
            
            await saveSubmissions(submissions);
            
            res.json({
                success: true,
                message: 'Submission updated successfully',
                data: submissions[index]
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/contact/submissions/:id
 * Delete a submission
 */
router.delete('/submissions/:id', async (req, res, next) => {
    try {
        const submissions = await getSubmissions();
        const index = submissions.findIndex(s => s.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }
        
        const deleted = submissions.splice(index, 1)[0];
        await saveSubmissions(submissions);
        
        res.json({
            success: true,
            message: 'Submission deleted successfully',
            data: deleted
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
