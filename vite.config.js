import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps every asset reference relative, so the same build works
// whether it is served from a repository sub-path or from a domain root.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // the backgrounds are already compressed pngs; re-compressing them in the
    // bundle only costs build time and quality
    assetsInlineLimit: 0
  }
});
