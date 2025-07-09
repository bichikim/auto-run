import {ActionStep, Result, success, failure} from '../types/index.js'
import {AutoConfig} from '../config/index.js'

/**
 * Error types for classification and handling
 */
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  ELEMENT_NOT_FOUND = 'element_not_found',
  ELEMENT_NOT_VISIBLE = 'element_not_visible',
  ELEMENT_NOT_CLICKABLE = 'element_not_clickable',
  NAVIGATION_ERROR = 'navigation_error',
  SCREENSHOT_ERROR = 'screenshot_error',
  VALIDATION_ERROR = 'validation_error',
  BROWSER_ERROR = 'browser_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Retry strategy for different error types
 */
export interface RetryStrategy {
  maxAttempts: number
  delay: number
  backoff: 'fixed' | 'exponential' | 'linear'
  recoveryActions?: (() => Promise<void>)[]
}

/**
 * Classified error with additional context
 */
export interface ClassifiedError {
  type: ErrorType
  originalError: string
  message: string
  isRetryable: boolean
  strategy?: RetryStrategy
  context?: {
    step?: ActionStep
    stepNumber?: number
    selector?: string
    url?: string
  }
}

/**
 * Default retry strategies for different error types
 */
const DEFAULT_RETRY_STRATEGIES: Record<ErrorType, RetryStrategy> = {
  [ErrorType.NETWORK_ERROR]: {
    maxAttempts: 5,
    delay: 2000,
    backoff: 'exponential',
  },
  [ErrorType.TIMEOUT_ERROR]: {
    maxAttempts: 3,
    delay: 3000,
    backoff: 'linear',
  },
  [ErrorType.ELEMENT_NOT_FOUND]: {
    maxAttempts: 4,
    delay: 1500,
    backoff: 'fixed',
  },
  [ErrorType.ELEMENT_NOT_VISIBLE]: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'fixed',
  },
  [ErrorType.ELEMENT_NOT_CLICKABLE]: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'fixed',
  },
  [ErrorType.NAVIGATION_ERROR]: {
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
  },
  [ErrorType.SCREENSHOT_ERROR]: {
    maxAttempts: 2,
    delay: 500,
    backoff: 'fixed',
  },
  [ErrorType.VALIDATION_ERROR]: {
    maxAttempts: 1,
    delay: 0,
    backoff: 'fixed',
  },
  [ErrorType.BROWSER_ERROR]: {
    maxAttempts: 2,
    delay: 3000,
    backoff: 'fixed',
  },
  [ErrorType.UNKNOWN_ERROR]: {
    maxAttempts: 2,
    delay: 1000,
    backoff: 'fixed',
  },
}

/**
 * Classify error based on error message and context
 */
export function classifyError(
  error: string,
  step?: ActionStep,
  stepNumber?: number,
): ClassifiedError {
  const lowerError = error.toLowerCase()

  // Network-related errors
  if (
    lowerError.includes('net::') ||
    lowerError.includes('network') ||
    lowerError.includes('connection') ||
    lowerError.includes('dns') ||
    lowerError.includes('refused')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      originalError: error,
      message: 'Network connection issue detected',
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.NETWORK_ERROR],
      context: {step, stepNumber},
    }
  }

  // Timeout errors
  if (
    lowerError.includes('timeout') ||
    lowerError.includes('timed out') ||
    lowerError.includes('waiting for')
  ) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      originalError: error,
      message: 'Operation timed out',
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.TIMEOUT_ERROR],
      context: {step, stepNumber, selector: step?.selector},
    }
  }

  // Element not found
  if (
    lowerError.includes('no element') ||
    lowerError.includes('not found') ||
    lowerError.includes('cannot find') ||
    lowerError.includes('element not found')
  ) {
    return {
      type: ErrorType.ELEMENT_NOT_FOUND,
      originalError: error,
      message: `Element not found: ${step?.selector || 'unknown selector'}`,
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.ELEMENT_NOT_FOUND],
      context: {step, stepNumber, selector: step?.selector},
    }
  }

  // Element not visible
  if (
    lowerError.includes('not visible') ||
    lowerError.includes('hidden') ||
    lowerError.includes('not displayed')
  ) {
    return {
      type: ErrorType.ELEMENT_NOT_VISIBLE,
      originalError: error,
      message: `Element not visible: ${step?.selector || 'unknown selector'}`,
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.ELEMENT_NOT_VISIBLE],
      context: {step, stepNumber, selector: step?.selector},
    }
  }

  // Element not clickable
  if (
    lowerError.includes('not clickable') ||
    lowerError.includes('not interactable') ||
    lowerError.includes('element click intercepted')
  ) {
    return {
      type: ErrorType.ELEMENT_NOT_CLICKABLE,
      originalError: error,
      message: `Element not clickable: ${step?.selector || 'unknown selector'}`,
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.ELEMENT_NOT_CLICKABLE],
      context: {step, stepNumber, selector: step?.selector},
    }
  }

  // Navigation errors
  if (
    lowerError.includes('navigation') ||
    lowerError.includes('page crashed') ||
    lowerError.includes('page.goto')
  ) {
    return {
      type: ErrorType.NAVIGATION_ERROR,
      originalError: error,
      message: `Navigation failed: ${step?.url || 'unknown URL'}`,
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.NAVIGATION_ERROR],
      context: {step, stepNumber, url: step?.url},
    }
  }

  // Screenshot errors
  if (lowerError.includes('screenshot')) {
    return {
      type: ErrorType.SCREENSHOT_ERROR,
      originalError: error,
      message: 'Screenshot capture failed',
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.SCREENSHOT_ERROR],
      context: {step, stepNumber},
    }
  }

  // Validation errors
  if (lowerError.includes('validation') || lowerError.includes('invalid')) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      originalError: error,
      message: 'Script validation failed',
      isRetryable: false,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.VALIDATION_ERROR],
      context: {step, stepNumber},
    }
  }

  // Browser errors
  if (
    lowerError.includes('browser') ||
    lowerError.includes('context') ||
    lowerError.includes('playwright')
  ) {
    return {
      type: ErrorType.BROWSER_ERROR,
      originalError: error,
      message: 'Browser operation failed',
      isRetryable: true,
      strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.BROWSER_ERROR],
      context: {step, stepNumber},
    }
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    originalError: error,
    message: `Unknown error: ${error}`,
    isRetryable: true,
    strategy: DEFAULT_RETRY_STRATEGIES[ErrorType.UNKNOWN_ERROR],
    context: {step, stepNumber},
  }
}

/**
 * Calculate delay for retry based on strategy
 */
export function calculateRetryDelay(
  strategy: RetryStrategy,
  attempt: number,
): number {
  switch (strategy.backoff) {
    case 'exponential':
      return strategy.delay * Math.pow(2, attempt - 1)
    case 'linear':
      return strategy.delay * attempt
    case 'fixed':
    default:
      return strategy.delay
  }
}

/**
 * Enhanced retry executor with smart error handling
 */
export async function executeWithSmartRetry<T>(
  operation: () => Promise<Result<T>>,
  config: AutoConfig,
  step?: ActionStep,
  stepNumber?: number,
): Promise<Result<T>> {
  let lastError: ClassifiedError | null = null
  let attempt = 1

  while (true) {
    try {
      const result = await operation()
      
      if (result.success) {
        // Log successful retry if this wasn't the first attempt
        if (attempt > 1 && config.logging.verbose) {
          console.log(`✓ Step ${stepNumber} succeeded on attempt ${attempt}`)
        }
        return result
      }

      // Classify the error
      const classifiedError = classifyError(result.error, step, stepNumber)
      lastError = classifiedError

      // Check if error is retryable and we haven't exceeded max attempts
      const strategy = classifiedError.strategy || DEFAULT_RETRY_STRATEGIES[classifiedError.type]
      const maxAttempts = Math.min(strategy.maxAttempts, config.actions.retryAttempts)

      if (!classifiedError.isRetryable || attempt >= maxAttempts) {
        break
      }

      // Log retry attempt
      if (config.logging.verbose) {
        console.log(`⚠ Step ${stepNumber} failed (attempt ${attempt}/${maxAttempts}): ${classifiedError.message}`)
      }

      // Execute recovery actions if any
      if (strategy.recoveryActions) {
        try {
          for (const recoveryAction of strategy.recoveryActions) {
            await recoveryAction()
          }
        } catch (recoveryError) {
          if (config.logging.verbose) {
            console.log(`⚠ Recovery action failed: ${recoveryError}`)
          }
        }
      }

      // Calculate and wait for retry delay
      const delay = calculateRetryDelay(strategy, attempt)
      if (config.logging.verbose && delay > 0) {
        console.log(`  Retrying in ${delay}ms...`)
      }
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      attempt++
    } catch (unexpectedError) {
      // Handle unexpected errors
      lastError = classifyError(String(unexpectedError), step, stepNumber)
      break
    }
  }

  // All retries failed
  const finalMessage = lastError 
    ? `${lastError.message} (${lastError.type}, attempted ${attempt} times)`
    : 'Operation failed with unknown error'

  return failure(finalMessage)
}

/**
 * Get human-readable error summary
 */
export function getErrorSummary(error: ClassifiedError): string {
  const lines: string[] = []
  
  lines.push(`Error Type: ${error.type}`)
  lines.push(`Message: ${error.message}`)
  lines.push(`Retryable: ${error.isRetryable ? 'Yes' : 'No'}`)
  
  if (error.context?.selector) {
    lines.push(`Selector: ${error.context.selector}`)
  }
  
  if (error.context?.url) {
    lines.push(`URL: ${error.context.url}`)
  }
  
  if (error.strategy) {
    lines.push(`Max Attempts: ${error.strategy.maxAttempts}`)
    lines.push(`Retry Strategy: ${error.strategy.backoff}`)
  }
  
  lines.push(`Original Error: ${error.originalError}`)
  
  return lines.join('\n')
}

/**
 * Check if error indicates a critical failure that should stop execution
 */
export function isCriticalError(error: ClassifiedError): boolean {
  return (
    error.type === ErrorType.VALIDATION_ERROR ||
    error.type === ErrorType.BROWSER_ERROR ||
    (!error.isRetryable && error.type !== ErrorType.SCREENSHOT_ERROR)
  )
}

/**
 * Generate error report for logging
 */
export function generateErrorReport(
  errors: ClassifiedError[],
  executionTime: number,
): string {
  const lines: string[] = []
  
  lines.push('='.repeat(60))
  lines.push('ERROR ANALYSIS REPORT')
  lines.push('='.repeat(60))
  
  lines.push(`Total Errors: ${errors.length}`)
  lines.push(`Execution Time: ${executionTime}ms`)
  lines.push('')
  
  // Group errors by type
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = []
    }
    acc[error.type].push(error)
    return acc
  }, {} as Record<ErrorType, ClassifiedError[]>)
  
  lines.push('ERRORS BY TYPE:')
  lines.push('-'.repeat(40))
  
  Object.entries(errorsByType).forEach(([type, typeErrors]) => {
    lines.push(`${type}: ${typeErrors.length} occurrences`)
    typeErrors.forEach((error, index) => {
      lines.push(`  ${index + 1}. Step ${error.context?.stepNumber || 'unknown'}: ${error.message}`)
    })
    lines.push('')
  })
  
  // Recommendations
  lines.push('RECOMMENDATIONS:')
  lines.push('-'.repeat(40))
  
  if (errorsByType[ErrorType.NETWORK_ERROR]?.length > 0) {
    lines.push('• Check network connectivity and target website availability')
  }
  
  if (errorsByType[ErrorType.TIMEOUT_ERROR]?.length > 0) {
    lines.push('• Consider increasing timeout values for slow-loading elements')
  }
  
  if (errorsByType[ErrorType.ELEMENT_NOT_FOUND]?.length > 0) {
    lines.push('• Verify element selectors are correct and elements exist')
  }
  
  if (errorsByType[ErrorType.ELEMENT_NOT_VISIBLE]?.length > 0) {
    lines.push('• Check if elements are hidden or need scrolling to become visible')
  }
  
  lines.push('='.repeat(60))
  
  return lines.join('\n')
} 