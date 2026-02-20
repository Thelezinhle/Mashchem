/**
 * Products API Routes
 * 
 * RESTful endpoints for product management:
 * - GET /api/products - Get all products
 * - GET /api/products/:id - Get single product
 * - GET /api/products/category/:category - Get products by category
 * - POST /api/products - Create new product (admin)
 * - PUT /api/products/:id - Update product (admin)
 * - DELETE /api/products/:id - Delete product (admin)
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

// Path to products data file
const PRODUCTS_FILE = path.join(__dirname, '..', '..', 'products.json');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Read products from JSON file
 */
async function getProductsData() {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products file:', error);
        return [];
    }
}

/**
 * Write products to JSON file
 */
async function saveProductsData(products) {
    try {
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 4), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing products file:', error);
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
 * GET /api/products
 * Get all products with optional filtering and pagination
 */
router.get('/', async (req, res, next) => {
    try {
        let products = await getProductsData();
        
        // Filter by category if provided
        const { category, search, minPrice, maxPrice, sort } = req.query;
        
        if (category) {
            products = products.filter(p => 
                p.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (search) {
            const searchTerm = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        if (minPrice) {
            products = products.filter(p => p.price >= parseFloat(minPrice));
        }
        
        if (maxPrice) {
            products = products.filter(p => p.price <= parseFloat(maxPrice));
        }
        
        // Sorting
        if (sort) {
            switch (sort) {
                case 'price_asc':
                    products.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    products.sort((a, b) => b.price - a.price);
                    break;
                case 'name_asc':
                    products.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name_desc':
                    products.sort((a, b) => b.name.localeCompare(a.name));
                    break;
            }
        }
        
        // Get unique categories for filtering
        const allProducts = await getProductsData();
        const categories = [...new Set(allProducts.map(p => p.category))];
        
        res.json({
            success: true,
            count: products.length,
            categories,
            data: products
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/categories
 * Get all unique product categories
 */
router.get('/categories', async (req, res, next) => {
    try {
        const products = await getProductsData();
        const categories = [...new Set(products.map(p => p.category))];
        
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id',
    param('id').isNumeric().withMessage('Product ID must be a number'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const products = await getProductsData();
            const product = products.find(p => p.id === parseInt(req.params.id));
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/products/category/:category
 * Get products by category name
 */
router.get('/category/:category', async (req, res, next) => {
    try {
        const products = await getProductsData();
        const categoryProducts = products.filter(p =>
            p.category.toLowerCase().replace(/\s+/g, '-') === 
            req.params.category.toLowerCase().replace(/\s+/g, '-')
        );
        
        res.json({
            success: true,
            count: categoryProducts.length,
            category: req.params.category,
            data: categoryProducts
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/',
    [
        body('name').trim().notEmpty().withMessage('Product name is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('category').trim().notEmpty().withMessage('Category is required'),
        body('packaging').trim().notEmpty().withMessage('Packaging is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const products = await getProductsData();
            
            // Generate new ID
            const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
            
            const newProduct = {
                id: maxId + 1,
                name: req.body.name,
                image: req.body.image || 'Images/Maschem-dish-deluxe.png',
                description: req.body.description,
                packaging: req.body.packaging,
                category: req.body.category,
                price: parseFloat(req.body.price),
                createdAt: new Date().toISOString()
            };
            
            products.push(newProduct);
            await saveProductsData(products);
            
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: newProduct
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/products/:id
 * Update an existing product
 */
router.put('/:id',
    [
        param('id').isNumeric().withMessage('Product ID must be a number'),
        body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const products = await getProductsData();
            const index = products.findIndex(p => p.id === parseInt(req.params.id));
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            
            // Update product fields
            const updatedProduct = {
                ...products[index],
                ...req.body,
                id: products[index].id, // Prevent ID change
                updatedAt: new Date().toISOString()
            };
            
            products[index] = updatedProduct;
            await saveProductsData(products);
            
            res.json({
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/products/:id
 * Delete a product
 */
router.delete('/:id',
    param('id').isNumeric().withMessage('Product ID must be a number'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const products = await getProductsData();
            const index = products.findIndex(p => p.id === parseInt(req.params.id));
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            
            const deletedProduct = products.splice(index, 1)[0];
            await saveProductsData(products);
            
            res.json({
                success: true,
                message: 'Product deleted successfully',
                data: deletedProduct
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
