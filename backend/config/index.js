require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiry: '30d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  maxFileSize: 10 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png'],
};

const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

if (config.isProduction && config.corsOrigin === '*') {
  console.warn('⚠️  WARNING: CORS set to allow all origins in production!');
}

module.exports = config;
