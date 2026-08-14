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
        if (format === 'iife') return 'riel-gantt.js';
        if (format === 'es') return 'riel-gantt.es.js';
        if (format === 'umd') return 'riel-gantt.umd.js';
        return `riel-gantt.${format}.js`;
      },
    },

    rollupOptions: {
      output: {
        assetFileNames: 'riel-gantt[extname]',
        interop: 'auto',
      },
    },
  },

  server: { watch: { include: ['dist/*', 'src/!*'] } },
});