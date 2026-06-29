import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    //target: "es2020", // Nimm es raus, wenn Kompatibilität mit älteren Browsern gebraucht wird.
    sourcemap: true,
    minify: false,

    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'Gantt', // global name for iife/umd
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
        if (format === 'iife') return 'frappe-gantt.js';
        if (format === 'es') return 'frappe-gantt.es.js';
        if (format === 'umd') return 'frappe-gantt.umd.js';
        return `frappe-gantt.${format}.js`;
      },
    },

    rollupOptions: {
      output: {
        assetFileNames: 'frappe-gantt[extname]',
        interop: 'auto',
      },
    },
  },

  server: { watch: { include: ['dist/*', 'src/!*'] } },
});