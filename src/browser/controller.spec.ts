import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {Browser, BrowserContext, Page} from 'playwright'
import {
  initializeBrowser,
  closeBrowser,
  navigateToUrl,
  clickElement,
  typeText,
  waitForTime,
  takeScreenshot,
  scrollElement,
  selectOption,
  waitForElement,
  elementExists,
  getElementText,
  executeActionStep,
  BrowserController,
} from './controller.js'
import {ActionStep} from '../types/index.js'
import {defineConfig} from '../config/index.js'

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
  firefox: {
    launch: vi.fn(),
  },
  webkit: {
    launch: vi.fn(),
  },
}))

describe('Browser Controller', () => {
  let mockBrowser: Browser
  let mockContext: BrowserContext
  let mockPage: Page
  let mockController: BrowserController

  beforeEach(() => {
    // Create mocks
    mockPage = {
      close: vi.fn(),
      goto: vi.fn(),
      click: vi.fn(),
      fill: vi.fn(),
      screenshot: vi.fn(),
      locator: vi.fn(),
      selectOption: vi.fn(),
      waitForSelector: vi.fn(),
      setDefaultTimeout: vi.fn(),
    } as unknown as Page

    mockContext = {
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue(mockPage),
    } as unknown as BrowserContext

    mockBrowser = {
      close: vi.fn(),
      newContext: vi.fn().mockResolvedValue(mockContext),
    } as unknown as Browser

    mockController = {
      browser: mockBrowser,
      context: mockContext,
      page: mockPage,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initializeBrowser', () => {
    it('should initialize chromium browser successfully', async () => {
      const {chromium} = await import('playwright')
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser)

             const config = defineConfig({
         browser: {
           type: 'chromium',
           headless: true,
           viewport: {width: 1280, height: 720},
           slowMo: 0,
           timeout: 30000,
         },
       })

      const result = await initializeBrowser(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.browser).toBe(mockBrowser)
        expect(result.data.context).toBe(mockContext)
        expect(result.data.page).toBe(mockPage)
      }
      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        slowMo: 0,
      })
    })

    it('should initialize firefox browser successfully', async () => {
      const {firefox} = await import('playwright')
      vi.mocked(firefox.launch).mockResolvedValue(mockBrowser)

             const config = defineConfig({
         browser: {
           type: 'firefox',
           headless: false,
           viewport: {width: 1280, height: 720},
           slowMo: 100,
           timeout: 30000,
         },
       })

      const result = await initializeBrowser(config)

      expect(result.success).toBe(true)
      expect(firefox.launch).toHaveBeenCalledWith({
        headless: false,
        slowMo: 100,
      })
    })

         it('should initialize webkit browser successfully', async () => {
       const {webkit} = await import('playwright')
       vi.mocked(webkit.launch).mockResolvedValue(mockBrowser)

       const config = defineConfig({
         browser: {
           type: 'webkit',
           headless: true,
           viewport: {width: 1280, height: 720},
           slowMo: 0,
           timeout: 30000,
         },
       })

       const result = await initializeBrowser(config)

       expect(result.success).toBe(true)
       expect(webkit.launch).toHaveBeenCalledWith({
         headless: true,
         slowMo: 0,
       })
     })

     it('should fail with unsupported browser type', async () => {
       const config = defineConfig({
         browser: {
           type: 'unsupported' as any,
           headless: true,
           viewport: {width: 1280, height: 720},
           slowMo: 0,
           timeout: 30000,
         },
       })

       const result = await initializeBrowser(config)

       expect(result.success).toBe(false)
       if (!result.success) {
         expect(result.error).toContain('Unsupported browser type: unsupported')
       }
     })

     it('should handle browser launch failure', async () => {
       const {chromium} = await import('playwright')
       vi.mocked(chromium.launch).mockRejectedValue(new Error('Launch failed'))

       const config = defineConfig({
         browser: {
           type: 'chromium',
           headless: true,
           viewport: {width: 1280, height: 720},
           slowMo: 0,
           timeout: 30000,
         },
       })

      const result = await initializeBrowser(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to initialize browser')
      }
    })
  })

  describe('closeBrowser', () => {
    it('should close browser successfully', async () => {
      const result = await closeBrowser(mockController)

      expect(result.success).toBe(true)
      expect(mockPage.close).toHaveBeenCalled()
      expect(mockContext.close).toHaveBeenCalled()
      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('should handle null browser components', async () => {
      const emptyController: BrowserController = {
        browser: null,
        context: null,
        page: null,
      }

      const result = await closeBrowser(emptyController)

      expect(result.success).toBe(true)
    })

    it('should handle close failure', async () => {
      vi.mocked(mockBrowser.close).mockRejectedValue(new Error('Close failed'))

      const result = await closeBrowser(mockController)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to close browser')
      }
    })
  })

  describe('navigateToUrl', () => {
    it('should navigate to URL successfully', async () => {
      const result = await navigateToUrl(mockPage, 'https://example.com')

      expect(result.success).toBe(true)
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        timeout: 30000,
        waitUntil: 'networkidle',
      })
    })

    it('should navigate with custom timeout', async () => {
      const result = await navigateToUrl(mockPage, 'https://example.com', 5000)

      expect(result.success).toBe(true)
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        timeout: 5000,
        waitUntil: 'networkidle',
      })
    })

    it('should handle navigation failure', async () => {
      vi.mocked(mockPage.goto).mockRejectedValue(new Error('Navigation failed'))

      const result = await navigateToUrl(mockPage, 'https://example.com')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to navigate to https://example.com')
      }
    })
  })

  describe('clickElement', () => {
    it('should click element successfully', async () => {
      const result = await clickElement(mockPage, 'button')

      expect(result.success).toBe(true)
      expect(mockPage.click).toHaveBeenCalledWith('button', {
        timeout: 30000,
      })
    })

    it('should click with custom timeout', async () => {
      const result = await clickElement(mockPage, 'button', 5000)

      expect(result.success).toBe(true)
      expect(mockPage.click).toHaveBeenCalledWith('button', {
        timeout: 5000,
      })
    })

    it('should handle click failure', async () => {
      vi.mocked(mockPage.click).mockRejectedValue(new Error('Click failed'))

      const result = await clickElement(mockPage, 'button')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to click element button')
      }
    })
  })

  describe('typeText', () => {
    it('should type text successfully', async () => {
      const result = await typeText(mockPage, 'input', 'test text')

      expect(result.success).toBe(true)
      expect(mockPage.fill).toHaveBeenCalledWith('input', 'test text', {
        timeout: 30000,
      })
    })

    it('should type with custom timeout', async () => {
      const result = await typeText(mockPage, 'input', 'test text', 5000)

      expect(result.success).toBe(true)
      expect(mockPage.fill).toHaveBeenCalledWith('input', 'test text', {
        timeout: 5000,
      })
    })

    it('should handle type failure', async () => {
      vi.mocked(mockPage.fill).mockRejectedValue(new Error('Type failed'))

      const result = await typeText(mockPage, 'input', 'test text')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to type text into input')
      }
    })
  })

  describe('waitForTime', () => {
    it('should wait successfully', async () => {
      vi.useFakeTimers()
      
      const promise = waitForTime(1000)
      vi.advanceTimersByTime(1000)
      const result = await promise

      expect(result.success).toBe(true)
      
      vi.useRealTimers()
    })
  })

  describe('takeScreenshot', () => {
    const config = defineConfig({
      logging: {
        outputDir: './test-logs',
        saveScreenshots: true,
        level: 'info',
        verbose: false,
      },
    })

    it('should take screenshot successfully', async () => {
      const result = await takeScreenshot(mockPage, config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatch(/test-logs\/screenshots\/screenshot-.*\.png/)
      }
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: expect.stringMatching(/test-logs\/screenshots\/screenshot-.*\.png/),
        fullPage: true,
      })
    })

    it('should take screenshot with custom path', async () => {
      const result = await takeScreenshot(mockPage, config, 'custom.png')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatch(/test-logs\/screenshots\/custom\.png/)
      }
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: expect.stringMatching(/test-logs\/screenshots\/custom\.png/),
        fullPage: true,
      })
    })

    it('should handle screenshot failure', async () => {
      vi.mocked(mockPage.screenshot).mockRejectedValue(new Error('Screenshot failed'))

      const result = await takeScreenshot(mockPage, config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to take screenshot')
      }
    })
  })

  describe('scrollElement', () => {
    let mockLocator: any

    beforeEach(() => {
      mockLocator = {
        evaluate: vi.fn(),
        scrollIntoViewIfNeeded: vi.fn(),
      }
      vi.mocked(mockPage.locator).mockReturnValue(mockLocator)
    })

    it('should scroll element into view', async () => {
      const result = await scrollElement(mockPage, 'div')

      expect(result.success).toBe(true)
      expect(mockPage.locator).toHaveBeenCalledWith('div')
      expect(mockLocator.scrollIntoViewIfNeeded).toHaveBeenCalled()
    })

    it('should scroll element by distance', async () => {
      const result = await scrollElement(mockPage, 'div', 100)

      expect(result.success).toBe(true)
      expect(mockLocator.evaluate).toHaveBeenCalled()
    })

    it('should handle scroll failure', async () => {
      mockLocator.scrollIntoViewIfNeeded.mockRejectedValue(new Error('Scroll failed'))

      const result = await scrollElement(mockPage, 'div')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to scroll element div')
      }
    })
  })

  describe('selectOption', () => {
    it('should select option successfully', async () => {
      const result = await selectOption(mockPage, 'select', 'value1')

      expect(result.success).toBe(true)
      expect(mockPage.selectOption).toHaveBeenCalledWith('select', 'value1', {
        timeout: 30000,
      })
    })

    it('should select option with number value', async () => {
      const result = await selectOption(mockPage, 'select', 123)

      expect(result.success).toBe(true)
      expect(mockPage.selectOption).toHaveBeenCalledWith('select', '123', {
        timeout: 30000,
      })
    })

    it('should handle select failure', async () => {
      vi.mocked(mockPage.selectOption).mockRejectedValue(new Error('Select failed'))

      const result = await selectOption(mockPage, 'select', 'value1')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to select option value1 from select')
      }
    })
  })

  describe('waitForElement', () => {
    it('should wait for element successfully', async () => {
      const result = await waitForElement(mockPage, 'button')

      expect(result.success).toBe(true)
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('button', {
        state: 'visible',
        timeout: 30000,
      })
    })

    it('should handle wait failure', async () => {
      vi.mocked(mockPage.waitForSelector).mockRejectedValue(new Error('Wait failed'))

      const result = await waitForElement(mockPage, 'button')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to wait for element button')
      }
    })
  })

  describe('elementExists', () => {
    let mockLocator: any

    beforeEach(() => {
      mockLocator = {
        count: vi.fn(),
      }
      vi.mocked(mockPage.locator).mockReturnValue(mockLocator)
    })

    it('should return true when element exists', async () => {
      mockLocator.count.mockResolvedValue(1)

      const result = await elementExists(mockPage, 'button')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(true)
      }
    })

    it('should return false when element does not exist', async () => {
      mockLocator.count.mockResolvedValue(0)

      const result = await elementExists(mockPage, 'button')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(false)
      }
    })

    it('should handle existence check failure', async () => {
      mockLocator.count.mockRejectedValue(new Error('Count failed'))

      const result = await elementExists(mockPage, 'button')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to check if element exists button')
      }
    })
  })

  describe('getElementText', () => {
    let mockLocator: any

    beforeEach(() => {
      mockLocator = {
        textContent: vi.fn(),
      }
      vi.mocked(mockPage.locator).mockReturnValue(mockLocator)
    })

    it('should get element text successfully', async () => {
      mockLocator.textContent.mockResolvedValue('Hello World')

      const result = await getElementText(mockPage, 'h1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Hello World')
      }
    })

    it('should handle null text content', async () => {
      mockLocator.textContent.mockResolvedValue(null)

      const result = await getElementText(mockPage, 'h1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('')
      }
    })

    it('should handle text retrieval failure', async () => {
      mockLocator.textContent.mockRejectedValue(new Error('Text failed'))

      const result = await getElementText(mockPage, 'h1')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to get text from element h1')
      }
    })
  })

  describe('executeActionStep', () => {
    const config = defineConfig({
      actions: {
        waitBetweenActions: 0,
        retryAttempts: 3,
        screenshotOnError: false,
      },
    })

    it('should execute navigate action', async () => {
      const step: ActionStep = {
        type: 'navigate',
        url: 'https://example.com',
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(true)
      expect(mockPage.goto).toHaveBeenCalled()
    })

    it('should execute click action', async () => {
      const step: ActionStep = {
        type: 'click',
        selector: 'button',
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(true)
      expect(mockPage.click).toHaveBeenCalled()
    })

    it('should execute type action', async () => {
      const step: ActionStep = {
        type: 'type',
        selector: 'input',
        value: 'test',
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(true)
      expect(mockPage.fill).toHaveBeenCalled()
    })

    it('should execute wait action', async () => {
      vi.useFakeTimers()
      
      const step: ActionStep = {
        type: 'wait',
        timeout: 1000,
      }

      const promise = executeActionStep(mockPage, step, config)
      vi.advanceTimersByTime(1000)
      const result = await promise

      expect(result.success).toBe(true)
      
      vi.useRealTimers()
    })

    it('should execute screenshot action', async () => {
      const step: ActionStep = {
        type: 'screenshot',
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(true)
      expect(mockPage.screenshot).toHaveBeenCalled()
    })

         it('should execute scroll action', async () => {
       const mockLocator = {
         scrollIntoViewIfNeeded: vi.fn(),
       }
       vi.mocked(mockPage.locator).mockReturnValue(mockLocator as any)

       const step: ActionStep = {
         type: 'scroll',
         selector: 'div',
       }

       const result = await executeActionStep(mockPage, step, config)

       expect(result.success).toBe(true)
       expect(mockPage.locator).toHaveBeenCalled()
     })

    it('should execute select action', async () => {
      const step: ActionStep = {
        type: 'select',
        selector: 'select',
        value: 'option1',
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(true)
      expect(mockPage.selectOption).toHaveBeenCalled()
    })

    it('should fail with unknown action type', async () => {
      const step: ActionStep = {
        type: 'unknown' as any,
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unknown action type: unknown')
      }
    })

    it('should fail when required fields are missing', async () => {
      const step: ActionStep = {
        type: 'navigate',
        // url is missing
      }

      const result = await executeActionStep(mockPage, step, config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Navigate action requires URL')
      }
    })
  })
}) 