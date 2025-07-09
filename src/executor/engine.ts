import {AutomationScript, ActionStep, Result, success, failure} from '../types/index.js'
import {AutoConfig} from '../config/index.js'
import {
  BrowserController,
  initializeBrowser,
  closeBrowser,
  executeActionStep,
} from '../browser/controller.js'
import {parseScriptFromFile, parseScriptFromString} from '../actions/parser.js'
import {validateScript, formatValidationResults} from '../actions/validator.js'
import {
  executeWithSmartRetry,
  ClassifiedError,
  generateErrorReport,
  getErrorSummary,
} from '../utils/error-handler.js'
import {createLogger, Logger, formatExecutionSummary} from '../utils/logger.js'

export interface ExecutionResult {
  success: boolean
  stepsExecuted: number
  totalSteps: number
  executionTime: number
  screenshots: string[]
  error?: string
  logs: ExecutionLog[]
  errorAnalysis?: {
    errors: ClassifiedError[]
    report: string
  }
  sessionId?: string
  logFilePath?: string
}

export interface ExecutionLog {
  step: number
  action: string
  status: 'success' | 'error' | 'warning'
  message: string
  timestamp: Date
  duration?: number
}

/**
 * Execute automation script from file
 */
export async function executeScriptFromFile(
  filePath: string,
  config: AutoConfig,
): Promise<Result<ExecutionResult>> {
  const parseResult = await parseScriptFromFile(filePath)
  if (!parseResult.success) {
    return failure(`Failed to parse script: ${parseResult.error}`)
  }

  return executeScript(parseResult.data, config)
}

/**
 * Execute automation script from string
 */
export async function executeScriptFromString(
  scriptContent: string,
  config: AutoConfig,
): Promise<Result<ExecutionResult>> {
  const parseResult = parseScriptFromString(scriptContent)
  if (!parseResult.success) {
    return failure(`Failed to parse script: ${parseResult.error}`)
  }

  return executeScript(parseResult.data, config)
}

/**
 * Execute automation script
 */
export async function executeScript(
  script: AutomationScript,
  config: AutoConfig,
): Promise<Result<ExecutionResult>> {
  const startTime = Date.now()
  const logs: ExecutionLog[] = []
  const screenshots: string[] = []
  const collectedErrors: ClassifiedError[] = []
  let browserController: BrowserController | null = null
  
  // Create logger for this execution session
  const logger = createLogger(config)
  
  try {
    logger.info('Starting script execution', {
      scriptName: script.name,
      description: script.description,
      totalSteps: script.steps.length,
    })

    // Validate script before execution
    const validationResult = validateScript(script)
    if (validationResult.errors.length > 0) {
      const errorMessage = formatValidationResults(validationResult)
      logger.validation('Script validation failed', validationResult.errors, validationResult.warnings)
      return failure(`Script validation failed:\n${errorMessage}`)
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      const warningMessage = formatValidationResults(validationResult)
      logger.validation('Script validation completed with warnings', [], validationResult.warnings)
      
      if (config.logging.verbose) {
        logs.push({
          step: 0,
          action: 'validation',
          status: 'warning',
          message: warningMessage,
          timestamp: new Date(),
        })
      }
    } else {
      logger.validation('Script validation passed')
    }

    // Initialize browser
    const browserResult = await initializeBrowser(config, logger)
    if (!browserResult.success) {
      logger.error('Failed to initialize browser', {error: browserResult.error})
      return failure(`Failed to initialize browser: ${browserResult.error}`)
    }

    browserController = browserResult.data

    if (!browserController.page) {
      logger.error('Browser page is not available')
      return failure('Browser page is not available')
    }

    logs.push({
      step: 0,
      action: 'browser_init',
      status: 'success',
      message: `Browser initialized: ${config.browser.type}`,
      timestamp: new Date(),
    })

    // Execute steps sequentially
    let stepsExecuted = 0
    for (let i = 0; i < script.steps.length; i++) {
      const step = script.steps[i]
      const stepNumber = i + 1
      const stepStartTime = Date.now()

      // Log step start
      const stepSummary = getStepSummary(step)
      logger.info(`Starting step ${stepNumber}`, {
        stepNumber,
        action: step.type,
        summary: stepSummary,
      }, stepNumber)

      try {
        // Execute step with smart retry logic
        const stepResult = await executeWithSmartRetry(
          () => executeActionStep(browserController!.page!, step, config, logger, stepNumber),
          config,
          step,
          stepNumber,
        )

        const stepDuration = Date.now() - stepStartTime

        if (stepResult.success) {
          stepsExecuted++
          
          // Handle screenshot result
          if (stepResult.data && step.type === 'screenshot') {
            screenshots.push(stepResult.data)
          }

          // Log success
          logger.step(stepNumber, step.type, stepSummary, stepDuration, true)

          logs.push({
            step: stepNumber,
            action: step.type,
            status: 'success',
            message: stepSummary,
            timestamp: new Date(),
            duration: stepDuration,
          })
        } else {
          // Log failure
          logger.step(stepNumber, step.type, `Failed: ${stepResult.error}`, stepDuration, false)
          
          // Handle step failure
          logs.push({
            step: stepNumber,
            action: step.type,
            status: 'error',
            message: `Failed: ${stepResult.error}`,
            timestamp: new Date(),
            duration: stepDuration,
          })

          // Take error screenshot if enabled
          if (config.actions.screenshotOnError && browserController.page) {
            try {
              const errorScreenshotFilename = `error-step-${stepNumber}-${Date.now()}.png`
              const {takeScreenshot} = await import('../browser/controller.js')
              const screenshotResult = await takeScreenshot(
                browserController.page,
                config,
                errorScreenshotFilename,
                logger,
                stepNumber
              )
              
              if (screenshotResult.success) {
                screenshots.push(screenshotResult.data)
              } else {
                logger.error('Failed to capture error screenshot', {
                  step: stepNumber,
                  error: screenshotResult.error,
                })
              }
            } catch (screenshotError) {
              logger.error('Failed to capture error screenshot', {
                step: stepNumber,
                error: String(screenshotError),
              })
            }
          }

          const executionTime = Date.now() - startTime
          const summary = logger.getSessionSummary()
          
          // Cleanup before returning
          await logger.cleanup()
          
          return success({
            success: false,
            stepsExecuted,
            totalSteps: script.steps.length,
            executionTime,
            screenshots,
            error: stepResult.error,
            logs,
            sessionId: summary.sessionId,
            logFilePath: summary.logFilePath,
          })
        }
      } catch (error) {
        const stepDuration = Date.now() - stepStartTime
        
        logger.error(`Unexpected error in step ${stepNumber}`, {
          step: stepNumber,
          action: step.type,
          error: String(error),
        })
        
        logs.push({
          step: stepNumber,
          action: step.type,
          status: 'error',
          message: `Unexpected error: ${error}`,
          timestamp: new Date(),
          duration: stepDuration,
        })

        const executionTime = Date.now() - startTime
        const summary = logger.getSessionSummary()
        
        // Cleanup before returning
        await logger.cleanup()
        
        return success({
          success: false,
          stepsExecuted,
          totalSteps: script.steps.length,
          executionTime,
          screenshots,
          error: String(error),
          logs,
          sessionId: summary.sessionId,
          logFilePath: summary.logFilePath,
        })
      }
    }

    const executionTime = Date.now() - startTime
    
    logger.info('Script execution completed successfully', {
      stepsExecuted,
      totalSteps: script.steps.length,
      executionTime,
      screenshotCount: screenshots.length,
    })
    
    logs.push({
      step: 0,
      action: 'completion',
      status: 'success',
      message: `Script completed successfully in ${executionTime}ms`,
      timestamp: new Date(),
    })

    const errorReport = collectedErrors.length > 0 
      ? generateErrorReport(collectedErrors, executionTime)
      : undefined

    const summary = logger.getSessionSummary()
    
    // Cleanup logger
    await logger.cleanup()

    return success({
      success: true,
      stepsExecuted,
      totalSteps: script.steps.length,
      executionTime,
      screenshots,
      logs,
      errorAnalysis: collectedErrors.length > 0 ? {
        errors: collectedErrors,
        report: errorReport!
      } : undefined,
      sessionId: summary.sessionId,
      logFilePath: summary.logFilePath,
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    logger.error('Script execution failed with unexpected error', {
      error: String(error),
      executionTime,
      stepsExecuted: 0,
    })
    
    const summary = logger.getSessionSummary()
    
    // Cleanup logger
    await logger.cleanup()
    
    return success({
      success: false,
      stepsExecuted: 0,
      totalSteps: script.steps.length,
      executionTime,
      screenshots,
      error: String(error),
      logs,
      sessionId: summary.sessionId,
      logFilePath: summary.logFilePath,
    })
  } finally {
    // Cleanup browser resources
    if (browserController) {
      await closeBrowser(browserController)
      logger.browser('cleanup', 'Browser closed')
      
      logs.push({
        step: 0,
        action: 'browser_cleanup',
        status: 'success',
        message: 'Browser closed',
        timestamp: new Date(),
      })
    }
  }
}



/**
 * Get step summary for logging
 */
function getStepSummary(step: ActionStep): string {
  switch (step.type) {
    case 'navigate':
      return `Navigate to ${step.url}`
    case 'click':
      return `Click ${step.selector}`
    case 'type':
      return `Type "${step.value}" into ${step.selector}`
    case 'wait':
      return `Wait ${step.timeout}ms`
    case 'screenshot':
      return 'Take screenshot'
    case 'scroll':
      return `Scroll ${step.selector}${step.value ? ` by ${step.value}px` : ''}`
    case 'select':
      return `Select "${step.value}" from ${step.selector}`
    default:
      return `Execute ${step.type}`
  }
}

/**
 * Format execution result for console output
 */
export function formatExecutionResult(result: ExecutionResult): string {
  const lines: string[] = []
  
  lines.push('='.repeat(60))
  lines.push('AUTOMATION EXECUTION RESULT')
  lines.push('='.repeat(60))
  
  if (result.success) {
    lines.push(`✅ SUCCESS: All ${result.totalSteps} steps completed`)
  } else {
    lines.push(`❌ FAILED: ${result.stepsExecuted}/${result.totalSteps} steps completed`)
    if (result.error) {
      lines.push(`Error: ${result.error}`)
    }
  }
  
  lines.push(`⏱ Execution time: ${result.executionTime}ms`)
  
  if (result.screenshots.length > 0) {
    lines.push(`📸 Screenshots: ${result.screenshots.length}`)
    result.screenshots.forEach(screenshot => {
      lines.push(`  - ${screenshot}`)
    })
  }
  
  lines.push('')
  lines.push('EXECUTION LOG:')
  lines.push('-'.repeat(40))
  
  result.logs.forEach(log => {
    const timestamp = log.timestamp.toISOString().split('T')[1].split('.')[0]
    const duration = log.duration ? ` (${log.duration}ms)` : ''
    const icon = log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⚠'
    
    if (log.step === 0) {
      lines.push(`${timestamp} ${icon} ${log.message}${duration}`)
    } else {
      lines.push(`${timestamp} ${icon} Step ${log.step}: ${log.message}${duration}`)
    }
  })
  
  lines.push('='.repeat(60))
  
  return lines.join('\n')
}

/**
 * Save execution result to file
 */
export async function saveExecutionResult(
  result: ExecutionResult,
  outputPath: string,
): Promise<Result<void>> {
  try {
    const fs = await import('fs/promises')
    const content = JSON.stringify(result, null, 2)
    await fs.writeFile(outputPath, content, 'utf-8')
    return success(undefined)
  } catch (error) {
    return failure(`Failed to save execution result: ${error}`)
  }
} 