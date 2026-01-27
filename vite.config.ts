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
        rewrite: (path) => path.replace(/^\/api\/uzum-proxy/, '/api/seller-openapi'),
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
