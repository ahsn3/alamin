// Configuration file for API base URL
// This allows easy switching between local and production backends

// For local development: Leave empty or use window.location.origin
// For production: Set to your Railway backend URL
// Example: window.API_BASE_URL = 'https://alamin-production.railway.app';

// You can also set this via Netlify environment variables
// In Netlify: Site settings → Environment variables → Add: API_BASE_URL

// Check if we're on Netlify and use environment variable if available
if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com')) {
    // For Netlify, you can inject this via a build script or use the redirects in netlify.toml
    // The netlify.toml redirects will handle API calls automatically
    // But for Socket.io, we need to set the URL explicitly
    // Uncomment and set your Railway URL:
    // window.API_BASE_URL = 'https://your-app.railway.app';
}

// For local development with separate backend
// Uncomment and set your local backend URL:
// window.API_BASE_URL = 'http://localhost:3000';

