import {describe, it, expect} from 'vitest'
import {validateScript, formatValidationResults} from './validator.js'
import {AutomationScript} from '../types/index.js'

describe('Script Validator', () => {
  describe('validateScript', () => {
    it('should validate a correct script', () => {
      const script: AutomationScript = {
        name: 'Valid Script',
        description: 'A valid test script',
        baseUrl: 'https://example.com',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
            description: 'Navigate to homepage',
          },
          {
            type: 'wait',
            timeout: 2000,
            description: 'Wait for page load',
          },
          {
            type: 'click',
            selector: 'button#submit',
            description: 'Click submit button',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect empty script name', () => {
      const script: AutomationScript = {
        name: '',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Script name cannot be empty',
      })
    })

    it('should detect invalid base URL', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        baseUrl: 'invalid-url',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'baseUrl',
        message: 'Base URL must be a valid URL',
      })
    })

    it('should detect empty steps array', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [],
      }

      const result = validateScript(script)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'steps',
        message: 'Script must have at least one step',
      })
    })

    it('should detect invalid URL in step', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'navigate',
            url: 'invalid-url',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'url',
        message: 'Invalid URL format',
        step: 1,
      })
    })

    it('should detect negative timeout', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'wait',
            timeout: -1000,
          },
        ],
      }

      const result = validateScript(script)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'timeout',
        message: 'Timeout cannot be negative',
        step: 1,
      })
    })

    it('should warn about navigation without wait', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
          },
          {
            type: 'click',
            selector: 'button',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Consider adding a wait after navigation for better reliability')
    })

    it('should warn about consecutive clicks without wait', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'click',
            selector: 'button1',
          },
          {
            type: 'click',
            selector: 'button2',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Multiple consecutive clicks without wait may cause issues')
    })

    it('should warn about long scripts without screenshots', () => {
      const steps = Array.from({length: 12}, (_, i) => ({
        type: 'click' as const,
        selector: `button${i}`,
      }))

      const script: AutomationScript = {
        name: 'Long Script',
        steps,
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Long script without screenshots - consider adding screenshots for debugging')
    })

    it('should warn about very long text input', () => {
      const longText = 'a'.repeat(1500)
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'type',
            selector: 'input',
            value: longText,
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Very long text input (1500 chars)')
    })

    it('should warn about very short wait time', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'wait',
            timeout: 50,
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Very short wait time (50ms)')
    })

    it('should warn about file URLs', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'navigate',
            url: 'file:///path/to/file.html',
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Local file URLs may not work in all browsers')
    })

    it('should warn about large scroll distances', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'scroll',
            selector: 'body',
            value: 15000,
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Large scroll distance (15000px)')
    })

    it('should warn about very long timeouts', () => {
      const script: AutomationScript = {
        name: 'Test Script',
        steps: [
          {
            type: 'wait',
            timeout: 120000,
          },
        ],
      }

      const result = validateScript(script)

      expect(result.warnings).toContain('Step 1: Timeout over 60 seconds may be too long')
    })
  })

  describe('formatValidationResults', () => {
    it('should format successful validation', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
      }

      const formatted = formatValidationResults(result)

      expect(formatted).toBe('✅ Script validation passed')
    })

    it('should format validation with errors', () => {
      const result = {
        valid: false,
        errors: [
          {
            field: 'name',
            message: 'Script name cannot be empty',
          },
          {
            field: 'url',
            message: 'Invalid URL format',
            step: 1,
          },
        ],
        warnings: [],
      }

      const formatted = formatValidationResults(result)

      expect(formatted).toContain('❌ Script validation failed')
      expect(formatted).toContain('Error in name: Script name cannot be empty')
      expect(formatted).toContain('Error in url (Step 1): Invalid URL format')
    })

    it('should format validation with warnings', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: ['Step 1: Consider adding a wait after navigation', 'Long script without screenshots'],
      }

      const formatted = formatValidationResults(result)

      expect(formatted).toContain('✅ Script validation passed')
      expect(formatted).toContain('⚠️  Warnings:')
      expect(formatted).toContain('Step 1: Consider adding a wait after navigation')
      expect(formatted).toContain('Long script without screenshots')
    })

    it('should format validation with both errors and warnings', () => {
      const result = {
        valid: false,
        errors: [
          {
            field: 'name',
            message: 'Script name cannot be empty',
          },
        ],
        warnings: ['Step 1: Consider adding a wait after navigation'],
      }

      const formatted = formatValidationResults(result)

      expect(formatted).toContain('❌ Script validation failed')
      expect(formatted).toContain('Error in name: Script name cannot be empty')
      expect(formatted).toContain('⚠️  Warnings:')
      expect(formatted).toContain('Step 1: Consider adding a wait after navigation')
    })
  })
})
