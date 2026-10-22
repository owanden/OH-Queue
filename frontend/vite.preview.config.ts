import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./preview', import.meta.url)),
  base: './',
  plugins: [react(), {
    name: 'preview-isolation',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        for (const id of Object.keys(output.modules)) {
          if (/\/src\/api\.tsx?$|\/axios\//.test(id.replaceAll('\\', '/'))) {
            this.error('Browser preview includes a network API module: ' + id);
          }
        }
      }
    },
  }],
  resolve: {
    alias: [{ find: /^\.\.?\/api$/, replacement: fileURLToPath(new URL('./preview/api.ts', import.meta.url)) }],
  },
  build: { outDir: '../dist-preview', emptyOutDir: true },
});
