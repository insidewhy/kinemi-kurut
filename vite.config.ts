import hotReloadExtension from 'hot-reload-extension-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'src/service-worker.ts'),
      },
      output: {
        format: 'cjs',
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [
    checker({
      typescript: true,
      eslint: { lintCommand: 'eslint "*.ts" "src/*.ts"' },
    }),
    hotReloadExtension({
      log: true,
      backgroundPath: 'src/service-worker',
    }),
  ],
})
