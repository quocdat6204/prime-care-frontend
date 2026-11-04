import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const fePort = Number(env.VITE_PORT) || 5173;
  const backendPort = env.VITE_BACKEND_PORT || '9000';
  const backendTarget = env.VITE_BACKEND_URL || `http://localhost:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      port: fePort,
      host: true,
      proxy: {
        '/authenticate': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/users': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/clinic': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/internal': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/emails': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/chatbot': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
