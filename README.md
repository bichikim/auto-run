# Web Automation Tool

A powerful, TypeScript-based web automation tool that allows you to automate browser interactions using simple JSON configuration files.

## Features

- 🚀 **Easy to Use**: Write automation scripts in simple JSON format
- 🌐 **Multi-Browser Support**: Chromium, Firefox, and WebKit
- 📝 **Comprehensive Logging**: Detailed execution logs with screenshots
- ⚡ **Smart Error Handling**: Automatic retries and error classification
- 🎯 **Flexible Configuration**: Customizable browser settings and behavior
- 📸 **Screenshot Capture**: Automatic screenshots on errors and manual captures
- 🔄 **Retry Logic**: Smart retry mechanisms for flaky elements
- 📊 **Detailed Reporting**: Execution summaries and performance metrics

## Installation

```bash
npm install
npm run build
```

## Quick Start

1. **Create a script file** (e.g., `my-script.json`):

```json
{
  "name": "My First Script",
  "description": "A simple automation script",
  "steps": [
    {
      "type": "navigate",
      "url": "https://example.com",
      "description": "Go to example.com"
    },
    {
      "type": "screenshot",
      "description": "Take a screenshot"
    }
  ]
}
```

2. **Run the script**:

```bash
node bin/command.js run my-script.json
```

## Configuration

### Browser Configuration

```json
{
  "browser": {
    "type": "chromium",           // chromium | firefox | webkit
    "headless": false,            // Run in headless mode
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "slowMo": 500,               // Slow down actions (ms)
    "timeout": 30000             // Default timeout (ms)
  }
}
```

### Action Configuration

```json
{
  "actions": {
    "waitBetweenActions": 1500,   // Wait between actions (ms)
    "retryAttempts": 3,           // Number of retry attempts
    "screenshotOnError": true     // Auto-screenshot on errors
  }
}
```

### Logging Configuration

```json
{
  "logging": {
    "level": "info",              // debug | info | warn | error
    "outputDir": "./logs",        // Log output directory
    "saveScreenshots": true,      // Save screenshots
    "verbose": true               // Detailed logging
  }
}
```

## Available Actions

### Navigation
- `navigate` - Navigate to a URL
- `reload` - Reload the current page
- `back` - Go back in browser history
- `forward` - Go forward in browser history

### Element Interaction
- `click` - Click on an element
- `type` - Type text into an input field
- `select` - Select option from dropdown
- `check` - Check/uncheck checkbox
- `hover` - Hover over an element

### Waiting
- `wait` - Wait for element to appear
- `waitForText` - Wait for specific text to appear
- `waitForUrl` - Wait for URL to match pattern

### Data Operations
- `extract` - Extract data from elements
- `screenshot` - Take a screenshot

### Advanced
- `scroll` - Scroll to element or position
- `iframe` - Switch to iframe context
- `newTab` - Open new browser tab

## Action Examples

### Basic Click
```json
{
  "type": "click",
  "selector": "#submit-button",
  "description": "Click submit button"
}
```

### Type Text
```json
{
  "type": "type",
  "selector": "input[name='email']",
  "value": "user@example.com",
  "description": "Enter email address"
}
```

### Wait for Element
```json
{
  "type": "wait",
  "selector": ".loading-spinner",
  "timeout": 5000,
  "description": "Wait for loading to complete"
}
```

### Extract Data
```json
{
  "type": "extract",
  "selector": ".product-price",
  "attribute": "text",
  "variable": "prices",
  "description": "Extract all product prices"
}
```

### Conditional Actions
```json
{
  "type": "click",
  "selector": ".cookie-accept",
  "optional": true,
  "description": "Accept cookies if popup appears"
}
```

## Examples

The `examples/` directory contains several complete automation scripts:

- **basic-navigation.json** - Simple page navigation and interaction
- **form-filling.json** - Automated form completion
- **data-extraction.json** - Web scraping example
- **e-commerce.json** - Shopping cart automation
- **config.json** - Example configuration file

### Running Examples

```bash
# Run with default configuration
node bin/command.js run examples/basic-navigation.json

# Run with custom configuration
node bin/command.js run examples/form-filling.json --config examples/config.json

# Run in headless mode
HEADLESS=true node bin/command.js run examples/data-extraction.json
```

## Environment Variables

Override configuration settings using environment variables:

```bash
# Browser settings
BROWSER_TYPE=firefox
HEADLESS=true
VIEWPORT_WIDTH=1366
VIEWPORT_HEIGHT=768
SLOW_MO=1000
TIMEOUT=45000

# Action settings
WAIT_BETWEEN_ACTIONS=2000
RETRY_ATTEMPTS=5
SCREENSHOT_ON_ERROR=true

# Logging settings
LOG_LEVEL=debug
LOG_OUTPUT_DIR=./custom-logs
SAVE_SCREENSHOTS=true
VERBOSE=true
```

## CLI Usage

```bash
# Basic usage
node bin/command.js run <script-file>

# With custom configuration
node bin/command.js run <script-file> --config <config-file>

# With output file
node bin/command.js run <script-file> --output results.json

# Show help
node bin/command.js --help
```

## Logging and Debugging

### Log Levels
- **DEBUG**: Detailed execution information
- **INFO**: General execution progress
- **WARN**: Warning messages
- **ERROR**: Error conditions

### Log Output
Logs are saved to timestamped files in the configured output directory:
```
logs/
├── execution-2024-01-15T10-30-45-123Z.log
├── screenshots/
│   ├── step-1-success-2024-01-15T10-30-47-456Z.png
│   └── step-3-error-2024-01-15T10-30-50-789Z.png
└── exports/
    └── session-abc123-export.json
```

### Session Information
Each execution generates a unique session ID and comprehensive logging:
- Execution timeline
- Performance metrics
- Error analysis
- Screenshot metadata

## Error Handling

The tool includes intelligent error handling:

- **Smart Retries**: Automatic retries for network issues and element loading
- **Error Classification**: Categorizes errors for better debugging
- **Screenshot on Error**: Automatically captures screenshots when errors occur
- **Graceful Degradation**: Continues execution when possible

## Development

### Running Tests
```bash
npm test
```

### Building
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the examples directory for common use cases
- Review the error logs for debugging information
- Open an issue on the project repository
