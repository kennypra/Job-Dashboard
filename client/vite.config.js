import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api to the local Express server so the client never needs to
// know the server's port/host in code — see server/src/index.js for PORT.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
