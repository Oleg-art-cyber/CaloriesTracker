// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5173, // Or your client's port
        proxy: {
            '/api': {
                target: 'http://localhost:3001', // Your backend server
                changeOrigin: true, // Recommended for most setups
                // secure: false, // Uncomment if your backend uses HTTPS with a self-signed certificate
            },
        },
    },
});