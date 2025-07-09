import {describe, it, expect} from 'vitest'
import {parseScriptFromString, getStepSummary} from './parser.js'
import {ActionStep} from '../types/index.js'

describe('Action Parser', () => {
  describe('parseScriptFromString', () => {
    it('should parse valid JSON script', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        description: 'A test script',
        baseUrl: 'https://example.com',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
            description: 'Navigate to homepage',
          },
          {
            type: 'click',
            selector: 'button#submit',
            description: 'Click submit button',
          },
        ],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Script')
        expect(result.data.description).toBe('A test script')
        expect(result.data.baseUrl).toBe('https://example.com')
        expect(result.data.steps).toHaveLength(2)
        expect(result.data.steps[0].type).toBe('navigate')
        expect(result.data.steps[1].type).toBe('click')
      }
    })

    it('should return error for invalid JSON', () => {
      const invalidJson = '{ invalid json }'

      const result = parseScriptFromString(invalidJson)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to parse JSON')
      }
    })

    it('should return error for missing name', () => {
      const jsonScript = JSON.stringify({
        steps: [{type: 'navigate', url: 'https://example.com'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Script name is required and must be a string')
      }
    })

    it('should return error for empty name', () => {
      const jsonScript = JSON.stringify({
        name: '',
        steps: [{type: 'navigate', url: 'https://example.com'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Script name is required and must be a string')
      }
    })

    it('should return error for missing steps', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Script steps are required and must be an array')
      }
    })

    it('should return error for empty steps array', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Script must have at least one step')
      }
    })

    it('should return error for navigate action without url', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'navigate'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: navigate action requires 'url' field")
      }
    })

    it('should return error for click action without selector', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'click'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: click action requires 'selector' field")
      }
    })

    it('should return error for type action without value', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'type', selector: 'input'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: type action requires 'value' field")
      }
    })

    it('should return error for wait action without timeout', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'wait'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: wait action requires positive 'timeout' field")
      }
    })

    it('should return error for scroll action without selector', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'scroll'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: scroll action requires 'selector' field")
      }
    })

    it('should return error for select action without value', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'select', selector: 'select'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: select action requires 'value' field")
      }
    })

    it('should parse screenshot action without requirements', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'screenshot'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(true)
    })

    it('should return error for invalid action type', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'invalid-action'}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Step 1: invalid type 'invalid-action'")
      }
    })

    it('should return error for negative timeout', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [{type: 'wait', timeout: -100}],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Step 1: wait action requires positive 'timeout' field")
      }
    })

    it('should handle optional fields correctly', () => {
      const jsonScript = JSON.stringify({
        name: 'Test Script',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
            timeout: 5000,
            description: 'Navigate with custom timeout',
          },
        ],
      })

      const result = parseScriptFromString(jsonScript)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.steps[0].timeout).toBe(5000)
        expect(result.data.steps[0].description).toBe('Navigate with custom timeout')
      }
    })
  })

  describe('getStepSummary', () => {
    it('should generate summary for navigate action', () => {
      const step: ActionStep = {
        type: 'navigate',
        url: 'https://example.com',
        description: 'Go to homepage',
      }

      const summary = getStepSummary(step, 0)
      expect(summary).toBe('Step 1: Navigate to https://example.com (Go to homepage)')
    })

    it('should generate summary for click action', () => {
      const step: ActionStep = {
        type: 'click',
        selector: 'button#submit',
      }

      const summary = getStepSummary(step, 1)
      expect(summary).toBe('Step 2: Click button#submit')
    })

    it('should generate summary for type action', () => {
      const step: ActionStep = {
        type: 'type',
        selector: 'input[name="username"]',
        value: 'testuser',
        description: 'Enter username',
      }

      const summary = getStepSummary(step, 2)
      expect(summary).toBe('Step 3: Type "testuser" into input[name="username"] (Enter username)')
    })

    it('should generate summary for wait action', () => {
      const step: ActionStep = {
        type: 'wait',
        timeout: 2000,
      }

      const summary = getStepSummary(step, 3)
      expect(summary).toBe('Step 4: Wait 2000ms')
    })

    it('should generate summary for screenshot action', () => {
      const step: ActionStep = {
        type: 'screenshot',
        description: 'Capture final state',
      }

      const summary = getStepSummary(step, 4)
      expect(summary).toBe('Step 5: Take screenshot (Capture final state)')
    })

    it('should generate summary for scroll action', () => {
      const step: ActionStep = {
        type: 'scroll',
        selector: 'body',
        value: 500,
      }

      const summary = getStepSummary(step, 5)
      expect(summary).toBe('Step 6: Scroll body')
    })

    it('should generate summary for select action', () => {
      const step: ActionStep = {
        type: 'select',
        selector: 'select[name="country"]',
        value: 'US',
      }

      const summary = getStepSummary(step, 6)
      expect(summary).toBe('Step 7: Select "US" from select[name="country"]')
    })

    it('should handle steps without description', () => {
      const step: ActionStep = {
        type: 'click',
        selector: 'button',
      }

      const summary = getStepSummary(step, 0)
      expect(summary).toBe('Step 1: Click button')
    })
  })
})
