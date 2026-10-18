import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function adminRewritePlugin(): Plugin {
  return {
    name: 'admin-rewrite-plugin',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();
        const rawPath = req.url.split('?')[0].toLowerCase();
        if (
          rawPath === '/admin' ||
          rawPath === '/admin/' ||
          rawPath === '/admin.html' ||
          rawPath === '/pages/admin' ||
          rawPath === '/pages/admin/' ||
          rawPath === '/pages/admin.html' ||
          rawPath === '/pages/admin-dashboard'
        ) {
          req.url = '/admin.html';
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  const candidates: Record<string, string> = {
    main: path.resolve(__dirname, 'index.html'),
    about: path.resolve(__dirname, 'pages/about.html'),
    services: path.resolve(__dirname, 'pages/services.html'),
    contact: path.resolve(__dirname, 'pages/contact.html'),
    privacy: path.resolve(__dirname, 'pages/privacy-policy.html'),
    terms: path.resolve(__dirname, 'pages/terms-of-service.html'),
    accessibility: path.resolve(__dirname, 'pages/accessibility.html'),
    login: path.resolve(__dirname, 'pages/login.html'),
    register: path.resolve(__dirname, 'pages/register.html'),
    dashboard: path.resolve(__dirname, 'pages/dashboard.html'),
    admin: path.resolve(__dirname, 'pages/admin.html'),
    adminLogin: path.resolve(__dirname, 'pages/admin-login.html'),
    adminDir: path.resolve(__dirname, 'admin/index.html'),
    adminLoginDir: path.resolve(__dirname, 'admin-login/index.html'),
  };

  const input: Record<string, string> = {};
  for (const [key, filePath] of Object.entries(candidates)) {
    if (fs.existsSync(filePath)) {
      input[key] = filePath;
    }
  }

  return {
    plugins: [adminRewritePlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input,
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
