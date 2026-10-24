import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', include: ['tests/**/*.test.ts'],
    hookTimeout: 180000, testTimeout: 20000, fileParallelism: false,
    env: { FRONTEND_URL: 'http://localhost:5173', MONGOMS_DOWNLOAD_DIR: '/tmp/diario-mongodb-binaries' },
  },
});
