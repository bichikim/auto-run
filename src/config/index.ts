export interface BrowserConfig {
  type: 'chromium' | 'firefox' | 'webkit'
  headless: boolean
  viewport: {
    width: number
    height: number
  }
  slowMo: number
  timeout: number
}

export interface ActionConfig {
  waitBetweenActions: number
  retryAttempts: number
  screenshotOnError: boolean
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  outputDir: string
  saveScreenshots: boolean
  verbose: boolean
}

export interface AutoConfig {
  browser: BrowserConfig
  actions: ActionConfig
  logging: LoggingConfig
}

// Default configuration values
const defaultConfig: AutoConfig = {
  browser: {
    type: 'chromium',
    headless: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
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
}

export function defineConfig(config: Partial<AutoConfig> = {}): AutoConfig {
  // Merge default config with provided config
  const mergedConfig: AutoConfig = {
    browser: {
      ...defaultConfig.browser,
      ...config.browser,
      viewport: {
        ...defaultConfig.browser.viewport,
        ...config.browser?.viewport,
      },
    },
    actions: {
      ...defaultConfig.actions,
      ...config.actions,
    },
    logging: {
      ...defaultConfig.logging,
      ...config.logging,
    },
  }

  // Environment variables override config values
  const envOverrides: Partial<AutoConfig> = {}

  // Browser configuration overrides
  if (process.env.BROWSER_TYPE) {
    envOverrides.browser = {
      ...mergedConfig.browser,
      type: process.env.BROWSER_TYPE as 'chromium' | 'firefox' | 'webkit',
    }
  }

  if (process.env.HEADLESS !== undefined) {
    envOverrides.browser = {
      ...(envOverrides.browser || mergedConfig.browser),
      headless: process.env.HEADLESS !== 'false',
    }
  }

  if (process.env.VIEWPORT_WIDTH || process.env.VIEWPORT_HEIGHT) {
    envOverrides.browser = {
      ...(envOverrides.browser || mergedConfig.browser),
      viewport: {
        width: process.env.VIEWPORT_WIDTH ? parseInt(process.env.VIEWPORT_WIDTH) : mergedConfig.browser.viewport.width,
        height: process.env.VIEWPORT_HEIGHT
          ? parseInt(process.env.VIEWPORT_HEIGHT)
          : mergedConfig.browser.viewport.height,
      },
    }
  }

  if (process.env.SLOW_MO) {
    envOverrides.browser = {
      ...(envOverrides.browser || mergedConfig.browser),
      slowMo: parseInt(process.env.SLOW_MO),
    }
  }

  if (process.env.TIMEOUT) {
    envOverrides.browser = {
      ...(envOverrides.browser || mergedConfig.browser),
      timeout: parseInt(process.env.TIMEOUT),
    }
  }

  // Action configuration overrides
  if (process.env.WAIT_BETWEEN_ACTIONS) {
    envOverrides.actions = {
      ...(envOverrides.actions || mergedConfig.actions),
      waitBetweenActions: parseInt(process.env.WAIT_BETWEEN_ACTIONS),
    }
  }

  if (process.env.RETRY_ATTEMPTS) {
    envOverrides.actions = {
      ...(envOverrides.actions || mergedConfig.actions),
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS),
    }
  }

  if (process.env.SCREENSHOT_ON_ERROR !== undefined) {
    envOverrides.actions = {
      ...(envOverrides.actions || mergedConfig.actions),
      screenshotOnError: process.env.SCREENSHOT_ON_ERROR !== 'false',
    }
  }

  // Logging configuration overrides
  if (process.env.LOG_LEVEL) {
    envOverrides.logging = {
      ...(envOverrides.logging || mergedConfig.logging),
      level: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
    }
  }

  if (process.env.LOG_OUTPUT_DIR) {
    envOverrides.logging = {
      ...(envOverrides.logging || mergedConfig.logging),
      outputDir: process.env.LOG_OUTPUT_DIR,
    }
  }

  if (process.env.SAVE_SCREENSHOTS !== undefined) {
    envOverrides.logging = {
      ...(envOverrides.logging || mergedConfig.logging),
      saveScreenshots: process.env.SAVE_SCREENSHOTS !== 'false',
    }
  }

  if (process.env.VERBOSE !== undefined) {
    envOverrides.logging = {
      ...(envOverrides.logging || mergedConfig.logging),
      verbose: process.env.VERBOSE !== 'false',
    }
  }

  // Merge config with environment overrides
  return {
    ...mergedConfig,
    ...envOverrides,
  }
}
