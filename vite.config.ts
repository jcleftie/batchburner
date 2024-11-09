/* eslint-env node */
import { defineConfig } from 'viteburner';
import { resolve } from 'path';


export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '/src': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, 'src/dt1batch/types.d.ts'),
      '@utils': resolve(__dirname, 'src/dt1batch/utils.ts'),
      '@types4': resolve(__dirname, 'src/4batch/types.d.ts'),
      '@utils4': resolve(__dirname, 'src/4batch/utils.ts'),
      '@earlytypes': resolve(__dirname, 'src/reset/types.d.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
  },
  viteburner: {
    watch: [{ pattern: 'src/**/*.{js,ts}', transform: true }, { pattern: 'src/**/*.{script,txt}' }],
    sourcemap: 'inline',
  },
});
