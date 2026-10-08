import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function adminRewritePlugin(): Plugin {
  return {
    name: 'admin-rewrite-plugin',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();
        const rawPath = req.url.split('?')[0].toLowerCase();
        if (rawPath === '/admin' || rawPath === '/admin/' || rawPath === '/admin.html') {
          req.url = '/pages/admin-dashboard.html';
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [adminRewritePlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about.html'),
          services: path.resolve(__dirname, 'services.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          privacy: path.resolve(__dirname, 'privacy-policy.html'),
          terms: path.resolve(__dirname, 'terms-of-service.html'),
          accessibility: path.resolve(__dirname, 'accessibility.html'),
          login: path.resolve(__dirname, 'pages/login.html'),
          register: path.resolve(__dirname, 'pages/register.html'),
          dashboard: path.resolve(__dirname, 'pages/dashboard.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
          adminHtml: path.resolve(__dirname, 'admin.html'),
          adminLogin: path.resolve(__dirname, 'pages/admin-login.html'),
          adminDashboard: path.resolve(__dirname, 'pages/admin-dashboard.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
