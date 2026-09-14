import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  // Externalized environment configuration with fallback defaults
  const phpApiUrl = env.PHP_API_URL || process.env.PHP_API_URL || 'https://srisumanamahapiriwena-lk.us.stackstaging.com';
  const port = parseInt(env.PORT || process.env.PORT || '3000', 10);
  const host = env.HOST || process.env.HOST || '0.0.0.0';
  const basePath = env.VITE_BASE_PATH || env.BASE_URL || (mode === 'production' ? './' : '/');

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || ''),
      'process.env.GEMINI_MODEL': JSON.stringify(env.VITE_GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-2.5-flash'),
      'process.env.OPENROUTER_MODEL': JSON.stringify(env.VITE_OPENROUTER_MODEL || env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'),
      'process.env.PRIMARY_PROVIDER': JSON.stringify(env.VITE_PRIMARY_PROVIDER || env.PRIMARY_PROVIDER || 'gemini'),
      'process.env.FALLBACK_PROVIDER': JSON.stringify(env.VITE_FALLBACK_PROVIDER || env.FALLBACK_PROVIDER || 'openrouter'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
            }
          },
        },
      },
    },
    optimizeDeps: {
      entries: ['index.html', 'src/**/*.{ts,tsx}'],
    },
    server: {
      host,
      port,
      strictPort: true,
      hmr: false,
      watch: {
        usePolling: true,
        ignored: ['**/android/**', '**/dist/**'],
      },
      proxy: {
        '/api': {
          target: phpApiUrl,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: phpApiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
