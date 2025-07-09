export interface ActionStep {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'scroll' | 'select'
  selector?: string
  value?: string | number
  url?: string
  timeout?: number
  description?: string
}

export interface AutomationScript {
  name: string
  description?: string
  baseUrl?: string
  steps: ActionStep[]
}

export interface ExecutionResult {
  success: boolean
  error?: string
  screenshot?: string
  duration: number
  step?: number
}

export interface BrowserOptions {
  headless?: boolean
  viewport?: {width: number; height: number}
  slowMo?: number
  timeout?: number
}

// Result pattern for error handling
export interface Success<T> {
  success: true
  data: T
}

export interface Failure {
  success: false
  error: string
}

export type Result<T> = Success<T> | Failure

// Helper functions for Result pattern
export function success<T>(data: T): Success<T> {
  return {success: true, data}
}

export function failure(error: string): Failure {
  return {success: false, error}
}
