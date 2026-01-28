import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Прокси для Uzum API
      '/api/uzum-proxy': {
        target: 'https://api-seller.uzum.uz',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Читаем целевой path из заголовка
            const uzumPath = req.headers['x-uzum-path'] || '';
            // Меняем путь запроса на целевой Uzum API endpoint
            proxyReq.path = `/api/seller-openapi${uzumPath}`;
            
            // Пробрасываем Authorization без изменений
            if (req.headers['authorization']) {
              proxyReq.setHeader('Authorization', req.headers['authorization']);
            }
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - разделяем крупные библиотеки
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Увеличиваем лимит для основного чанка
  },
})
