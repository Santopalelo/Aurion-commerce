import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (4 levels up from this file)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// List of required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

// Validate that all required variables are set
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file at the project root.\n');
  process.exit(1);
}

// Export validated env variables for easy access
export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_URL: process.env.API_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  STOREFRONT_URL: process.env.STOREFRONT_URL,

  // Deployed dashboard / storefront origins. Used for the CORS allow-list
  // and for the CSRF origin check on cookie-authenticated routes.
  PRODUCTION_DASHBOARD_URL: process.env.PRODUCTION_DASHBOARD_URL,
  PRODUCTION_STOREFRONT_URL: process.env.PRODUCTION_STOREFRONT_URL,
  PRODUCTION_ADMIN_URL: process.env.PRODUCTION_ADMIN_URL,

  // Development origins. The Vite apps run on fixed ports, so the defaults
  // below cover a local checkout with no extra configuration.
  ADMIN_URL: process.env.ADMIN_URL,

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_CUSTOMER_SECRET: process.env.JWT_CUSTOMER_SECRET || process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  PLATFORM_NAME: process.env.PLATFORM_NAME || 'Aurion Commerce',
  PLATFORM_URL: process.env.PLATFORM_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,

    // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // ============================================
  // RATE LIMITS
  // ============================================
  // The defaults are the production values. They are configurable so a
  // merchant behind a shared NAT (an office, a mobile carrier) is not locked
  // out of checkout, and so the verification scripts can exercise the
  // checkout paths without tripping the limiter.
  RATE_LIMIT_PAYMENT_MAX: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX, 10) || 10,
  RATE_LIMIT_PAYMENT_WINDOW_MS:
    parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW_MS, 10) || 60 * 1000,
  RATE_LIMIT_STOREFRONT_MAX:
    parseInt(process.env.RATE_LIMIT_STOREFRONT_MAX, 10) || 120,
};

export default env;