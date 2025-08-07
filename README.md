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
- 🎭 **Alert Handling**: Built-in support for browser alerts, confirms, and prompts
- 🖼️ **Iframe Support**: Seamless interaction with iframe elements
- 🔧 **Variable Substitution**: Environment variable support with `${env>VAR_NAME}` syntax
- ✅ **Advanced Validation**: Comprehensive script validation with warnings
- 🛠️ **Enhanced CLI**: Improved command-line interface with multiple commands

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

## CLI Commands

### Run Script
```bash
# Basic usage
node bin/command.js run <script-file>

# With custom configuration
node bin/command.js run <script-file> --config <config-file>

# With output file
node bin/command.js run <script-file> --output results.json

# With browser options
node bin/command.js run <script-file> --browser firefox --no-headless
```

### Validate Script
```bash
# Validate without executing
node bin/command.js validate <script-file>

# With verbose output
node bin/command.js validate <script-file> --verbose
```

### Create Example
```bash
# Create example script
node bin/command.js example

# Create with custom name
node bin/command.js example my-script.json
```

### Show Configuration
```bash
# Show current configuration
node bin/command.js config

# Show with custom config file
node bin/command.js config --config custom.config.mts
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
- `alert` - Handle browser alerts, confirms, and prompts

## Action Examples

### Basic Click
```json
{
  "type": "click",
  "selector": "#submit-button",
  "description": "Click submit button"
}
```

### Type Text with Variable
```json
{
  "type": "type",
  "selector": "input[name='email']",
  "value": "${.env>EMAIL_ADDRESS}",
  "description": "Enter email from environment variable"
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

### Iframe Interaction
```json
{
  "type": "click",
  "selector": "#submit-btn",
  "frame": "iframe[name='main-frame']",
  "description": "Click button inside iframe"
}
```

### Alert Handling
```json
{
  "type": "alert",
  "value": "accept",
  "promptText": "John Doe",
  "description": "Accept alert with text input"
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

## Variable Substitution

The tool supports environment variable substitution using the `${env>VAR_NAME}` syntax:

```json
{
  "type": "type",
  "selector": "#password",
  "value": "${.env>USER_PASSWORD}",
  "description": "Type password from environment"
}
```

### Environment File Support

You can use different environment files:
- `${env>VAR}` - Uses `.env` file
- `${env.production>VAR}` - Uses `.env.production` file
- `${env.staging>VAR}` - Uses `.env.staging` file

## Examples

The `examples/` directory contains several complete automation scripts:

- **basic-navigation.json** - Simple page navigation and interaction
- **form-filling.json** - Automated form completion
- **data-extraction.json** - Web scraping example
- **e-commerce.json** - Shopping cart automation
- **alert-example.json** - Browser alert handling
- **e-hr-auto.json** - Real-world automation with iframe and variables
- **config.json** - Example configuration file

### Running Examples

```bash
# Run with default configuration
node bin/command.js run examples/basic-navigation.json

# Run with custom configuration
node bin/command.js run examples/form-filling.json --config examples/config.json

# Run in headless mode
HEADLESS=true node bin/command.js run examples/data-extraction.json

# Validate script before running
node bin/command.js validate examples/e-hr-auto.json
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

## Advanced Features

### Alert Handling

The tool can handle various browser dialogs:

```json
{
  "type": "alert",
  "value": "accept",        // "accept" or "dismiss"
  "promptText": "John Doe", // Optional text for prompts
  "description": "Handle alert dialog"
}
```

### Iframe Support

Interact with elements inside iframes:

```json
{
  "type": "click",
  "selector": "#button",
  "frame": "iframe[name='content']",
  "description": "Click button inside iframe"
}
```

### Enhanced Validation

Scripts are validated with comprehensive checks:

```bash
# Validate script
node bin/command.js validate my-script.json
```

Validation includes:
- Syntax and structure validation
- Selector format checking
- URL validation
- Performance warnings
- Best practice suggestions

### Smart Error Handling

- **Automatic Retries**: Retry failed actions with exponential backoff
- **Error Classification**: Categorize errors for better debugging
- **Screenshot on Error**: Automatic screenshots when errors occur
- **Graceful Degradation**: Continue execution when possible

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
