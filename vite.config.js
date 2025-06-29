import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.174.131:3000',
        changeOrigin: true,
        rewrite: (path) => {
          console.log('Original path:', path);
          const rewritten = path.replace(/^\/api/, '');
          console.log('Rewritten path:', rewritten);
          return rewritten;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            console.log('Full URL:', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            console.log('Response headers:', proxyRes.headers);
          });
        },
        followRedirects: true,
      }
    }
  }
})
