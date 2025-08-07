import {Browser, BrowserContext, Page, chromium, firefox, webkit} from 'playwright'
import {ActionStep, Result, success, failure} from '../types/index.js'
import {AutoConfig} from '../config/index.js'
import {Logger} from '../utils/logger.js'
import {join} from 'path'
import {existsSync} from 'fs'
import {mkdir} from 'fs/promises'

export interface BrowserController {
  browser: Browser | null
  context: BrowserContext | null
  page: Page | null
  logger?: Logger
}

/**
 * Initialize browser with configuration
 */
export async function initializeBrowser(config: AutoConfig, logger?: Logger): Promise<Result<BrowserController>> {
  try {
    const {browser: browserConfig} = config

    logger?.browser('initialization', 'Starting browser initialization', {type: browserConfig.type, headless: browserConfig.headless})

    // Select browser type
    let browser: Browser
    switch (browserConfig.type) {
      case 'chromium':
        browser = await chromium.launch({
          headless: browserConfig.headless,
          slowMo: browserConfig.slowMo,
        })
        break
      case 'firefox':
        browser = await firefox.launch({
          headless: browserConfig.headless,
          slowMo: browserConfig.slowMo,
        })
        break
      case 'webkit':
        browser = await webkit.launch({
          headless: browserConfig.headless,
          slowMo: browserConfig.slowMo,
        })
        break
      default:
        const errorMsg = `Unsupported browser type: ${browserConfig.type}`
        logger?.error(errorMsg, {supportedTypes: ['chromium', 'firefox', 'webkit']})
        return failure(errorMsg)
    }

    logger?.browser('launch', `Browser ${browserConfig.type} launched successfully`)

    // Create browser context
    const context = await browser.newContext({
      viewport: browserConfig.viewport,
    })

    logger?.browser('context', 'Browser context created', {viewport: browserConfig.viewport})

    // Create new page
    const page = await context.newPage()

    // Set default timeout
    page.setDefaultTimeout(browserConfig.timeout)

    logger?.browser('page', 'New page created', {timeout: browserConfig.timeout})

    return success({
      browser,
      context,
      page,
      logger,
    })
      } catch (error) {
    const errorMsg = `Failed to initialize browser: ${error}`
    logger?.error(errorMsg, {error: String(error), config: config.browser})
    return failure(errorMsg)
  }
}

/**
 * Close browser and cleanup resources
 */
export async function closeBrowser(controller: BrowserController): Promise<Result<void>> {
  try {
    if (controller.page) {
      await controller.page.close()
    }
    if (controller.context) {
      await controller.context.close()
    }
    if (controller.browser) {
      await controller.browser.close()
    }
    return success(undefined)
  } catch (error) {
    return failure(`Failed to close browser: ${error}`)
  }
}

/**
 * Navigate to URL
 */
export async function navigateToUrl(
  page: Page,
  url: string,
  timeout?: number,
  logger?: Logger,
): Promise<Result<void>> {
  try {
    const startTime = Date.now()
    logger?.debug(`Navigating to ${url}`, {url, timeout})
    
    await page.goto(url, {
      timeout: timeout || 30000,
      waitUntil: 'networkidle',
    })
    
    const duration = Date.now() - startTime
    logger?.info(`Successfully navigated to ${url}`, {url, duration})
    
    return success(undefined)
  } catch (error) {
    const errorMsg = `Failed to navigate to ${url}: ${error}`
    logger?.error(errorMsg, {url, timeout, error: String(error)})
    return failure(errorMsg)
  }
}

/**
 * Click element by selector
 */
export async function clickElement(
  page: Page,
  selector: string,
  timeout?: number,
  frameSelector?: string,
): Promise<Result<void>> {
  try {
    if (frameSelector) {
      // Click element inside iframe
      await page.frameLocator(frameSelector).locator(selector).click({
        timeout: timeout || 30000,
      })
    } else {
      // First check if element exists for faster failure
      const existsResult = await elementExists(page, selector)
      if (!existsResult.success) {
        return failure(`Failed to check if element exists: ${existsResult.error}`)
      }
      
      if (!existsResult.data) {
        return failure(`Element not found: ${selector}`)
      }
      
      // Element exists, proceed with click
      await page.click(selector, {
        timeout: timeout || 30000,
      })
    }
    return success(undefined)
  } catch (error) {
    return failure(`Failed to click element ${selector}: ${error}`)
  }
}

/**
 * Click element by selector with optional existence check
 */
export async function clickElementIfExists(
  page: Page,
  selector: string,
  timeout?: number,
  logger?: Logger,
): Promise<Result<void>> {
  try {
    // First check if element exists
    const existsResult = await elementExists(page, selector)
    if (!existsResult.success) {
      return failure(`Failed to check if element exists: ${existsResult.error}`)
    }
    
    if (!existsResult.data) {
      logger?.warn(`Element not found: ${selector}`, {selector})
      return success(undefined) // Return success but skip the click
    }
    
    // Element exists, proceed with click
    await page.click(selector, {
      timeout: timeout || 30000,
    })
    
    logger?.info(`Successfully clicked element: ${selector}`)
    return success(undefined)
  } catch (error) {
    return failure(`Failed to click element ${selector}: ${error}`)
  }
}

/**
 * Type text into element
 */
export async function typeText(
  page: Page,
  selector: string,
  text: string,
  timeout?: number,
  frameSelector?: string,
): Promise<Result<void>> {
  try {
    if (frameSelector) {
      // Type text inside iframe
      await page.frameLocator(frameSelector).locator(selector).fill(text, {
        timeout: timeout || 30000,
      })
    } else {
      await page.fill(selector, text, {
        timeout: timeout || 30000,
      })
    }
    return success(undefined)
  } catch (error) {
    return failure(`Failed to type text into ${selector}: ${error}`)
  }
}

/**
 * Wait for specified time
 */
export async function waitForTime(milliseconds: number): Promise<Result<void>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
    return success(undefined)
  } catch (error) {
    return failure(`Failed to wait: ${error}`)
  }
}

/**
 * Take screenshot
 */
export async function takeScreenshot(
  page: Page,
  config: AutoConfig,
  path?: string,
  logger?: Logger,
  step?: number,
): Promise<Result<string>> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = path || `screenshot-${timestamp}.png`
    
    // Ensure screenshots directory exists
    const screenshotsDir = join(config.logging.outputDir, 'screenshots')
    if (!existsSync(screenshotsDir)) {
      await mkdir(screenshotsDir, {recursive: true})
    }
    
    // Use config outputDir for screenshot storage
    const screenshotPath = join(screenshotsDir, filename)
    
    logger?.debug(`Taking screenshot`, {path: screenshotPath, step, outputDir: config.logging.outputDir, screenshotsDir})
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    })
    
    // Log screenshot with metadata
    await logger?.screenshot(screenshotPath, step, 'success')
    
    return success(screenshotPath)
  } catch (error) {
    const errorMsg = `Failed to take screenshot: ${error}`
    logger?.error(errorMsg, {path, error: String(error), step})
    return failure(errorMsg)
  }
}

/**
 * Scroll element
 */
export async function scrollElement(
  page: Page,
  selector: string,
  distance?: number,
): Promise<Result<void>> {
  try {
    const element = await page.locator(selector)
    
    if (distance) {
      await element.evaluate((el, dist) => {
        el.scrollBy(0, dist)
      }, distance)
    } else {
      await element.scrollIntoViewIfNeeded()
    }
    
    return success(undefined)
  } catch (error) {
    return failure(`Failed to scroll element ${selector}: ${error}`)
  }
}

/**
 * Select option from dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string | number,
  timeout?: number,
  frameSelector?: string,
): Promise<Result<void>> {
  try {
    if (frameSelector) {
      // Select option inside iframe
      await page.frameLocator(frameSelector).locator(selector).selectOption(String(value), {
        timeout: timeout || 30000,
      })
    } else {
      await page.selectOption(selector, String(value), {
        timeout: timeout || 30000,
      })
    }
    return success(undefined)
  } catch (error) {
    return failure(`Failed to select option ${value} from ${selector}: ${error}`)
  }
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout?: number,
  frameSelector?: string,
): Promise<Result<void>> {
  try {
    if (frameSelector) {
      // Wait for element inside iframe
      await page.frameLocator(frameSelector).locator(selector).waitFor({
        state: 'attached',
        timeout: timeout || 30000,
      })
    } else {
      await page.waitForSelector(selector, {
        state: 'attached',  // 'visible' 대신 'attached' 사용
        timeout: timeout || 30000,
      })
    }
    return success(undefined)
  } catch (error) {
    return failure(`Failed to wait for element ${selector}: ${error}`)
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<Result<boolean>> {
  try {
    const element = await page.locator(selector).count()
    return success(element > 0)
  } catch (error) {
    return failure(`Failed to check if element exists ${selector}: ${error}`)
  }
}

/**
 * Get element text content
 */
export async function getElementText(page: Page, selector: string): Promise<Result<string>> {
  try {
    const text = await page.locator(selector).textContent()
    return success(text || '')
  } catch (error) {
    return failure(`Failed to get text from element ${selector}: ${error}`)
  }
}

/**
 * Handle browser alert/dialog
 */
export async function handleAlert(
  page: Page,
  action: 'accept' | 'dismiss',
  promptText?: string,
  logger?: Logger,
): Promise<Result<void>> {
  try {
    // Set up dialog handler before the action that triggers the alert
    page.on('dialog', async (dialog) => {
      logger?.info(`Dialog detected: ${dialog.type()} - ${dialog.message()}`)
      
      switch (action) {
        case 'accept':
          if (dialog.type() === 'prompt' && promptText) {
            await dialog.accept(promptText)
          } else {
            await dialog.accept()
          }
          break
        case 'dismiss':
          await dialog.dismiss()
          break
      }
    })
    
    return success(undefined)
  } catch (error) {
    return failure(`Failed to handle alert: ${error}`)
  }
}

/**
 * Execute action step
 */
export async function executeActionStep(
  page: Page,
  step: ActionStep,
  config: AutoConfig,
  logger?: Logger,
  stepNumber?: number,
): Promise<Result<string | undefined>> {
  const {actions: actionConfig} = config

  try {
    // Wait between actions if configured
    if (actionConfig.waitBetweenActions > 0) {
      await waitForTime(actionConfig.waitBetweenActions)
    }

    switch (step.type) {
      case 'navigate': {
        if (!step.url) {
          return failure('Navigate action requires URL')
        }
        const result = await navigateToUrl(page, step.url, step.timeout || config.browser.timeout, logger)
        if (!result.success) {
          return result
        }
        return success(undefined)
      }

      case 'click': {
        if (!step.selector) {
          return failure('Click action requires selector')
        }
        
        // Check if this is a conditional click (when optional flag is set)
        if (step.optional) {
          const result = await clickElementIfExists(page, step.selector, step.timeout || config.browser.timeout, logger)
          if (!result.success) {
            return result
          }
          return success(undefined)
        } else {
          const result = await clickElement(page, step.selector, step.timeout || config.browser.timeout, step.frame)
          if (!result.success) {
            return result
          }
          return success(undefined)
        }
      }

      case 'type': {
        if (!step.selector || step.value === undefined) {
          return failure('Type action requires selector and value')
        }
        const result = await typeText(page, step.selector, String(step.value), step.timeout || config.browser.timeout, step.frame)
        if (!result.success) {
          return result
        }
        return success(undefined)
      }

      case 'wait': {
        if (step.selector) {
          // Wait for element to appear
          const result = await waitForElement(page, step.selector, step.timeout || config.browser.timeout, step.frame)
          if (!result.success) {
            return result
          }
          return success(undefined)
        } else if (step.timeout) {
          // Wait for specified time
          const result = await waitForTime(step.timeout)
          if (!result.success) {
            return result
          }
          return success(undefined)
        } else {
          return failure('Wait action requires either selector or timeout')
        }
      }

      case 'screenshot': {
        const result = await takeScreenshot(page, config, undefined, logger, stepNumber)
        if (!result.success) {
          return result
        }
        return success(result.data)
      }

      case 'scroll': {
        if (!step.selector) {
          return failure('Scroll action requires selector')
        }
        const distance = typeof step.value === 'number' ? step.value : undefined
        const result = await scrollElement(page, step.selector, distance)
        if (!result.success) {
          return result
        }
        return success(undefined)
      }

      case 'select': {
        if (!step.selector || step.value === undefined) {
          return failure('Select action requires selector and value')
        }
        const result = await selectOption(page, step.selector, step.value, step.timeout || config.browser.timeout, step.frame)
        if (!result.success) {
          return result
        }
        return success(undefined)
      }

      case 'alert': {
        const action = step.value === 'accept' || step.value === 'dismiss' ? step.value : 'accept'
        const result = await handleAlert(page, action, step.promptText, logger)
        if (!result.success) {
          return result
        }
        return success(undefined)
      }

      default:
        return failure(`Unknown action type: ${step.type}`)
    }
  } catch (error) {
    return failure(`Failed to execute action step: ${error}`)
  }
} 