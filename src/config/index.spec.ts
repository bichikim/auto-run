import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {defineConfig} from './index.js'

describe('Config Module', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables
    process.env = {...originalEnv}
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('defineConfig', () => {
    it('should return default config when no config provided', () => {
      const config = defineConfig()

      expect(config).toEqual({
        browser: {
          type: 'chromium',
          headless: true,
          viewport: {width: 1920, height: 1080},
          slowMo: 0,
          timeout: 5000,
        },
        actions: {
          waitBetweenActions: 1000,
          retryAttempts: 3,
          screenshotOnError: true,
        },
        logging: {
          level: 'info',
          outputDir: './logs',
          saveScreenshots: true,
          verbose: false,
        },
      })
    })

    it('should merge provided config with defaults', () => {
      const config = defineConfig({
        browser: {
          type: 'firefox',
          headless: false,
          viewport: {width: 1280, height: 720},
          slowMo: 100,
          timeout: 20000,
        },
      })

      expect(config.browser.type).toBe('firefox')
      expect(config.browser.headless).toBe(false)
      expect(config.browser.viewport).toEqual({width: 1280, height: 720})
      expect(config.actions.waitBetweenActions).toBe(1000) // default value
    })

    it('should override config with environment variables', () => {
      process.env.BROWSER_TYPE = 'webkit'
      process.env.HEADLESS = 'false'
      process.env.VIEWPORT_WIDTH = '1600'
      process.env.VIEWPORT_HEIGHT = '900'
      process.env.SLOW_MO = '200'
      process.env.TIMEOUT = '45000'

      const config = defineConfig({
        browser: {
          type: 'chromium',
          headless: true,
          viewport: {width: 1920, height: 1080},
          slowMo: 0,
          timeout: 30000,
        },
      })

      expect(config.browser.type).toBe('webkit')
      expect(config.browser.headless).toBe(false)
      expect(config.browser.viewport).toEqual({width: 1600, height: 900})
      expect(config.browser.slowMo).toBe(200)
      expect(config.browser.timeout).toBe(45000)
    })

    it('should override action config with environment variables', () => {
      process.env.WAIT_BETWEEN_ACTIONS = '2000'
      process.env.RETRY_ATTEMPTS = '5'
      process.env.SCREENSHOT_ON_ERROR = 'false'

      const config = defineConfig()

      expect(config.actions.waitBetweenActions).toBe(2000)
      expect(config.actions.retryAttempts).toBe(5)
      expect(config.actions.screenshotOnError).toBe(false)
    })

    it('should override logging config with environment variables', () => {
      process.env.LOG_LEVEL = 'debug'
      process.env.LOG_OUTPUT_DIR = './custom-logs'
      process.env.SAVE_SCREENSHOTS = 'false'

      const config = defineConfig()

      expect(config.logging.level).toBe('debug')
      expect(config.logging.outputDir).toBe('./custom-logs')
      expect(config.logging.saveScreenshots).toBe(false)
    })

    it('should handle partial config objects', () => {
      const config = defineConfig({
        browser: {
          type: 'firefox',
          headless: true,
          viewport: {width: 1920, height: 1080},
          slowMo: 0,
          timeout: 30000,
        },
      })

      expect(config.browser.type).toBe('firefox')
      expect(config.browser.headless).toBe(true) // default
      expect(config.browser.viewport).toEqual({width: 1920, height: 1080}) // default
    })

    it('should handle boolean environment variables correctly', () => {
      process.env.HEADLESS = 'true'
      process.env.SCREENSHOT_ON_ERROR = 'true'
      process.env.SAVE_SCREENSHOTS = 'true'

      const config = defineConfig()

      expect(config.browser.headless).toBe(true)
      expect(config.actions.screenshotOnError).toBe(true)
      expect(config.logging.saveScreenshots).toBe(true)

      process.env.HEADLESS = 'false'
      process.env.SCREENSHOT_ON_ERROR = 'false'
      process.env.SAVE_SCREENSHOTS = 'false'

      const config2 = defineConfig()

      expect(config2.browser.headless).toBe(false)
      expect(config2.actions.screenshotOnError).toBe(false)
      expect(config2.logging.saveScreenshots).toBe(false)
    })

    it('should prioritize environment variables over config values', () => {
      process.env.BROWSER_TYPE = 'webkit'
      process.env.HEADLESS = 'false'

      const config = defineConfig({
        browser: {
          type: 'chromium',
          headless: true,
          viewport: {width: 1920, height: 1080},
          slowMo: 0,
          timeout: 30000,
        },
      })

      expect(config.browser.type).toBe('webkit') // env override
      expect(config.browser.headless).toBe(false) // env override
      expect(config.browser.viewport).toEqual({width: 1920, height: 1080}) // config value
    })
  })
})
