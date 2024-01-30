/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    name: 'Editable Grid Pkg - Tests',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    mockReset: true, // Reset all mocks before each test
    coverage: {
      provider: 'istanbul', // or 'c8',
      reporter: ['text', 'json', 'html', 'cobertura'] // can add more/less
    },
    reporters: ['junit', 'json', 'default'],
    outputFile: { junit: 'testResults/junit.xml', json: 'testResults/results.json' }
  },
  server: {
    open: true
  },
  plugins: [
    
    dts({ insertTypesEntry: true }),
    viteStaticCopy({
      targets: [
        {
          src: 'package.json',
          dest: './'
        },
        {
          src: 'README.md',
          dest: './'
        }
      ]
    })
  ],
  build: {
    minify: true,
    manifest: true,
    reportCompressedSize: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/libs/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
