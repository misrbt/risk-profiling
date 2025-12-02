import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
     tailwindcss(),
  ],
  build: {
    target: 'es2015', // Support Chrome 39+ and IE11
    cssTarget: 'chrome39', // Support Chrome 39 and older
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Libraries
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled', '@headlessui/react', '@heroicons/react'],
          
          // Table and data management
          'table-vendor': ['@tanstack/react-table', 'papaparse'],
          
          // Export and document libraries
          'export-vendor': ['jspdf', 'jspdf-autotable', 'xlsx'],
          
          // Animation and transitions
          'animation-vendor': ['framer-motion', 'react-transition-group'],
          
          // Utilities and smaller libs
          'utils-vendor': ['axios', 'sweetalert2', 'react-icons'],
          
          // Styling
          'style-vendor': ['@fontsource/inter', '@fontsource/roboto', '@radix-ui/react-alert-dialog', '@radix-ui/react-dialog'],
        },
      },
    },
  },
  define: {
    // Remove any node.js globals that might cause issues
    global: 'globalThis',
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false, // Allow port change if 5173 is in use
  }
})
