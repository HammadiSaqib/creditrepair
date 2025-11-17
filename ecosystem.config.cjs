module.exports = {
  apps: [
    {
      name: "scoremachine-api",
      // Run the built server bundle (run `npm run build` first)
      script: "dist/server/production.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        // The server port; Nginx will reverse proxy to this
        PORT: process.env.PORT || 3001,
        // Frontend/API origin for CORS and client builds
        VITE_API_URL: process.env.VITE_API_URL || "http://thescoremachine.com",
        FRONTEND_URL: process.env.FRONTEND_URL || "http://thescoremachine.com",
        CORS_ORIGIN: process.env.CORS_ORIGIN || "http://thescoremachine.com",
        // Database and other secrets should be provided via .env, not committed here
      },
    },
  ],
};