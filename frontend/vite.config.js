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
            key: fs.readFileSync(path.resolve(__dirname, '../certs/server.key')),
            cert: fs.readFileSync(path.resolve(__dirname, '../certs/server.cert')),
        },
        proxy: {
            '/api': {
                target: 'https://backend:3000',
                changeOrigin: true,
                secure: false,
            },
            '/socket.io': {
                target: 'wss://backend:3000',
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
