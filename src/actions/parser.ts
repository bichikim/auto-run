import {readFile} from 'fs/promises'
import {ActionStep, AutomationScript, Result, success, failure} from '../types/index.js'

/**
 * Parse automation script from JSON file
 */
export async function parseScriptFromFile(filePath: string): Promise<Result<AutomationScript>> {
  try {
    const fileContent = await readFile(filePath, 'utf-8')
    return parseScriptFromString(fileContent)
  } catch (error) {
    return failure(`Failed to read automation script file: ${error}`)
  }
}

/**
 * Parse automation script from JSON string
 */
export function parseScriptFromString(jsonContent: string): Result<AutomationScript> {
  try {
    const parsed = JSON.parse(jsonContent)
    return validateAndNormalizeScript(parsed)
  } catch (error) {
    return failure(`Failed to parse JSON: ${error}`)
  }
}

/**
 * Validate and normalize automation script
 */
function validateAndNormalizeScript(data: any): Result<AutomationScript> {
  // Validate required fields
  if (!data.name || typeof data.name !== 'string') {
    return failure('Script name is required and must be a string')
  }

  if (!data.steps || !Array.isArray(data.steps)) {
    return failure('Script steps are required and must be an array')
  }

  if (data.steps.length === 0) {
    return failure('Script must have at least one step')
  }

  // Validate each step
  const validatedSteps: ActionStep[] = []
  for (let i = 0; i < data.steps.length; i++) {
    const stepResult = validateStep(data.steps[i], i)
    if (!stepResult.success) {
      return stepResult
    }
    validatedSteps.push(stepResult.data)
  }

  return success({
    name: data.name,
    description: data.description || undefined,
    baseUrl: data.baseUrl || undefined,
    steps: validatedSteps,
  })
}

/**
 * Validate individual action step
 */
function validateStep(step: any, index: number): Result<ActionStep> {
  const stepNumber = index + 1

  // Validate step type
  if (!step.type || typeof step.type !== 'string') {
    return failure(`Step ${stepNumber}: type is required and must be a string`)
  }

  const validTypes = ['navigate', 'click', 'type', 'wait', 'screenshot', 'scroll', 'select']
  if (!validTypes.includes(step.type)) {
    return failure(`Step ${stepNumber}: invalid type '${step.type}'. Valid types: ${validTypes.join(', ')}`)
  }

  // Validate step-specific requirements
  const requirementsResult = validateStepRequirements(step, stepNumber)
  if (!requirementsResult.success) {
    return requirementsResult
  }

  return success({
    type: step.type,
    selector: step.selector || undefined,
    value: step.value || undefined,
    url: step.url || undefined,
    timeout: step.timeout || undefined,
    description: step.description || undefined,
  })
}

/**
 * Validate step-specific requirements
 */
function validateStepRequirements(step: any, stepNumber: number): Result<void> {
  switch (step.type) {
    case 'navigate':
      if (!step.url || typeof step.url !== 'string') {
        return failure(`Step ${stepNumber}: navigate action requires 'url' field`)
      }
      break

    case 'click':
      if (!step.selector || typeof step.selector !== 'string') {
        return failure(`Step ${stepNumber}: click action requires 'selector' field`)
      }
      break

    case 'type':
      if (!step.selector || typeof step.selector !== 'string') {
        return failure(`Step ${stepNumber}: type action requires 'selector' field`)
      }
      if (step.value === undefined || step.value === null) {
        return failure(`Step ${stepNumber}: type action requires 'value' field`)
      }
      break

    case 'wait':
      if (!step.timeout || typeof step.timeout !== 'number' || step.timeout <= 0) {
        return failure(`Step ${stepNumber}: wait action requires positive 'timeout' field`)
      }
      break

    case 'scroll':
      if (!step.selector || typeof step.selector !== 'string') {
        return failure(`Step ${stepNumber}: scroll action requires 'selector' field`)
      }
      break

    case 'select':
      if (!step.selector || typeof step.selector !== 'string') {
        return failure(`Step ${stepNumber}: select action requires 'selector' field`)
      }
      if (step.value === undefined || step.value === null) {
        return failure(`Step ${stepNumber}: select action requires 'value' field`)
      }
      break

    case 'screenshot':
      // No additional requirements for screenshot
      break

    default:
      return failure(`Step ${stepNumber}: unknown action type '${step.type}'`)
  }

  // Validate timeout if provided
  if (step.timeout !== undefined && (typeof step.timeout !== 'number' || step.timeout <= 0)) {
    return failure(`Step ${stepNumber}: timeout must be a positive number`)
  }

  return success(undefined)
}

/**
 * Get step summary for logging
 */
export function getStepSummary(step: ActionStep, index: number): string {
  const stepNumber = index + 1
  const desc = step.description ? ` (${step.description})` : ''

  switch (step.type) {
    case 'navigate':
      return `Step ${stepNumber}: Navigate to ${step.url}${desc}`
    case 'click':
      return `Step ${stepNumber}: Click ${step.selector}${desc}`
    case 'type':
      return `Step ${stepNumber}: Type "${step.value}" into ${step.selector}${desc}`
    case 'wait':
      return `Step ${stepNumber}: Wait ${step.timeout}ms${desc}`
    case 'screenshot':
      return `Step ${stepNumber}: Take screenshot${desc}`
    case 'scroll':
      return `Step ${stepNumber}: Scroll ${step.selector}${desc}`
    case 'select':
      return `Step ${stepNumber}: Select "${step.value}" from ${step.selector}${desc}`
    default:
      return `Step ${stepNumber}: ${step.type}${desc}`
  }
}
