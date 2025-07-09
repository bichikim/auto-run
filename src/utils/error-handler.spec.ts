import {describe, it, expect, vi, beforeEach} from 'vitest'
import {
  ErrorType,
  classifyError,
  calculateRetryDelay,
  executeWithSmartRetry,
  getErrorSummary,
  isCriticalError,
  generateErrorReport,
} from './error-handler.js'
import {ActionStep, success, failure} from '../types/index.js'
import {defineConfig} from '../config/index.js'

describe('Error Handler', () => {
  describe('classifyError', () => {
    it('should classify network errors', () => {
      const error = classifyError('net::ERR_CONNECTION_REFUSED')
      
      expect(error.type).toBe(ErrorType.NETWORK_ERROR)
      expect(error.message).toBe('Network connection issue detected')
      expect(error.isRetryable).toBe(true)
    })

    it('should classify timeout errors', () => {
      const error = classifyError('Timeout waiting for element')
      
      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR)
      expect(error.message).toBe('Operation timed out')
      expect(error.isRetryable).toBe(true)
    })

    it('should classify element not found errors', () => {
      const step: ActionStep = {type: 'click', selector: 'button#submit'}
      const error = classifyError('Element not found', step, 1)
      
      expect(error.type).toBe(ErrorType.ELEMENT_NOT_FOUND)
      expect(error.message).toBe('Element not found: button#submit')
      expect(error.isRetryable).toBe(true)
      expect(error.context?.selector).toBe('button#submit')
      expect(error.context?.stepNumber).toBe(1)
    })

    it('should classify element not visible errors', () => {
      const step: ActionStep = {type: 'click', selector: '.hidden-button'}
      const error = classifyError('Element is not visible', step, 2)
      
      expect(error.type).toBe(ErrorType.ELEMENT_NOT_VISIBLE)
      expect(error.message).toBe('Element not visible: .hidden-button')
      expect(error.isRetryable).toBe(true)
    })

    it('should classify element not clickable errors', () => {
      const error = classifyError('Element is not clickable')
      
      expect(error.type).toBe(ErrorType.ELEMENT_NOT_CLICKABLE)
      expect(error.message).toContain('Element not clickable')
      expect(error.isRetryable).toBe(true)
    })

    it('should classify navigation errors', () => {
      const step: ActionStep = {type: 'navigate', url: 'https://example.com'}
      const error = classifyError('Navigation failed', step, 1)
      
      expect(error.type).toBe(ErrorType.NAVIGATION_ERROR)
      expect(error.message).toBe('Navigation failed: https://example.com')
      expect(error.isRetryable).toBe(true)
      expect(error.context?.url).toBe('https://example.com')
    })

    it('should classify screenshot errors', () => {
      const error = classifyError('Screenshot failed')
      
      expect(error.type).toBe(ErrorType.SCREENSHOT_ERROR)
      expect(error.message).toBe('Screenshot capture failed')
      expect(error.isRetryable).toBe(true)
    })

    it('should classify validation errors as non-retryable', () => {
      const error = classifyError('Validation failed: Invalid step')
      
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR)
      expect(error.message).toBe('Script validation failed')
      expect(error.isRetryable).toBe(false)
    })

    it('should classify browser errors', () => {
      const error = classifyError('Browser context was closed')
      
      expect(error.type).toBe(ErrorType.BROWSER_ERROR)
      expect(error.message).toBe('Browser operation failed')
      expect(error.isRetryable).toBe(true)
    })

    it('should classify unknown errors', () => {
      const error = classifyError('Some unexpected error')
      
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR)
      expect(error.message).toBe('Unknown error: Some unexpected error')
      expect(error.isRetryable).toBe(true)
    })
  })

  describe('calculateRetryDelay', () => {
    it('should calculate fixed delay', () => {
      const strategy = {maxAttempts: 3, delay: 1000, backoff: 'fixed' as const}
      
      expect(calculateRetryDelay(strategy, 1)).toBe(1000)
      expect(calculateRetryDelay(strategy, 2)).toBe(1000)
      expect(calculateRetryDelay(strategy, 3)).toBe(1000)
    })

    it('should calculate exponential delay', () => {
      const strategy = {maxAttempts: 3, delay: 1000, backoff: 'exponential' as const}
      
      expect(calculateRetryDelay(strategy, 1)).toBe(1000)
      expect(calculateRetryDelay(strategy, 2)).toBe(2000)
      expect(calculateRetryDelay(strategy, 3)).toBe(4000)
    })

    it('should calculate linear delay', () => {
      const strategy = {maxAttempts: 3, delay: 1000, backoff: 'linear' as const}
      
      expect(calculateRetryDelay(strategy, 1)).toBe(1000)
      expect(calculateRetryDelay(strategy, 2)).toBe(2000)
      expect(calculateRetryDelay(strategy, 3)).toBe(3000)
    })
  })

  describe('executeWithSmartRetry', () => {
    let consoleSpy: any

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.clearAllTimers()
      vi.useFakeTimers()
    })

    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue(success('result'))
      const config = defineConfig()
      
      const result = await executeWithSmartRetry(operation, config)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('result')
      }
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable error', async () => {
      const operation = vi.fn()
        .mockResolvedValueOnce(failure('Element not found'))
        .mockResolvedValueOnce(success('result'))
      
      const config = defineConfig({
        actions: {
          waitBetweenActions: 0,
          retryAttempts: 3,
          screenshotOnError: false
        },
        logging: {
          level: 'info',
          outputDir: './logs',
          saveScreenshots: false,
          verbose: true
        }
      })
      const step: ActionStep = {type: 'click', selector: 'button'}
      
      const promise = executeWithSmartRetry(operation, config, step, 1)
      
      // Fast-forward time for retry delay
      await vi.runAllTimersAsync()
      
      const result = await promise
      
      expect(result.success).toBe(true)
      expect(operation).toHaveBeenCalledTimes(2)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('succeeded on attempt 2'))
    })

    it('should fail after max attempts', async () => {
      const operation = vi.fn().mockResolvedValue(failure('Element not found'))
      
      const config = defineConfig({
        actions: {
          waitBetweenActions: 0,
          retryAttempts: 2,
          screenshotOnError: false
        },
        logging: {
          level: 'info',
          outputDir: './logs',
          saveScreenshots: false,
          verbose: true
        }
      })
      const step: ActionStep = {type: 'click', selector: 'button'}
      
      const promise = executeWithSmartRetry(operation, config, step, 1)
      
      // Fast-forward time for retry delays
      await vi.runAllTimersAsync()
      
      const result = await promise
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('element_not_found')
        expect(result.error).toContain('attempted 2 times')
      }
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockResolvedValue(failure('Validation failed'))
      
      const config = defineConfig()
      
      const result = await executeWithSmartRetry(operation, config)
      
      expect(result.success).toBe(false)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should handle unexpected errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Unexpected error'))
      
      const config = defineConfig()
      
      const result = await executeWithSmartRetry(operation, config)
      
      expect(result.success).toBe(false)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should respect strategy max attempts over config', async () => {
      const operation = vi.fn().mockResolvedValue(failure('Screenshot failed'))
      
      const config = defineConfig()
      
      const promise = executeWithSmartRetry(operation, config)
      
      await vi.runAllTimersAsync()
      
      const result = await promise
      
      expect(result.success).toBe(false)
      // Screenshot error strategy only allows 2 attempts max
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('getErrorSummary', () => {
    it('should generate comprehensive error summary', () => {
      const error = classifyError(
        'Element not found',
        {type: 'click', selector: 'button#submit'},
        1
      )
      
      const summary = getErrorSummary(error)
      
      expect(summary).toContain('Error Type: element_not_found')
      expect(summary).toContain('Message: Element not found: button#submit')
      expect(summary).toContain('Retryable: Yes')
      expect(summary).toContain('Selector: button#submit')
      expect(summary).toContain('Max Attempts: 4')
      expect(summary).toContain('Retry Strategy: fixed')
      expect(summary).toContain('Original Error: Element not found')
    })

    it('should include URL context for navigation errors', () => {
      const error = classifyError(
        'Navigation failed',
        {type: 'navigate', url: 'https://example.com'},
        1
      )
      
      const summary = getErrorSummary(error)
      
      expect(summary).toContain('URL: https://example.com')
    })
  })

  describe('isCriticalError', () => {
    it('should identify validation errors as critical', () => {
      const error = classifyError('Validation failed')
      expect(isCriticalError(error)).toBe(true)
    })

    it('should identify browser errors as critical', () => {
      const error = classifyError('Browser crashed')
      expect(isCriticalError(error)).toBe(true)
    })

    it('should not identify screenshot errors as critical', () => {
      const error = classifyError('Screenshot failed')
      expect(isCriticalError(error)).toBe(false)
    })

    it('should not identify retryable errors as critical', () => {
      const error = classifyError('Element not found')
      expect(isCriticalError(error)).toBe(false)
    })
  })

  describe('generateErrorReport', () => {
    it('should generate comprehensive error report', () => {
      const errors = [
        classifyError('Element not found', {type: 'click', selector: 'button'}, 1),
        classifyError('Element not found', {type: 'click', selector: 'input'}, 2),
        classifyError('Timeout waiting for element', {type: 'type', selector: 'input'}, 3),
        classifyError('Network connection failed', {type: 'navigate', url: 'https://example.com'}, 4),
      ]
      
      const report = generateErrorReport(errors, 5000)
      
      expect(report).toContain('ERROR ANALYSIS REPORT')
      expect(report).toContain('Total Errors: 4')
      expect(report).toContain('Execution Time: 5000ms')
      expect(report).toContain('element_not_found: 2 occurrences')
      expect(report).toContain('timeout_error: 1 occurrences')
      expect(report).toContain('network_error: 1 occurrences')
      expect(report).toContain('RECOMMENDATIONS:')
      expect(report).toContain('Check network connectivity')
      expect(report).toContain('Consider increasing timeout values')
      expect(report).toContain('Verify element selectors')
    })

    it('should handle empty error list', () => {
      const report = generateErrorReport([], 1000)
      
      expect(report).toContain('Total Errors: 0')
      expect(report).toContain('Execution Time: 1000ms')
    })
  })
}) 