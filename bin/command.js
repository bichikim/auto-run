#!/usr/bin/env node

import {Command} from 'commander'
import {readFile} from 'fs/promises'
import {existsSync} from 'fs'
import {join, resolve} from 'path'
import {defineConfig} from '../dist/config/index.js'
import {
  executeScriptFromFile,
  executeScriptFromString,
  formatExecutionResult,
  saveExecutionResult,
} from '../dist/executor/engine.js'
import {validateScript, formatValidationResults} from '../dist/actions/validator.js'
import {parseScriptFromFile, parseScriptFromString} from '../dist/actions/parser.js'

const program = new Command()

// Read package.json for version
async function getVersion() {
  try {
    const packageJson = await readFile('../package.json', 'utf-8')
    const pkg = JSON.parse(packageJson)
    return pkg.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

/**
 * Load configuration from file
 */
async function loadConfig(configPath) {
  const configFile = configPath || 'auto.config.mts'
  const fullPath = resolve(configFile)

  if (!existsSync(fullPath)) {
    console.log(`⚠️  Configuration file not found: ${configFile}`)
    console.log('Using default configuration...')
    return defineConfig()
  }

  try {
    // Dynamic import for ESM modules
    const configModule = await import(`file://${fullPath}`)
    const config = configModule.default || configModule.config
    
    if (typeof config === 'function') {
      return config()
    } else if (typeof config === 'object') {
      return defineConfig(config)
    } else {
      console.log('⚠️  Invalid configuration format, using defaults')
      return defineConfig()
    }
  } catch (error) {
    console.error(`❌ Failed to load configuration: ${error.message}`)
    console.log('Using default configuration...')
    return defineConfig()
  }
}

/**
 * Execute automation script
 */
async function executeCommand(scriptPath, options) {
  try {
    // Load configuration
    const config = await loadConfig(options.config)
    
    // Override config with CLI options
    if (options.browser) {
      config.browser.type = options.browser
    }
    if (options.headless !== undefined) {
      config.browser.headless = options.headless
    }
    if (options.verbose !== undefined) {
      config.logging.verbose = options.verbose
    }

    console.log('🚀 Starting web automation...')
    console.log(`📄 Script: ${scriptPath}`)
    console.log(`🌐 Browser: ${config.browser.type}`)
    console.log(`👁️  Headless: ${config.browser.headless}`)
    console.log()

    const startTime = Date.now()
    const result = await executeScriptFromFile(scriptPath, config)

    if (result.success) {
      const executionTime = Date.now() - startTime
      console.log('✅ Execution completed successfully!')
      
      if (options.output) {
        const saveResult = await saveExecutionResult(result.data, options.output)
        if (saveResult.success) {
          console.log(`📁 Results saved to: ${options.output}`)
        } else {
          console.error(`❌ Failed to save results: ${saveResult.error}`)
        }
      }

      // Show execution summary
      if (options.verbose || config.logging.verbose) {
        console.log()
        console.log(formatExecutionResult(result.data))
      } else {
        console.log(`⏱️  Total time: ${executionTime}ms`)
        console.log(`📊 Steps: ${result.data.stepsExecuted}/${result.data.totalSteps}`)
        if (result.data.screenshots.length > 0) {
          console.log(`📸 Screenshots: ${result.data.screenshots.length}`)
        }
      }
      
      // Show logging information
      if (result.data.sessionId) {
        console.log(`🆔 Session ID: ${result.data.sessionId}`)
      }
      if (result.data.logFilePath) {
        console.log(`📝 Log file: ${result.data.logFilePath}`)
      }
    } else {
      console.error('❌ Execution failed!')
      console.error(result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
    if (options.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

/**
 * Validate script command
 */
async function validateCommand(scriptPath, options) {
  try {
    console.log('🔍 Validating script...')
    console.log(`📄 Script: ${scriptPath}`)
    console.log()

    const parseResult = await parseScriptFromFile(scriptPath)
    if (!parseResult.success) {
      console.error('❌ Script parsing failed!')
      console.error(parseResult.error)
      process.exit(1)
    }

    const validationResult = validateScript(parseResult.data)
    const formattedResult = formatValidationResults(validationResult)

    if (validationResult.valid) {
      console.log('✅ Script validation passed!')
      
      if (validationResult.warnings.length > 0) {
        console.log()
        console.log('⚠️  Warnings:')
        console.log(formattedResult)
      }
      
      console.log()
      console.log(`📊 Script info:`)
      console.log(`   Name: ${parseResult.data.name}`)
      console.log(`   Description: ${parseResult.data.description || 'No description'}`)
      console.log(`   Steps: ${parseResult.data.steps.length}`)
      
      if (parseResult.data.baseUrl) {
        console.log(`   Base URL: ${parseResult.data.baseUrl}`)
      }
    } else {
      console.error('❌ Script validation failed!')
      console.error(formattedResult)
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
    if (options.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

/**
 * Create example script command
 */
async function createExampleCommand(outputPath = 'example-script.json') {
  const exampleScript = {
    name: 'Example Automation Script',
    description: 'A simple example demonstrating basic web automation',
    baseUrl: 'https://example.com',
    steps: [
      {
        type: 'navigate',
        url: 'https://example.com',
        timeout: 10000
      },
      {
        type: 'wait',
        timeout: 2000
      },
      {
        type: 'screenshot'
      },
      {
        type: 'click',
        selector: 'button#submit',
        timeout: 5000
      },
      {
        type: 'type',
        selector: 'input[name="search"]',
        value: 'Hello World',
        timeout: 5000
      },
      {
        type: 'select',
        selector: 'select#category',
        value: 'technology',
        timeout: 5000
      },
      {
        type: 'scroll',
        selector: 'body',
        value: 500
      },
      {
        type: 'wait',
        timeout: 1000
      },
      {
        type: 'screenshot'
      }
    ]
  }

  try {
    await writeFile(outputPath, JSON.stringify(exampleScript, null, 2))
    console.log('✅ Example script created!')
    console.log(`📄 File: ${outputPath}`)
    console.log()
    console.log('You can now run it with:')
    console.log(`  node command.js run ${outputPath}`)
    console.log()
    console.log('Or validate it with:')
    console.log(`  node command.js validate ${outputPath}`)
  } catch (error) {
    console.error('❌ Failed to create example script:', error.message)
    process.exit(1)
  }
}

/**
 * Initialize CLI
 */
async function initializeCLI() {
  const version = await getVersion()
  
  program
    .name('auto')
    .description('Web automation tool powered by Playwright')
    .version(version, '-v, --version', 'display version number')

  // Run command
  program
    .command('run')
    .description('Execute an automation script')
    .argument('<script>', 'path to the automation script (JSON file)')
    .option('-c, --config <path>', 'path to configuration file', 'auto.config.mts')
    .option('-b, --browser <type>', 'browser type (chromium, firefox, webkit)')
    .option('--headless [value]', 'run in headless mode', true)
    .option('--no-headless', 'run in headed mode')
    .option('-o, --output <path>', 'save execution results to file')
    .option('-v, --verbose', 'enable verbose output')
    .action(executeCommand)

  // Validate command
  program
    .command('validate')
    .description('Validate an automation script without executing it')
    .argument('<script>', 'path to the automation script (JSON file)')
    .option('-v, --verbose', 'enable verbose output')
    .action(validateCommand)

  // Create example command
  program
    .command('example')
    .description('Create an example automation script')
    .argument('[output]', 'output file path', 'example-script.json')
    .action(createExampleCommand)

  // Config command
  program
    .command('config')
    .description('Show current configuration')
    .option('-c, --config <path>', 'path to configuration file', 'auto.config.mts')
    .action(async (options) => {
      try {
        const config = await loadConfig(options.config)
        console.log('📋 Current configuration:')
        console.log()
        console.log(JSON.stringify(config, null, 2))
      } catch (error) {
        console.error('❌ Failed to load configuration:', error.message)
        process.exit(1)
      }
    })

  // Parse and execute
  program.parse()
}

// Fix import for writeFile
async function writeFile(path, content) {
  const fs = await import('fs/promises')
  return fs.writeFile(path, content, 'utf-8')
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason)
  process.exit(1)
})

// Start CLI
initializeCLI().catch((error) => {
  console.error('💥 Failed to initialize CLI:', error.message)
  process.exit(1)
}) 