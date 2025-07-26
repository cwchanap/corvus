import { defineConfig } from 'wxt';
import solid from 'vite-plugin-solid';

export default defineConfig({
  vite: () => ({
    plugins: [solid()],
  }),
  manifest: {
    name: 'Extension',
    version: '1.0.0',
    description: 'A browser extension built with WXT and SolidJS',
    permissions: ['activeTab'],
  },
  // Enable src directory for better organization
  srcDir: 'src',
});