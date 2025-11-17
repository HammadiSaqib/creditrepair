import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Bind to IPv4 to ensure external access over public IP on VPS
    host: "0.0.0.0",
    port: 3001,
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Use return so the configuration is async
      return createServer()
        .then(({ app, httpServer, websocketService }) => {
          // Add the express app as middleware before Vite's internal middleware
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith("/api")) {
              console.log("Proxying API request:", req.url, req.method);
              // Cast the req and res objects to any to avoid type mismatch between Node's IncomingMessage and Express's Request
              return app(req as any, res as any, next);
            } else {
              next();
            }
          });
          
          // Attach WebSocket service to Vite's HTTP server
          if (server.httpServer && websocketService) {
            // Get the Socket.IO instance from websocketService and attach it to Vite's server
            const io = websocketService.socketIO;
            if (io) {
              // Add custom error handling for Socket.IO
              io.engine.on('connection_error', (err) => {
                console.error('Socket.IO connection error:', err);
              });
              
              // Add global error handler for Socket.IO
              io.on('error', (err) => {
                console.error('Socket.IO error:', err);
              });
              
              // Add parser error handling
              io.on('connect_error', (err) => {
                console.error('Socket.IO connect error (possibly JSON parsing):', err);
              });
              
              // Allow dev connections from local and optional env-defined origin
              const devOrigins = [
                'http://localhost:3001',
                'http://localhost:3000',
                'http://localhost:5173'
              ];
              if (process.env.CORS_ORIGIN) {
                // Support comma-separated list
                const extra = process.env.CORS_ORIGIN.includes(',')
                  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                  : [process.env.CORS_ORIGIN];
                devOrigins.push(...extra);
              }

              if (process.env.FRONTEND_URL) {
                devOrigins.push(process.env.FRONTEND_URL);
              }

              io.attach(server.httpServer, {
                cors: {
                  origin: devOrigins,
                  methods: ['GET', 'POST'],
                  credentials: true
                },
                transports: ['websocket', 'polling'],
                connectTimeout: 30000,
                pingTimeout: 60000,
                pingInterval: 25000
              });
              console.log('🔌 WebSocket service attached to Vite dev server');
            }
          }
          
          console.log('🔌 WebSocket service initialized in development mode');
        })
        .catch((error) => {
          console.error("Failed to create Express server:", error);
        });
    },
  };
}
