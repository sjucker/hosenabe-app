import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // Relative asset paths, so the build works wherever the server mounts it
    base: './',
    server: {
        port: 3001
    },
    build: {
        // The server serves client/build
        outDir: 'build'
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/setupTests.js'
    }
});
