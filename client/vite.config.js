import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const __dirname = path.resolve()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Node.js polyfills for browser compatibility
      "buffer": "buffer",
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
      "assert": "assert",
      "http": "stream-http",
      "https": "https-browserify",
      "os": "os-browserify",
      "url": "url",
      "zlib": "browserify-zlib",
      "path": "path-browserify",
      "util": "util"
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true,
    'Buffer': ['buffer', 'Buffer']
  },
  optimizeDeps: {
    include: [
      'buffer',
      'crypto-browserify',
      'stream-browserify',
      'assert',
      'stream-http',
      'https-browserify', 
      'os-browserify',
      'url',
      'browserify-zlib',
      'path-browserify',
      'util',
      '@bnb-chain/greenfield-js-sdk'
    ]
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: true,
    port: 5173
  }
})