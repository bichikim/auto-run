# Action Reference Guide

This document provides a comprehensive reference for all available actions in the Web Automation Tool.

## Action Structure

Each action has the following basic structure:

```json
{
  "type": "action-type",
  "description": "Optional description of what this action does",
  // ... action-specific properties
}
```

### Common Properties

All actions support these optional properties:

- `description` (string): Human-readable description of the action
- `optional` (boolean): If true, failures won't stop script execution
- `timeout` (number): Override default timeout for this action (in milliseconds)

## Navigation Actions

### navigate
Navigate to a specific URL.

**Syntax:**
```json
{
  "type": "navigate",
  "url": "https://example.com",
  "description": "Navigate to example.com"
}
```

**Properties:**
- `url` (required): The URL to navigate to
- `waitForLoad` (optional): Wait for page load event (default: true)

**Example:**
```json
{
  "type": "navigate",
  "url": "https://github.com",
  "waitForLoad": true,
  "timeout": 10000,
  "description": "Go to GitHub homepage"
}
```

### reload
Reload the current page.

**Syntax:**
```json
{
  "type": "reload",
  "description": "Refresh the page"
}
```

**Properties:**
- `waitForLoad` (optional): Wait for page load event (default: true)

### back
Go back in browser history.

**Syntax:**
```json
{
  "type": "back",
  "description": "Go back to previous page"
}
```

### forward
Go forward in browser history.

**Syntax:**
```json
{
  "type": "forward",
  "description": "Go forward to next page"
}
```

## Element Interaction Actions

### click
Click on an element.

**Syntax:**
```json
{
  "type": "click",
  "selector": "#submit-button",
  "description": "Click the submit button"
}
```

**Properties:**
- `selector` (required): CSS selector for the element
- `button` (optional): Mouse button to use ("left", "right", "middle", default: "left")
- `clickCount` (optional): Number of clicks (default: 1)
- `force` (optional): Force click even if element is not visible (default: false)

**Examples:**
```json
// Basic click
{
  "type": "click",
  "selector": "#login-button"
}

// Right click
{
  "type": "click",
  "selector": ".context-menu-target",
  "button": "right"
}

// Double click
{
  "type": "click",
  "selector": ".file-icon",
  "clickCount": 2
}
```

### type
Type text into an input field.

**Syntax:**
```json
{
  "type": "type",
  "selector": "input[name='email']",
  "value": "user@example.com",
  "description": "Enter email address"
}
```

**Properties:**
- `selector` (required): CSS selector for the input element
- `value` (required): Text to type
- `clear` (optional): Clear existing text before typing (default: true)
- `delay` (optional): Delay between keystrokes in milliseconds

**Examples:**
```json
// Basic text input
{
  "type": "type",
  "selector": "#search-input",
  "value": "web automation"
}

// Append to existing text
{
  "type": "type",
  "selector": "#comment",
  "value": " Additional comment.",
  "clear": false
}

// Slow typing
{
  "type": "type",
  "selector": "#slow-input",
  "value": "Slow typing",
  "delay": 100
}
```

### select
Select an option from a dropdown or select element.

**Syntax:**
```json
{
  "type": "select",
  "selector": "select[name='country']",
  "value": "United States",
  "description": "Select country"
}
```

**Properties:**
- `selector` (required): CSS selector for the select element
- `value` (required): Value or text of option to select
- `by` (optional): Selection method ("value", "text", "index", default: "value")

**Examples:**
```json
// Select by value
{
  "type": "select",
  "selector": "#country",
  "value": "us"
}

// Select by visible text
{
  "type": "select",
  "selector": "#country",
  "value": "United States",
  "by": "text"
}

// Select by index (0-based)
{
  "type": "select",
  "selector": "#country",
  "value": "2",
  "by": "index"
}
```

### check
Check or uncheck a checkbox or radio button.

**Syntax:**
```json
{
  "type": "check",
  "selector": "input[name='newsletter']",
  "checked": true,
  "description": "Subscribe to newsletter"
}
```

**Properties:**
- `selector` (required): CSS selector for the checkbox/radio element
- `checked` (optional): Whether to check (true) or uncheck (false), default: true

**Examples:**
```json
// Check a checkbox
{
  "type": "check",
  "selector": "#agree-terms"
}

// Uncheck a checkbox
{
  "type": "check",
  "selector": "#marketing-emails",
  "checked": false
}
```

### hover
Hover the mouse over an element.

**Syntax:**
```json
{
  "type": "hover",
  "selector": ".dropdown-trigger",
  "description": "Hover over dropdown menu"
}
```

**Properties:**
- `selector` (required): CSS selector for the element

### focus
Focus on an element.

**Syntax:**
```json
{
  "type": "focus",
  "selector": "#search-input",
  "description": "Focus on search field"
}
```

**Properties:**
- `selector` (required): CSS selector for the element

## Waiting Actions

### wait
Wait for an element to appear or for a specific amount of time.

**Syntax:**
```json
{
  "type": "wait",
  "selector": ".loading-spinner",
  "timeout": 10000,
  "description": "Wait for loading to complete"
}
```

**Properties:**
- `selector` (optional): CSS selector to wait for
- `timeout` (required if no selector): Time to wait in milliseconds
- `state` (optional): Element state to wait for ("visible", "hidden", "attached", "detached")

**Examples:**
```json
// Wait for element to appear
{
  "type": "wait",
  "selector": "#dynamic-content",
  "timeout": 5000
}

// Wait for specific time
{
  "type": "wait",
  "timeout": 3000
}

// Wait for element to be hidden
{
  "type": "wait",
  "selector": ".loading-overlay",
  "state": "hidden",
  "timeout": 10000
}
```

### waitForText
Wait for specific text to appear on the page.

**Syntax:**
```json
{
  "type": "waitForText",
  "text": "Welcome, John!",
  "timeout": 5000,
  "description": "Wait for welcome message"
}
```

**Properties:**
- `text` (required): Text to wait for
- `selector` (optional): Limit search to specific element
- `timeout` (optional): Maximum time to wait

### waitForUrl
Wait for the URL to match a pattern.

**Syntax:**
```json
{
  "type": "waitForUrl",
  "pattern": "**/dashboard",
  "timeout": 10000,
  "description": "Wait for dashboard page"
}
```

**Properties:**
- `pattern` (required): URL pattern to match (supports wildcards)
- `timeout` (optional): Maximum time to wait

## Data Operations

### extract
Extract data from page elements.

**Syntax:**
```json
{
  "type": "extract",
  "selector": ".product-price",
  "attribute": "text",
  "variable": "prices",
  "description": "Extract all product prices"
}
```

**Properties:**
- `selector` (required): CSS selector for elements
- `attribute` (required): Attribute to extract ("text", "href", "src", etc.)
- `variable` (required): Variable name to store extracted data
- `multiple` (optional): Extract from all matching elements (default: true)

**Examples:**
```json
// Extract text content
{
  "type": "extract",
  "selector": "h1",
  "attribute": "text",
  "variable": "page_title"
}

// Extract links
{
  "type": "extract",
  "selector": "a",
  "attribute": "href",
  "variable": "all_links"
}

// Extract single element
{
  "type": "extract",
  "selector": "#main-title",
  "attribute": "text",
  "variable": "title",
  "multiple": false
}
```

### screenshot
Take a screenshot of the page or specific element.

**Syntax:**
```json
{
  "type": "screenshot",
  "description": "Capture page state"
}
```

**Properties:**
- `selector` (optional): CSS selector for element to capture
- `filename` (optional): Custom filename for screenshot
- `fullPage` (optional): Capture full page (default: true)

**Examples:**
```json
// Full page screenshot
{
  "type": "screenshot",
  "description": "Capture entire page"
}

// Element screenshot
{
  "type": "screenshot",
  "selector": "#main-content",
  "description": "Capture main content area"
}

// Custom filename
{
  "type": "screenshot",
  "filename": "login-form.png",
  "selector": "#login-form"
}
```

## Advanced Actions

### scroll
Scroll the page or an element.

**Syntax:**
```json
{
  "type": "scroll",
  "selector": "#scrollable-div",
  "direction": "down",
  "amount": 500,
  "description": "Scroll down in container"
}
```

**Properties:**
- `selector` (optional): Element to scroll (default: page)
- `direction` (required): "up", "down", "left", "right"
- `amount` (optional): Pixels to scroll (default: 100)
- `to` (optional): Scroll to specific element

**Examples:**
```json
// Scroll page down
{
  "type": "scroll",
  "direction": "down",
  "amount": 300
}

// Scroll to element
{
  "type": "scroll",
  "to": "#footer"
}
```

### iframe
Switch context to an iframe.

**Syntax:**
```json
{
  "type": "iframe",
  "selector": "#payment-frame",
  "description": "Switch to payment iframe"
}
```

**Properties:**
- `selector` (required): CSS selector for iframe element
- `exit` (optional): Exit iframe context (default: false)

### newTab
Open a new browser tab and switch to it.

**Syntax:**
```json
{
  "type": "newTab",
  "url": "https://example.com",
  "description": "Open link in new tab"
}
```

**Properties:**
- `url` (optional): URL to open in new tab

### closeTab
Close the current tab.

**Syntax:**
```json
{
  "type": "closeTab",
  "description": "Close current tab"
}
```

### switchTab
Switch to a different tab.

**Syntax:**
```json
{
  "type": "switchTab",
  "index": 0,
  "description": "Switch to first tab"
}
```

**Properties:**
- `index` (required): Tab index to switch to (0-based)

## Keyboard Actions

### keyPress
Press a keyboard key or key combination.

**Syntax:**
```json
{
  "type": "keyPress",
  "key": "Enter",
  "description": "Press Enter key"
}
```

**Properties:**
- `key` (required): Key to press ("Enter", "Tab", "Escape", etc.)
- `modifiers` (optional): Array of modifier keys (["Control", "Shift", etc.])

**Examples:**
```json
// Press Enter
{
  "type": "keyPress",
  "key": "Enter"
}

// Press Ctrl+A
{
  "type": "keyPress",
  "key": "a",
  "modifiers": ["Control"]
}

// Press Ctrl+Shift+T
{
  "type": "keyPress",
  "key": "t",
  "modifiers": ["Control", "Shift"]
}
```

## File Operations

### upload
Upload a file to a file input element.

**Syntax:**
```json
{
  "type": "upload",
  "selector": "input[type='file']",
  "file": "./documents/resume.pdf",
  "description": "Upload resume file"
}
```

**Properties:**
- `selector` (required): CSS selector for file input
- `file` (required): Path to file to upload

### download
Download a file by clicking a download link.

**Syntax:**
```json
{
  "type": "download",
  "selector": ".download-button",
  "directory": "./downloads",
  "description": "Download report"
}
```

**Properties:**
- `selector` (required): CSS selector for download trigger
- `directory` (optional): Directory to save file

## Conditional Actions

### if
Execute actions conditionally based on element presence.

**Syntax:**
```json
{
  "type": "if",
  "condition": {
    "selector": ".cookie-banner",
    "exists": true
  },
  "then": [
    {
      "type": "click",
      "selector": ".accept-cookies"
    }
  ],
  "description": "Accept cookies if banner appears"
}
```

**Properties:**
- `condition` (required): Condition to check
- `then` (required): Actions to execute if condition is true
- `else` (optional): Actions to execute if condition is false

## Variables and Data

### Variables in Actions
You can use variables extracted from previous actions:

```json
{
  "type": "type",
  "selector": "#search",
  "value": "${extracted_search_term}",
  "description": "Search using extracted term"
}
```

### Variable Substitution
Variables are substituted using `${variable_name}` syntax:

- `${variable_name}` - Simple variable substitution
- `${variable_name[0]}` - First item from array
- `${variable_name.property}` - Object property access

## Error Handling

### Retry Behavior
Actions automatically retry on failure based on configuration:

```json
{
  "type": "click",
  "selector": "#flaky-button",
  "retryAttempts": 5,
  "retryDelay": 1000
}
```

### Optional Actions
Mark actions as optional to continue on failure:

```json
{
  "type": "click",
  "selector": ".optional-popup-close",
  "optional": true,
  "description": "Close popup if it appears"
}
```

## Best Practices

### 1. Use Specific Selectors
```json
// Good
{"selector": "#user-menu-button"}
{"selector": "[data-testid='submit']"}

// Avoid
{"selector": ".btn"}
{"selector": "div > div > button"}
```

### 2. Add Meaningful Descriptions
```json
{
  "type": "click",
  "selector": "#checkout",
  "description": "Proceed to checkout process"
}
```

### 3. Wait Before Interacting
```json
{
  "type": "wait",
  "selector": "#dynamic-button",
  "timeout": 5000
},
{
  "type": "click",
  "selector": "#dynamic-button"
}
```

### 4. Handle Dynamic Content
```json
{
  "type": "waitForText",
  "text": "Loading complete",
  "timeout": 10000
},
{
  "type": "click",
  "selector": "#continue-button"
}
```

### 5. Use Screenshots for Debugging
```json
{
  "type": "screenshot",
  "description": "Before form submission"
},
{
  "type": "click",
  "selector": "#submit"
},
{
  "type": "screenshot",
  "description": "After form submission"
}
```

This reference covers all available actions in the Web Automation Tool. For more examples and use cases, check the `examples/` directory in the project. 