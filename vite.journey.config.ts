import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Independent entry and no API proxy: this prototype cannot reach the live app.
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 18091, strictPort: true },
  build: {
    outDir: 'dist/journey',
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('./journey.html', import.meta.url)) },
  },
});
