import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],

    server: {
        host: '0.0.0.0',
        port: 5173,
        https: {
            // When running inside the frontend container, certs are mounted to /app/certs
            key: fs.readFileSync(path.resolve(__dirname, './certs/server.key')),
            cert: fs.readFileSync(path.resolve(__dirname, './certs/server.cert')),
        },
        proxy: {
            '/api': {
                // Proxy to the backend service on the Docker network
                target: 'https://backend:3000',
                changeOrigin: true,
                secure: false,
                // Allow websocket upgrade on the /api path so `/api/socket.io` will work
                ws: true,
            },
            '/socket.io': {
                target: 'https://backend:3000', // Use backend service name inside Docker
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        },
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
