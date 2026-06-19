import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import ApiResponse from './utils/ApiResponse.js';
import authRoutes from './routes/v1/auth.routes.js';
import storeRoutes from './routes/v1/store.routes.js';
import categoryRoutes from './routes/v1/category.routes.js';
import productRoutes from './routes/v1/product.routes.js';

// ============================================
// CREATE EXPRESS APP
// ============================================
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet sets secure HTTP headers (prevents common attacks)
app.use(helmet());

// CORS — Allow requests from our dashboard and storefront
app.use(
  cors({
    origin: [
      env.CLIENT_URL,        // merchant dashboard (localhost:5173)
      env.STOREFRONT_URL,    // storefront (localhost:3000)
    ],
    credentials: true,       // Allow cookies (needed for refresh tokens)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Slug'],
  })
);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Morgan logs every request to the console in development
// Example: GET /api/v1/products 200 45ms
if (env.isDevelopment) {
  app.use(morgan('dev'));
}

// Parse incoming JSON request bodies
// limit: '10mb' allows product images to be sent as base64 (for now)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies (needed for refresh token in httpOnly cookie)
app.use(cookieParser());

// ============================================
// HEALTH CHECK ROUTE
// ============================================
// This route is public — no auth needed
// Use it to verify the server is running

app.get('/', (req, res) => {
  res.json(
    ApiResponse.success('🚀 Aurion Commerce API is running', {
      name: env.PLATFORM_NAME,
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  );
});

app.get('/health', (req, res) => {
  res.json(
    ApiResponse.success('✅ Server is healthy', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    })
  );
});

// ============================================
// API ROUTES
// ============================================

// Mount route modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);

// API info endpoint
app.get('/api/v1', (req, res) => {
  res.json(
    ApiResponse.success('Aurion Commerce API v1', {
      endpoints: {
        auth: '/api/v1/auth',
        stores: '/api/v1/stores',
        products: '/api/v1/products',
        orders: '/api/v1/orders',
        customers: '/api/v1/customers',
        analytics: '/api/v1/analytics',
        storefront: '/api/v1/storefront/:storeSlug',
      },
    })
  );
});


// ============================================
// 404 HANDLER
// ============================================
// If no route matches, return a clean 404 error
app.use((req, res) => {
  res.status(404).json(
    ApiResponse.error(
      `Route ${req.method} ${req.originalUrl} not found`,
      'ROUTE_NOT_FOUND'
    )
  );
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
// This catches ALL errors thrown anywhere in the app
// Must have 4 parameters (err, req, res, next) to work as error handler

app.use((err, req, res, next) => {
  // Log error details in development
  if (env.isDevelopment) {
    console.error('❌ Error:', err);
  }

  // If it's one of our custom ApiError instances
  if (err.isOperational) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errorCode, err.details)
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json(
      ApiResponse.error('Validation failed', 'VALIDATION_ERROR', details)
    );
  }

  // Mongoose duplicate key error (e.g., email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json(
      ApiResponse.error(
        `${field} already exists`,
        'DUPLICATE_KEY',
        { field, value: err.keyValue[field] }
      )
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(
      ApiResponse.error(
        `Invalid ${err.path}: ${err.value}`,
        'INVALID_ID'
      )
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      ApiResponse.error('Invalid token', 'INVALID_TOKEN')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      ApiResponse.error('Token expired', 'TOKEN_EXPIRED')
    );
  }

  // Unknown/unexpected errors
  // Do not leak internal error details in production
  return res.status(500).json(
    ApiResponse.error(
      env.isProduction
        ? 'Internal server error'
        : err.message || 'Internal server error',
      'INTERNAL_ERROR'
    )
  );
});

export default app;