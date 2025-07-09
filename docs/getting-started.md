# Getting Started with Web Automation Tool

This guide will help you get up and running with the Web Automation Tool quickly.

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Basic knowledge of JSON format
- Understanding of CSS selectors

## Installation

1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the project**:
   ```bash
   npm run build
   ```

## Your First Automation Script

Let's create a simple script that navigates to a website and takes a screenshot.

### Step 1: Create a Script File

Create a file called `my-first-script.json`:

```json
{
  "name": "My First Automation",
  "description": "A simple script to demonstrate basic functionality",
  "steps": [
    {
      "type": "navigate",
      "url": "https://example.com",
      "description": "Navigate to example.com"
    },
    {
      "type": "wait",
      "selector": "h1",
      "timeout": 5000,
      "description": "Wait for the main heading to load"
    },
    {
      "type": "screenshot",
      "description": "Take a screenshot of the page"
    }
  ]
}
```

### Step 2: Run the Script

Execute your script using the command line:

```bash
node bin/command.js run my-first-script.json
```

You should see output similar to:
```
✅ Script executed successfully!
📊 Execution Summary:
   - Total Steps: 3
   - Completed Steps: 3
   - Execution Time: 2.5s
   - Session ID: abc123def456
   - Log File: ./logs/execution-2024-01-15T10-30-45-123Z.log
```

### Step 3: Check the Results

After execution, you'll find:
- Screenshots in the `logs/screenshots/` directory
- Detailed logs in the `logs/` directory
- Session information for debugging

## Understanding Script Structure

### Script Metadata
```json
{
  "name": "Script Name",           // Human-readable name
  "description": "What it does",   // Description of the script's purpose
  "steps": [...]                  // Array of actions to perform
}
```

### Step Structure
Each step in the `steps` array has this basic structure:
```json
{
  "type": "action-type",           // Type of action (navigate, click, etc.)
  "description": "What it does",   // Optional description
  // ... action-specific properties
}
```

## Common Action Types

### 1. Navigation Actions

**Navigate to URL:**
```json
{
  "type": "navigate",
  "url": "https://example.com",
  "description": "Go to example.com"
}
```

**Reload page:**
```json
{
  "type": "reload",
  "description": "Refresh the current page"
}
```

### 2. Element Interaction

**Click on element:**
```json
{
  "type": "click",
  "selector": "#submit-button",
  "description": "Click the submit button"
}
```

**Type text:**
```json
{
  "type": "type",
  "selector": "input[name='email']",
  "value": "user@example.com",
  "description": "Enter email address"
}
```

**Select from dropdown:**
```json
{
  "type": "select",
  "selector": "select[name='country']",
  "value": "United States",
  "description": "Select country"
}
```

### 3. Waiting Actions

**Wait for element:**
```json
{
  "type": "wait",
  "selector": ".loading-indicator",
  "timeout": 10000,
  "description": "Wait for loading to complete"
}
```

**Wait for specific time:**
```json
{
  "type": "wait",
  "timeout": 3000,
  "description": "Wait 3 seconds"
}
```

### 4. Data Operations

**Take screenshot:**
```json
{
  "type": "screenshot",
  "description": "Capture current page state"
}
```

**Extract data:**
```json
{
  "type": "extract",
  "selector": ".product-title",
  "attribute": "text",
  "variable": "product_names",
  "description": "Extract all product titles"
}
```

## CSS Selectors Guide

Understanding CSS selectors is crucial for effective automation:

### Basic Selectors
- `#id` - Select by ID
- `.class` - Select by class name
- `element` - Select by tag name
- `[attribute]` - Select by attribute
- `[attribute="value"]` - Select by attribute value

### Examples
```json
// Click button with ID "submit"
{"type": "click", "selector": "#submit"}

// Click element with class "btn-primary"
{"type": "click", "selector": ".btn-primary"}

// Type in input with name="email"
{"type": "type", "selector": "input[name='email']", "value": "test@example.com"}

// Click the first button in a form
{"type": "click", "selector": "form button:first-child"}
```

## Configuration Options

### Creating a Configuration File

Create `config.json` to customize behavior:

```json
{
  "browser": {
    "type": "chromium",
    "headless": false,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "slowMo": 500
  },
  "actions": {
    "waitBetweenActions": 1000,
    "retryAttempts": 3,
    "screenshotOnError": true
  },
  "logging": {
    "level": "info",
    "outputDir": "./logs",
    "saveScreenshots": true,
    "verbose": true
  }
}
```

### Using Configuration

```bash
node bin/command.js run my-script.json --config config.json
```

## Environment Variables

Override settings without changing files:

```bash
# Run in headless mode
HEADLESS=true node bin/command.js run my-script.json

# Use Firefox instead of Chrome
BROWSER_TYPE=firefox node bin/command.js run my-script.json

# Increase wait time between actions
WAIT_BETWEEN_ACTIONS=2000 node bin/command.js run my-script.json
```

## Best Practices

### 1. Use Descriptive Names and Descriptions
```json
{
  "type": "click",
  "selector": "#checkout-button",
  "description": "Proceed to checkout page"
}
```

### 2. Wait for Elements Before Interacting
```json
{
  "type": "wait",
  "selector": "#dynamic-content",
  "timeout": 5000,
  "description": "Wait for content to load"
},
{
  "type": "click",
  "selector": "#dynamic-content button",
  "description": "Click the dynamic button"
}
```

### 3. Use Stable Selectors
Prefer IDs and data attributes over classes:
```json
// Good - stable selector
{"selector": "#user-menu"}
{"selector": "[data-testid='submit-btn']"}

// Avoid - fragile selector
{"selector": ".btn.btn-primary.large"}
```

### 4. Add Screenshots at Key Points
```json
{
  "type": "screenshot",
  "description": "Before form submission"
},
{
  "type": "click",
  "selector": "#submit",
  "description": "Submit form"
},
{
  "type": "screenshot",
  "description": "After form submission"
}
```

### 5. Handle Optional Elements
```json
{
  "type": "click",
  "selector": ".cookie-accept",
  "optional": true,
  "description": "Accept cookies if popup appears"
}
```

## Debugging Tips

### 1. Enable Verbose Logging
```bash
VERBOSE=true node bin/command.js run my-script.json
```

### 2. Run in Non-Headless Mode
```bash
HEADLESS=false node bin/command.js run my-script.json
```

### 3. Slow Down Actions
```bash
SLOW_MO=1000 node bin/command.js run my-script.json
```

### 4. Check the Logs
- Look at the console output for immediate feedback
- Check log files in the `logs/` directory for detailed information
- Review screenshots to see what the page looked like

### 5. Test Selectors
Use browser developer tools to test your CSS selectors:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Type: `document.querySelector("your-selector")`
4. Verify it returns the expected element

## Common Issues and Solutions

### Element Not Found
**Problem:** `Error: Element not found: #my-button`

**Solutions:**
- Verify the selector using browser dev tools
- Add a wait step before the action
- Check if the element is in an iframe
- Ensure the page has fully loaded

### Timeout Errors
**Problem:** `Error: Timeout waiting for element`

**Solutions:**
- Increase the timeout value
- Check if the element appears later in the page load
- Verify the selector is correct
- Add explicit wait steps

### Click Not Working
**Problem:** Element found but click has no effect

**Solutions:**
- Try hovering over the element first
- Check if element is covered by another element
- Use developer tools to verify the element is clickable
- Try waiting for element to be visible/enabled

## Next Steps

1. **Explore Examples**: Check the `examples/` directory for more complex scripts
2. **Read Action Reference**: Learn about all available actions in the documentation
3. **Practice with Real Sites**: Start with simple, public websites
4. **Join the Community**: Share your scripts and get help from other users

## Quick Reference

### Common Commands
```bash
# Run script
node bin/command.js run script.json

# Run with config
node bin/command.js run script.json --config config.json

# Run in headless mode
HEADLESS=true node bin/command.js run script.json

# Debug mode
VERBOSE=true HEADLESS=false node bin/command.js run script.json
```

### Essential Action Types
- `navigate` - Go to URL
- `click` - Click element
- `type` - Enter text
- `wait` - Wait for element/time
- `screenshot` - Capture image
- `select` - Choose dropdown option
- `extract` - Get data from page

Happy automating! 🚀 