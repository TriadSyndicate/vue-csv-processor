import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VueCsvProcessor',
      fileName: (format) => `vue-csv-processor.${format}.js`,
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: ['vue'],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {
          vue: 'Vue',
        },
        // Preserve module structure
        preserveModules: false,
      },
    },
    // Generate sourcemaps
    sourcemap: true,
    // Minify output
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});