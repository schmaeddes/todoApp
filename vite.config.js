import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isElectronBuild = Boolean(process.env.ELECTRON);

function removeCrossoriginForElectron() {
  return {
    name: 'remove-crossorigin-for-electron',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), isElectronBuild && removeCrossoriginForElectron()].filter(
    Boolean,
  ),
  base: isElectronBuild ? './' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
