import {describe, it, expect, beforeAll} from 'vitest'
import {spawn} from 'child_process'
import {join} from 'path'
import {existsSync} from 'fs'

describe('End-to-End Tests - Basic Examples', () => {
  const projectRoot = process.cwd()
  const examplesDir = join(projectRoot, 'examples')

  beforeAll(async () => {
    // Ensure we're in the right directory and project is built
    expect(existsSync(join(projectRoot, 'bin/command.js'))).toBe(true)
    expect(existsSync(join(projectRoot, 'dist'))).toBe(true)
  })

  describe('CLI Interface', () => {
    it('should show version information', async () => {
      const child = spawn('node', ['bin/command.js', '--version'], {
        cwd: projectRoot
      })

      let stdout = ''
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      const exitCode = await new Promise<number>((resolve) => {
        child.on('close', (code) => resolve(code || 0))
      })

      expect(exitCode).toBe(0)
      expect(stdout).toMatch(/\d+\.\d+\.\d+/)
    }, 10000)

    it('should show help message', async () => {
      const child = spawn('node', ['bin/command.js', '--help'], {
        cwd: projectRoot
      })

      let stdout = ''
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      const exitCode = await new Promise<number>((resolve) => {
        child.on('close', (code) => resolve(code || 0))
      })

      expect(exitCode).toBe(0)
      expect(stdout).toContain('Usage:')
      expect(stdout).toContain('run')
      expect(stdout).toContain('validate')
    }, 10000)

    it('should show config information', async () => {
      const child = spawn('node', ['bin/command.js', 'config'], {
        cwd: projectRoot
      })

      let stdout = ''
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      const exitCode = await new Promise<number>((resolve) => {
        child.on('close', (code) => resolve(code || 0))
      })

      expect(exitCode).toBe(0)
      expect(stdout).toContain('Current configuration')
      expect(stdout).toContain('browser')
      expect(stdout).toContain('actions')
    }, 10000)
  })

  describe('Script Validation', () => {
    it('should validate basic navigation script successfully', async () => {
      const child = spawn('node', ['bin/command.js', 'validate', join(examplesDir, 'basic-navigation.json')], {
        cwd: projectRoot
      })

      let stdout = ''
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      const exitCode = await new Promise<number>((resolve) => {
        child.on('close', (code) => resolve(code || 0))
      })

      expect(exitCode).toBe(0)
      expect(stdout).toContain('Script validation passed')
    }, 10000)
  })

  describe('Script Execution Initialization', () => {
    it('should start script execution and show proper initialization', async () => {
      // Create a minimal script that should start
      const quickScript = {
        name: 'Quick Test',
        description: 'Quick test script',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
            description: 'Navigate to example.com'
          }
        ]
      }

      const fs = await import('fs/promises')
      const quickScriptPath = join(projectRoot, 'temp-quick-script.json')
      await fs.writeFile(quickScriptPath, JSON.stringify(quickScript, null, 2))

      try {
        // Run with a very short timeout to just test initialization
        const child = spawn('node', ['bin/command.js', 'run', quickScriptPath], {
          cwd: projectRoot,
          env: {
            ...process.env,
            HEADLESS: 'true',
            WAIT_BETWEEN_ACTIONS: '100'
          }
        })

        let stdout = ''
        child.stdout?.on('data', (data) => {
          stdout += data.toString()
        })

        // Kill the process after 3 seconds to avoid long waits
        setTimeout(() => {
          child.kill('SIGTERM')
        }, 3000)

        const exitCode = await new Promise<number>((resolve) => {
          child.on('close', (code) => resolve(code || 0))
        })

        // Should show initialization messages
        expect(stdout).toContain('Starting web automation')
        expect(stdout).toContain('Script:')
        expect(stdout).toContain('Browser:')
      } finally {
        // Clean up
        try {
          await fs.unlink(quickScriptPath)
        } catch {
          // Ignore cleanup errors
        }
      }
    }, 10000)
  })
}) 