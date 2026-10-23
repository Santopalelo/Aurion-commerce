import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { isCorsOriginAllowed } from './config/origins.js';
import ApiResponse from './utils/ApiResponse.js';

// ============================================
// IMPORT ROUTES
// ============================================
import authRoutes from './routes/v1/auth.routes.js';
import storeRoutes from './routes/v1/store.routes.js';
import categoryRoutes from './routes/v1/category.routes.js';
import productRoutes from './routes/v1/product.routes.js';
import orderRoutes from './routes/v1/order.routes.js';
import customerRoutes from './routes/v1/customer.routes.js';
import discountRoutes from './routes/v1/discount.routes.js';
import adminRoutes from './routes/v1/admin.routes.js';
import storefrontRoutes from './routes/storefront/sf.routes.js';
import storefrontPaymentRoutes from './routes/storefront/sf.payment.routes.js';
import storefrontOrderRoutes from './routes/storefront/sf.order.routes.js';
import storefrontCustomerRoutes from './routes/storefront/sf.customer.routes.js';
import stripeWebhookRoutes from './routes/webhooks/stripe.webhook.routes.js';

// ============================================
// CREATE EXPRESS APP
// ============================================
const app = express();
app.set('trust proxy', 1);


// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet());

// ============================================
// CORS Configuration (Dev + Production)
// ============================================
// The origin lists live in `config/origins.js` so the CORS allow-list and
// the CSRF origin check (middleware/csrf.middleware.js) can never drift
// apart. Note the difference:
//   - CORS   allows any *.vercel.app preview deployment
//   - CSRF   only allows the explicit TRUSTED_ORIGINS list
// because the refresh cookie is SameSite=None and must not be handed to
// arbitrary preview deployments.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isCorsOriginAllowed(origin)) {
        return callback(null, true);
      }
      console.warn(`❌ CORS blocked: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Slug', 'X-Store-Id'],
  })
);

// ============================================
// GENERAL MIDDLEWARE
// ============================================
if (env.isDevelopment) {
  app.use(morgan('dev'));
}

// ============================================
// WEBHOOKS — MOUNTED BEFORE THE JSON PARSER
// ============================================
// Stripe signs the exact bytes it sent, so we need the RAW body to verify
// the signature. If express.json() runs first, the raw bytes are gone and
// verification is impossible. This must stay above app.use(express.json()).
app.use('/api/v1/webhooks', stripeWebhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// HEALTH CHECK ROUTES
// ============================================
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/discounts', discountRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/storefront', storefrontRoutes);
app.use('/api/v1/storefront', storefrontPaymentRoutes);
app.use('/api/v1/storefront', storefrontOrderRoutes);
app.use('/api/v1/storefront', storefrontCustomerRoutes);

// API info endpoint
app.get('/api/v1', (req, res) => {
  res.json(
    ApiResponse.success('Aurion Commerce API v1', {
      endpoints: {
        auth: '/api/v1/auth',
        stores: '/api/v1/stores',
        products: '/api/v1/products',
        categories: '/api/v1/categories',
        storefront: '/api/v1/storefront/:storeSlug',
        orders: '/api/v1/orders',
        customers: '/api/v1/customers',
        analytics: '/api/v1/analytics',
        webhooks: '/api/v1/webhooks/stripe',
      },
    })
  );
});

// ============================================
// 404 HANDLER
// ============================================
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
app.use((err, req, res, next) => {
  if (env.isDevelopment) {
    console.error('❌ Error:', err);
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errorCode, err.details)
    );
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json(
      ApiResponse.error('Validation failed', 'VALIDATION_ERROR', details)
    );
  }

  if (err.code === 11000) {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0] || 'field';
    return res.status(409).json(
      ApiResponse.error(
        `${field} already exists`,
        'DUPLICATE_KEY',
        { field, value: keyValue[field] }
      )
    );
  }

  if (err.name === 'CastError') {
    return res.status(400).json(
      ApiResponse.error(
        `Invalid ${err.path}: ${err.value}`,
        'INVALID_ID'
      )
    );
  }

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

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json(
      ApiResponse.error('Origin not allowed', 'CORS_ERROR')
    );
  }

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