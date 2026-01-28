import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Прокси для Uzum API
      // Путь передается через query параметр: /api/uzum-proxy?path=/v1/shops
      '/api/uzum-proxy': {
        target: 'https://api-seller.uzum.uz/api/seller-openapi',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => {
          // Берем путь из query параметра
          const url = new URL(path, 'http://localhost');
          const uzumPath = url.searchParams.get('path') || '';
          
          // Формируем новый путь
          return uzumPath;
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
