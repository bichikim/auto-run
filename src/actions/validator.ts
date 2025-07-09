import {ActionStep, AutomationScript} from '../types/index.js'

export interface ValidationError {
  field: string
  message: string
  step?: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Validate automation script with detailed error reporting
 */
export function validateScript(script: AutomationScript): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Validate script-level fields
  validateScriptFields(script, errors)

  // Validate steps
  validateSteps(script.steps, errors, warnings)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate script-level fields
 */
function validateScriptFields(script: AutomationScript, errors: ValidationError[]): void {
  if (!script.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Script name cannot be empty',
    })
  }

  if (script.baseUrl && !isValidUrl(script.baseUrl)) {
    errors.push({
      field: 'baseUrl',
      message: 'Base URL must be a valid URL',
    })
  }
}

/**
 * Validate all steps
 */
function validateSteps(steps: ActionStep[], errors: ValidationError[], warnings: string[]): void {
  if (steps.length === 0) {
    errors.push({
      field: 'steps',
      message: 'Script must have at least one step',
    })
    return
  }

  // Check for common patterns and issues
  checkStepPatterns(steps, warnings)

  // Validate each step
  steps.forEach((step, index) => {
    validateStep(step, index + 1, errors, warnings)
  })
}

/**
 * Check for common step patterns and provide warnings
 */
function checkStepPatterns(steps: ActionStep[], warnings: string[]): void {
  // Check for navigation without wait
  for (let i = 0; i < steps.length - 1; i++) {
    const current = steps[i]
    const next = steps[i + 1]

    if (current.type === 'navigate' && next.type !== 'wait') {
      warnings.push(`Step ${i + 1}: Consider adding a wait after navigation for better reliability`)
    }

    if (
      current.type === 'click' &&
      next.type === 'click' &&
      !steps.slice(i + 1, i + 2).some((s) => s.type === 'wait')
    ) {
      warnings.push(`Step ${i + 1}: Multiple consecutive clicks without wait may cause issues`)
    }
  }

  // Check for missing screenshots in long sequences
  if (steps.length > 10 && !steps.some((s) => s.type === 'screenshot')) {
    warnings.push('Long script without screenshots - consider adding screenshots for debugging')
  }
}

/**
 * Validate individual step
 */
function validateStep(step: ActionStep, stepNumber: number, errors: ValidationError[], warnings: string[]): void {
  // Validate selectors
  if (step.selector && !isValidSelector(step.selector)) {
    errors.push({
      field: 'selector',
      message: 'Invalid CSS selector format',
      step: stepNumber,
    })
  }

  // Validate URLs
  if (step.url && !isValidUrl(step.url)) {
    errors.push({
      field: 'url',
      message: 'Invalid URL format',
      step: stepNumber,
    })
  }

  // Validate timeouts
  if (step.timeout !== undefined) {
    if (step.timeout < 0) {
      errors.push({
        field: 'timeout',
        message: 'Timeout cannot be negative',
        step: stepNumber,
      })
    } else if (step.timeout > 60000) {
      warnings.push(`Step ${stepNumber}: Timeout over 60 seconds may be too long`)
    }
  }

  // Type-specific validations
  validateStepType(step, stepNumber, errors, warnings)
}

/**
 * Validate step based on its type
 */
function validateStepType(step: ActionStep, stepNumber: number, errors: ValidationError[], warnings: string[]): void {
  switch (step.type) {
    case 'type':
      if (typeof step.value === 'string' && step.value.length > 1000) {
        warnings.push(`Step ${stepNumber}: Very long text input (${step.value.length} chars)`)
      }
      break

    case 'wait':
      if (step.timeout && step.timeout < 100) {
        warnings.push(`Step ${stepNumber}: Very short wait time (${step.timeout}ms)`)
      }
      break

    case 'navigate':
      if (step.url && step.url.startsWith('file://')) {
        warnings.push(`Step ${stepNumber}: Local file URLs may not work in all browsers`)
      }
      break

    case 'scroll':
      if (step.value && typeof step.value === 'number' && Math.abs(step.value) > 10000) {
        warnings.push(`Step ${stepNumber}: Large scroll distance (${step.value}px)`)
      }
      break
  }
}

/**
 * Check if URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Basic CSS selector validation
 */
function isValidSelector(selector: string): boolean {
  try {
    // Try to use querySelector to validate selector
    // This is a basic check - in a real browser environment, we'd use document.querySelector
    if (selector.trim().length === 0) return false

    // Basic checks for common invalid patterns
    if (selector.includes('>>') || selector.includes('<<<')) return false
    if (selector.startsWith('.') && selector.length === 1) return false
    if (selector.startsWith('#') && selector.length === 1) return false

    return true
  } catch {
    return false
  }
}

/**
 * Format validation results for display
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = []

  if (result.valid) {
    lines.push('✅ Script validation passed')
  } else {
    lines.push('❌ Script validation failed')
    lines.push('')

    result.errors.forEach((error) => {
      const stepInfo = error.step ? ` (Step ${error.step})` : ''
      lines.push(`Error in ${error.field}${stepInfo}: ${error.message}`)
    })
  }

  if (result.warnings.length > 0) {
    lines.push('')
    lines.push('⚠️  Warnings:')
    result.warnings.forEach((warning) => {
      lines.push(`  ${warning}`)
    })
  }

  return lines.join('\n')
}
