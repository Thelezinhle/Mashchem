# Maschem - Professional Cleaning Products

A modern web application for Maschem, a company specializing in professional cleaning products and chemicals for commercial and household use.

## Project Overview

Maschem is a South African company that manufactures powerful, affordable, and safe cleaning solutions. This web application showcases their product catalog and provides a way for customers to get in touch.

## Features

### Frontend
- Responsive single-page application (SPA)
- Bootstrap 5 for modern UI components
- Font Awesome icons
- Interactive navigation with smooth transitions
- Home page with hero section and feature highlights
- Product catalog with category filtering
- About page with company information and animated statistics
- Contact form with validation

### Backend
- Node.js with Express.js framework
- RESTful API design
- Security middleware (Helmet, CORS, Rate Limiting)
- Request validation with express-validator
- Error handling middleware
- JSON file-based data storage
- API endpoints for products and contact form

## Tech Stack

### Frontend
- HTML5
- CSS3 (Custom Styling)
- JavaScript (ES6 Modules)
- Bootstrap 5.3.3
- Font Awesome 6.4.0

### Backend
- Node.js 18+
- Express.js 4.18
- Helmet (Security Headers)
- CORS (Cross-Origin Resource Sharing)
- Morgan (HTTP Request Logging)
- express-validator (Input Validation)
- express-rate-limit (Rate Limiting)
- UUID (Unique ID Generation)

## Project Structure

```
Mashchem/
├── index.html              # Main HTML entry point
├── main.js                 # Main JavaScript entry point
├── products.json           # Product data
├── Navbar.js / .css        # Navigation component
├── Home.js / .css          # Home page component
├── Product.js / .css       # Products page component
├── About.js / .css         # About page component
├── Contact.js / .css       # Contact page component
├── Images/                 # Image assets
│   ├── Background1.jpg
│   ├── Maschem-logo.png
│   └── image-folder/
└── server/                 # Backend application
    ├── package.json        # Node.js dependencies
    ├── server.js           # Express server entry point
    ├── .env.example        # Environment variables template
    ├── routes/
    │   ├── products.js     # Products API routes
    │   └── contact.js      # Contact form API routes
    ├── middleware/
    │   └── errorHandler.js # Error handling middleware
    └── data/               # Data storage (auto-created)
```

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm (Node Package Manager)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/Mashchem.git
cd Mashchem
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Products API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products/:id | Get product by ID |
| GET | /api/products/categories | Get all categories |
| GET | /api/products/category/:name | Get products by category |
| POST | /api/products | Create new product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |

### Contact API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/contact | Submit contact form |
| GET | /api/contact/submissions | Get all submissions |
| PATCH | /api/contact/submissions/:id | Update submission status |
| DELETE | /api/contact/submissions/:id | Delete submission |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server health status |

## Query Parameters

### Products Filtering
- `category` - Filter by category name
- `search` - Search in name and description
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sort` - Sort options: `price_asc`, `price_desc`, `name_asc`, `name_desc`

Example:
```
GET /api/products?category=Cleaning%20Chemicals&sort=price_asc
```

## Security Features

- Helmet.js for secure HTTP headers
- CORS protection with configurable origins
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- Error messages without sensitive information in production

## Product Categories

- Cleaning Chemicals
- Dyes and Fragrances
- Sanitizers
- Bathroom Care
- Laundry Care

## Development

### Running Frontend Only
You can open `index.html` directly in a browser or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve
```

### Running with Backend
The backend serves the frontend files automatically when running on port 3000.

## Contact Information

- Location: 123 Industrial Avenue, Johannesburg, South Africa
- Phone: +27 11 123 4567
- Email: info@maschem.co.za
- Business Hours: Mon-Fri 8:00 AM - 5:00 PM, Sat 9:00 AM - 1:00 PM

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
