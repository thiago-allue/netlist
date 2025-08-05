// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward any request that starts with /api to the FastAPI backend
      '/api': 'http://localhost:8000',
    },
  },
});

