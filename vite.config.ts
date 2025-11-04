import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/

const devAllowedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'Freddies-MacBook-Pro.local', 'freddies-macbook-pro.local'];

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {

  const devServer = {
    open: true,
    allowedHosts: devAllowedHosts,
  }

  const server = command === 'serve' ? devServer : {
    open: true
  };

  console.log('command', command);
  console.log('mode', mode);
  console.log('isSsrBuild', isSsrBuild);
  console.log('isPreview', isPreview);
  console.log('server', server);

  return {

    plugins: [react()],
    server: server,
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});
