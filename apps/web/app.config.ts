import { defineConfig } from '@solidjs/start/config';

export default defineConfig({
  server: {
    preset: 'node-server',
  },
  vite: {
    css: {
      postcss: './postcss.config.js',
    },
  },
});