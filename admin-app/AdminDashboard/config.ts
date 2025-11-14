// API Configuration
// Set this to true for production, false for local development
const IS_PRODUCTION = true;

// Production URL
const PRODUCTION_URL = 'https://mobilesecurity.onrender.com';

// Local development URL (update this with your local IP)
const LOCAL_URL = 'http://192.168.0.106:3000';

// Export the API URL based on environment
export const API_URL = IS_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

// Export the flag for reference
export const isProduction = IS_PRODUCTION;
