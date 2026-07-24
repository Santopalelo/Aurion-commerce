// Load environment variables FIRST before anything else
import './config/env.js';
import './config/cloudinary.js';
import './config/stripe.js';

import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

// ============================================
// START THE SERVER
// ============================================

const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB first
    console.log('\n🔄 Connecting to MongoDB...');
    await connectDB();

    // Step 2: Start the Express server
    const PORT = process.env.PORT || env.PORT;
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log('\n==========================================');
      console.log(`🚀 ${env.PLATFORM_NAME} API is running!`);
      console.log('==========================================');
      console.log(`📡 Environment : ${env.NODE_ENV}`);
      console.log(`🌐 API URL     : ${env.API_URL}`);
      console.log(`🖥️  Dashboard   : ${env.CLIENT_URL}`);
      console.log(`🏪 Storefront  : ${env.STOREFRONT_URL}`);
      console.log('==========================================\n');
    });

    // ============================================
    // GRACEFUL SHUTDOWN
    // ============================================
    // Handle unexpected shutdowns cleanly

    // Unhandled promise rejections (e.g., database query fails)
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err.message);
      console.log('🛑 Shutting down server...');
      server.close(() => {
        process.exit(1);
      });
    });

    // Uncaught exceptions (e.g., syntax error in code)
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err.message);
      console.log('🛑 Shutting down server...');
      server.close(() => {
        process.exit(1);
      });
    });

    // SIGTERM signal (e.g., Heroku, Railway, Docker shutting down)
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start everything
startServer();