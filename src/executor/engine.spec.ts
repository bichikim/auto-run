import {describe, it, expect, beforeEach, vi, type MockedFunction} from 'vitest'
import {executeScript} from './engine.js'
import {AutoConfig} from '../config/index.js'
import {AutomationScript} from '../types/index.js'
import {BrowserController} from '../browser/controller.js'
import {Logger} from '../utils/logger.js'

// Mock browser controller
vi.mock('../browser/controller.js', () => ({
  BrowserController: vi.fn(),
  initializeBrowser: vi.fn(),
  closeBrowser: vi.fn(),
  executeActionStep: vi.fn(),
}))

// Mock logger
vi.mock('../utils/logger.js', () => ({
  Logger: vi.fn(),
  createLogger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    step: vi.fn(),
    browser: vi.fn(),
    validation: vi.fn(),
    screenshot: vi.fn().mockResolvedValue(undefined),
    getSessionSummary: vi.fn().mockReturnValue({
      sessionId: 'test-session-123',
      totalLogs: 5,
      logsByLevel: {INFO: 3, ERROR: 1, WARN: 1},
      duration: 2500,
      logFilePath: './logs/test-session.log',
      screenshots: []
    }),
    getExecutionTimeline: vi.fn().mockReturnValue([]),
    exportLogs: vi.fn().mockResolvedValue('./logs/export.json'),
    cleanup: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock parser and validator
vi.mock('../actions/parser.js', () => ({
  parseScriptFromFile: vi.fn(),
  parseScriptFromString: vi.fn(),
}))

vi.mock('../actions/validator.js', () => ({
  validateScript: vi.fn(),
  formatValidationResults: vi.fn(),
}))

// Mock error handler
vi.mock('../utils/error-handler.js', () => ({
  executeWithSmartRetry: vi.fn(),
  generateErrorReport: vi.fn(),
  getErrorSummary: vi.fn(),
}))

describe('Engine', () => {
  let config: AutoConfig
  let mockInitializeBrowser: any
  let mockExecuteActionStep: any
  let mockValidateScript: any
  let mockExecuteWithSmartRetry: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mocked functions
    const browserModule = await import('../browser/controller.js')
    const validatorModule = await import('../actions/validator.js')
    const errorModule = await import('../utils/error-handler.js')

    mockInitializeBrowser = vi.mocked(browserModule.initializeBrowser)
    mockExecuteActionStep = vi.mocked(browserModule.executeActionStep)
    mockValidateScript = vi.mocked(validatorModule.validateScript)
    mockExecuteWithSmartRetry = vi.mocked(errorModule.executeWithSmartRetry)

    config = {
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
    }

    // Setup default mock implementations
    mockValidateScript.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    })

    mockInitializeBrowser.mockResolvedValue({
      success: true,
      data: {
        page: {screenshot: vi.fn()},
        browser: {},
        context: {},
      },
    })

    mockExecuteWithSmartRetry.mockResolvedValue({
      success: true,
      data: undefined,
    })
  })

  describe('executeScript', () => {
    it('should execute simple script successfully', async () => {
      const script: AutomationScript = {
        name: 'Test Script',
        description: 'Test description',
        steps: [
          {
            type: 'click',
            selector: '#button',
          },
        ],
      }

      const result = await executeScript(script, config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalSteps).toBe(1)
        expect(result.data.stepsExecuted).toBe(1)
        expect(result.data.success).toBe(true)
      }
      expect(mockInitializeBrowser).toHaveBeenCalled()
      expect(mockExecuteWithSmartRetry).toHaveBeenCalledTimes(1)
    })

    it('should handle script execution failure', async () => {
      const script: AutomationScript = {
        name: 'Test Script',
        description: 'Test description',
        steps: [
          {
            type: 'click',
            selector: '#invalid-button',
          },
        ],
      }

      // Mock failure in executeWithSmartRetry
      mockExecuteWithSmartRetry.mockResolvedValue({
        success: false,
        error: 'Element not found',
      })

      const result = await executeScript(script, config)

      expect(result.success).toBe(true) // Function succeeds but execution fails
      if (result.success) {
        expect(result.data.success).toBe(false)
        expect(result.data.stepsExecuted).toBe(0)
        expect(result.data.error).toContain('Element not found')
      }
    })

    it('should handle browser initialization failure', async () => {
      const script: AutomationScript = {
        name: 'Test Script',
        description: 'Test description',
        steps: [
          {
            type: 'click',
            selector: '#button',
          },
        ],
      }

      // Mock browser initialization failure
      mockInitializeBrowser.mockResolvedValue({
        success: false,
        error: 'Browser init failed',
      })

      const result = await executeScript(script, config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Browser init failed')
      }
    })

    it('should handle validation failure', async () => {
      const script: AutomationScript = {
        name: 'Test Script',
        description: 'Test description',
        steps: [
          {
            type: 'click',
            selector: '#button',
          },
        ],
      }

      // Mock validation failure
      mockValidateScript.mockReturnValue({
        valid: false,
        errors: [{field: 'selector', message: 'Invalid selector'}],
        warnings: [],
      })

      const result = await executeScript(script, config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Script validation failed')
      }
    })

    it('should execute multiple steps successfully', async () => {
      const script: AutomationScript = {
        name: 'Multi-step Script',
        description: 'Test multiple steps',
        steps: [
          {
            type: 'click',
            selector: '#button1',
          },
          {
            type: 'type',
            selector: '#input1',
            value: 'test text',
          },
          {
            type: 'navigate',
            url: 'https://example.com/page2',
          },
        ],
      }

      const result = await executeScript(script, config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalSteps).toBe(3)
        expect(result.data.stepsExecuted).toBe(3)
        expect(result.data.success).toBe(true)
      }
      expect(mockExecuteWithSmartRetry).toHaveBeenCalledTimes(3)
    })

    it('should stop execution on step failure', async () => {
      const script: AutomationScript = {
        name: 'Multi-step Script',
        description: 'Test step failure',
        steps: [
          {
            type: 'click',
            selector: '#button1',
          },
          {
            type: 'click',
            selector: '#invalid-button',
          },
          {
            type: 'type',
            selector: '#input1',
            value: 'test text',
          },
        ],
      }

      // Mock second step failure
      mockExecuteWithSmartRetry
        .mockResolvedValueOnce({success: true, data: undefined})   // First step succeeds
        .mockResolvedValueOnce({success: false, error: 'Element not found'})  // Second step fails

      const result = await executeScript(script, config)

      expect(result.success).toBe(true) // Function succeeds but execution fails
      if (result.success) {
        expect(result.data.success).toBe(false)
        expect(result.data.totalSteps).toBe(3)
        expect(result.data.stepsExecuted).toBe(1) // Only first step completed
        expect(result.data.error).toContain('Element not found')
      }
      expect(mockExecuteWithSmartRetry).toHaveBeenCalledTimes(2) // Third step not called
    })

    it('should handle missing browser page', async () => {
      const script: AutomationScript = {
        name: 'Test Script',
        description: 'Test description',
        steps: [],
      }

      // Mock browser initialization with missing page
      mockInitializeBrowser.mockResolvedValue({
        success: true,
        data: {
          page: null,
          browser: {},
          context: {},
        },
      })

      const result = await executeScript(script, config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Browser page is not available')
      }
    })

    it('should handle screenshot steps', async () => {
      const script: AutomationScript = {
        name: 'Test Script',
        description: 'Test description',
        steps: [
          {
            type: 'screenshot',
          },
        ],
      }

      // Mock screenshot result
      mockExecuteWithSmartRetry.mockResolvedValue({
        success: true,
        data: 'screenshot.png',
      })

      const result = await executeScript(script, config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.success).toBe(true)
        expect(result.data.screenshots).toContain('screenshot.png')
      }
    })
  })
}) 