import {writeFile, mkdir, readdir, stat, unlink} from 'fs/promises'
import {existsSync} from 'fs'
import {join, dirname} from 'path'
import {AutoConfig} from '../config/index.js'

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: any
  step?: number
  duration?: number
  screenshot?: string
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel
  outputDir: string
  enableFileLogging: boolean
  enableConsoleLogging: boolean
  format: 'json' | 'text' | 'structured'
  maxFileSize: number // in MB
  maxFiles: number
  includeTimestamp: boolean
  includeStackTrace: boolean
}

/**
 * Screenshot metadata
 */
export interface ScreenshotInfo {
  filename: string
  path: string
  timestamp: Date
  step?: number
  type: 'success' | 'error' | 'debug'
  size: number
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private sessionId: string
  private logFilePath: string
  private screenshots: ScreenshotInfo[] = []

  constructor(autoConfig: AutoConfig) {
    this.sessionId = this.generateSessionId()
    this.config = this.createLoggerConfig(autoConfig)
    this.logFilePath = join(this.config.outputDir, `execution-${this.sessionId}.log`)
    
    // Ensure output directory exists
    this.ensureOutputDir()
  }

  /**
   * Create logger configuration from AutoConfig
   */
  private createLoggerConfig(autoConfig: AutoConfig): LoggerConfig {
    const levelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
    }

    return {
      level: levelMap[autoConfig.logging.level] || LogLevel.INFO,
      outputDir: autoConfig.logging.outputDir,
      enableFileLogging: true,
      enableConsoleLogging: true,
      format: 'structured',
      maxFileSize: 50, // 50MB
      maxFiles: 10,
      includeTimestamp: true,
      includeStackTrace: autoConfig.logging.level === 'debug',
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      if (!existsSync(this.config.outputDir)) {
        await mkdir(this.config.outputDir, {recursive: true})
      }
      
      // Create subdirectories
      const screenshotDir = join(this.config.outputDir, 'screenshots')
      if (!existsSync(screenshotDir)) {
        await mkdir(screenshotDir, {recursive: true})
      }
    } catch (error) {
      console.error('Failed to create output directory:', error)
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, step?: number): void {
    this.log(LogLevel.DEBUG, 'debug', message, data, step)
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, step?: number): void {
    this.log(LogLevel.INFO, 'info', message, data, step)
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, step?: number): void {
    this.log(LogLevel.WARN, 'warn', message, data, step)
  }

  /**
   * Log error message
   */
  error(message: string, data?: any, step?: number): void {
    this.log(LogLevel.ERROR, 'error', message, data, step)
  }

  /**
   * Log step execution
   */
  step(stepNumber: number, action: string, message: string, duration?: number, success: boolean = true): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR
    const category = `step-${action}`
    this.log(level, category, message, {stepNumber, action, success}, stepNumber, duration)
  }

  /**
   * Log browser action
   */
  browser(action: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, 'browser', message, {action, ...data})
  }

  /**
   * Log validation result
   */
  validation(message: string, errors?: any[], warnings?: string[]): void {
    let level: LogLevel
    if (errors && errors.length > 0) {
      level = LogLevel.ERROR
    } else if (warnings && warnings.length > 0) {
      level = LogLevel.WARN
    } else {
      level = LogLevel.INFO
    }
    this.log(level, 'validation', message, {errors, warnings})
  }

  /**
   * Log screenshot capture
   */
  async screenshot(
    screenshotPath: string, 
    step?: number, 
    type: 'success' | 'error' | 'debug' = 'success'
  ): Promise<void> {
    try {
      const stats = await stat(screenshotPath)
      const screenshotInfo: ScreenshotInfo = {
        filename: screenshotPath.split('/').pop() || 'unknown',
        path: screenshotPath,
        timestamp: new Date(),
        step,
        type,
        size: stats.size,
      }
      
      this.screenshots.push(screenshotInfo)
      this.log(LogLevel.INFO, 'screenshot', `Screenshot captured: ${screenshotInfo.filename}`, screenshotInfo, step)
    } catch (error) {
      this.error('Failed to process screenshot metadata', {error: String(error), path: screenshotPath})
    }
  }

  /**
   * Main logging method
   */
  private log(
    level: LogLevel, 
    category: string, 
    message: string, 
    data?: any, 
    step?: number, 
    duration?: number
  ): void {
    // Check if log level is enabled
    if (level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      step,
      duration,
    }

    // Add to buffer
    this.logBuffer.push(entry)

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.writeToConsole(entry)
    }

    // File logging (async, non-blocking)
    if (this.config.enableFileLogging) {
      this.writeToFile(entry).catch(error => {
        console.error('Failed to write log to file:', error)
      })
    }
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString().split('T')[1].split('.')[0]
    const levelName = LogLevel[entry.level]
    const stepInfo = entry.step ? ` [Step ${entry.step}]` : ''
    const duration = entry.duration ? ` (${entry.duration}ms)` : ''
    
    let icon = ''
    let colorCode = ''
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        icon = '🔍'
        colorCode = '\x1b[36m' // cyan
        break
      case LogLevel.INFO:
        icon = '📝'
        colorCode = '\x1b[37m' // white
        break
      case LogLevel.WARN:
        icon = '⚠️'
        colorCode = '\x1b[33m' // yellow
        break
      case LogLevel.ERROR:
        icon = '❌'
        colorCode = '\x1b[31m' // red
        break
    }

    const resetCode = '\x1b[0m'
    const formattedMessage = `${colorCode}${timestamp} ${icon} [${levelName}]${stepInfo} ${entry.message}${duration}${resetCode}`
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage)
        if (entry.data && this.config.includeStackTrace) {
          console.error(colorCode, JSON.stringify(entry.data, null, 2), resetCode)
        }
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      default:
        console.log(formattedMessage)
        if (entry.data && entry.level === LogLevel.DEBUG) {
          console.log(colorCode, JSON.stringify(entry.data, null, 2), resetCode)
        }
    }
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      let formattedEntry: string

      switch (this.config.format) {
        case 'json':
          formattedEntry = JSON.stringify(entry) + '\n'
          break
        case 'structured':
          const timestamp = entry.timestamp.toISOString()
          const levelName = LogLevel[entry.level].padEnd(5)
          const stepInfo = entry.step ? ` [Step ${entry.step}]` : ''
          const duration = entry.duration ? ` (${entry.duration}ms)` : ''
          formattedEntry = `${timestamp} ${levelName} [${entry.category}]${stepInfo} ${entry.message}${duration}\n`
          if (entry.data) {
            formattedEntry += `  Data: ${JSON.stringify(entry.data)}\n`
          }
          break
        default:
          formattedEntry = `${entry.timestamp.toISOString()} [${LogLevel[entry.level]}] ${entry.message}\n`
      }

      await writeFile(this.logFilePath, formattedEntry, {flag: 'a'})
      
      // Check file size and rotate if necessary
      await this.rotateLogIfNeeded()
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  /**
   * Rotate log file if it exceeds size limit
   */
  private async rotateLogIfNeeded(): Promise<void> {
    try {
      const stats = await stat(this.logFilePath)
      const fileSizeMB = stats.size / (1024 * 1024)
      
      if (fileSizeMB > this.config.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const rotatedPath = this.logFilePath.replace('.log', `-${timestamp}.log`)
        
        // Rename current log file
        await writeFile(rotatedPath, await readdir(this.logFilePath))
        await unlink(this.logFilePath)
        
        // Clean up old log files
        await this.cleanupOldLogs()
      }
    } catch (error) {
      // Ignore rotation errors to prevent logging loops
    }
  }

  /**
   * Clean up old log files exceeding max count
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await readdir(this.config.outputDir)
      const logFiles = files
        .filter(file => file.endsWith('.log') && file.includes('execution-'))
        .map(async file => {
          const filePath = join(this.config.outputDir, file)
          const stats = await stat(filePath)
          return {path: filePath, mtime: stats.mtime}
        })
      
      const resolvedFiles = await Promise.all(logFiles)
      resolvedFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      
      // Delete files beyond maxFiles limit
      const filesToDelete = resolvedFiles.slice(this.config.maxFiles)
      for (const file of filesToDelete) {
        await unlink(file.path)
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get session summary
   */
  getSessionSummary(): {
    sessionId: string
    totalLogs: number
    logsByLevel: Record<string, number>
    screenshots: ScreenshotInfo[]
    duration: number
    logFilePath: string
  } {
    const logsByLevel = this.logBuffer.reduce((acc, entry) => {
      const levelName = LogLevel[entry.level]
      acc[levelName] = (acc[levelName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const firstLog = this.logBuffer[0]
    const lastLog = this.logBuffer[this.logBuffer.length - 1]
    const duration = firstLog && lastLog 
      ? lastLog.timestamp.getTime() - firstLog.timestamp.getTime()
      : 0

    return {
      sessionId: this.sessionId,
      totalLogs: this.logBuffer.length,
      logsByLevel,
      screenshots: this.screenshots,
      duration,
      logFilePath: this.logFilePath,
    }
  }

  /**
   * Get execution timeline
   */
  getExecutionTimeline(): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.category.startsWith('step-') || entry.category === 'browser')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  /**
   * Export logs to JSON file
   */
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const exportPath = join(
      this.config.outputDir, 
      `execution-${this.sessionId}-export.${format}`
    )

    try {
      if (format === 'json') {
        const exportData = {
          sessionId: this.sessionId,
          summary: this.getSessionSummary(),
          logs: this.logBuffer,
          timeline: this.getExecutionTimeline(),
        }
        await writeFile(exportPath, JSON.stringify(exportData, null, 2))
      } else if (format === 'csv') {
        const csvHeader = 'timestamp,level,category,step,message,duration\n'
        const csvRows = this.logBuffer.map(entry => {
          const timestamp = entry.timestamp.toISOString()
          const level = LogLevel[entry.level]
          const step = entry.step || ''
          const message = entry.message.replace(/"/g, '""') // Escape quotes
          const duration = entry.duration || ''
          return `"${timestamp}","${level}","${entry.category}","${step}","${message}","${duration}"`
        }).join('\n')
        
        await writeFile(exportPath, csvHeader + csvRows)
      }

      return exportPath
    } catch (error) {
      throw new Error(`Failed to export logs: ${error}`)
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.config.enableFileLogging && this.logBuffer.length > 0) {
      // Write final summary
      const summary = this.getSessionSummary()
      await this.writeToFile({
        timestamp: new Date(),
        level: LogLevel.INFO,
        category: 'session',
        message: 'Session completed',
        data: summary,
      })
    }
  }
}

/**
 * Create logger instance from AutoConfig
 */
export function createLogger(config: AutoConfig): Logger {
  return new Logger(config)
}

/**
 * Format execution summary for console output
 */
export function formatExecutionSummary(logger: Logger): string {
  const summary = logger.getSessionSummary()
  const lines: string[] = []
  
  lines.push('📊 EXECUTION SUMMARY')
  lines.push('='.repeat(40))
  lines.push(`Session ID: ${summary.sessionId}`)
  lines.push(`Duration: ${Math.round(summary.duration / 1000)}s`)
  lines.push(`Total Logs: ${summary.totalLogs}`)
  lines.push('')
  
  lines.push('Logs by Level:')
  Object.entries(summary.logsByLevel).forEach(([level, count]) => {
    const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'INFO' ? '📝' : '🔍'
    lines.push(`  ${icon} ${level}: ${count}`)
  })
  
  if (summary.screenshots.length > 0) {
    lines.push('')
    lines.push(`Screenshots: ${summary.screenshots.length}`)
    summary.screenshots.forEach(screenshot => {
      const icon = screenshot.type === 'error' ? '❌' : screenshot.type === 'success' ? '📸' : '🔍'
      const stepInfo = screenshot.step ? ` [Step ${screenshot.step}]` : ''
      lines.push(`  ${icon}${stepInfo} ${screenshot.filename} (${Math.round(screenshot.size / 1024)}KB)`)
    })
  }
  
  lines.push('')
  lines.push(`Log file: ${summary.logFilePath}`)
  lines.push('='.repeat(40))
  
  return lines.join('\n')
} 