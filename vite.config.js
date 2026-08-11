import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,

    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'Gantt', // global name for iife/umd
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
        if (format === 'iife') return 'frappe-gantt-aggregation.js';
        if (format === 'es') return 'frappe-gantt-aggregation.es.js';
        if (format === 'umd') return 'frappe-gantt-aggregation.umd.js';
        return `frappe-gantt-aggregation.${format}.js`;
      },
    },

    rollupOptions: {
      output: {
        assetFileNames: 'frappe-gantt-aggregation[extname]',
        interop: 'auto',
      },
    },
  },

  server: { watch: { include: ['dist/*', 'src/!*'] } },
});