import {defineConfig} from './src/config/index.ts'

export default defineConfig({
  // Browser configuration
  browser: {
    type: 'chromium',
    headless: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
    slowMo: 0,
    timeout: 30000,
  },

  // Action configuration
  actions: {
    waitBetweenActions: 1000,
    retryAttempts: 3,
    screenshotOnError: true,
  },

  // Logging configuration
  logging: {
    level: 'info',
    outputDir: './logs',
    saveScreenshots: true,
  },
})
