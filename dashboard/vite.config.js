import { defineConfig } from 'vite';

export default defineConfig({
  server: { allowedHosts: ['.app.github.dev'] },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // This is a client-only app; MUI's server-component hints do not apply.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
        warn(warning);
      },
    },
  },
});
