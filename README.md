# Wepilot - AI-Powered Web Assistant

A Chrome extension that provides AI-powered web page interaction similar to GitHub Copilot, allowing users to interact with web pages through natural language commands.

## Features

- 🤖 **AI-Powered Assistance**: Chat with an AI assistant to interact with web pages
- 📝 **Form Filling**: Automatically fill forms with appropriate information
- 🔍 **Page Analysis**: Understand and navigate web page content
- 💬 **Natural Language Interface**: Communicate with the extension using natural language
- 🎯 **Smart Element Detection**: Automatically identify and interact with page elements
- 🔧 **Multi-browser Support**: Works on Chrome, Edge, Brave, and other Chromium-based browsers

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd wepilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Build Commands

- `npm run dev` - Start development with file watching
- `npm run build` - Build TypeScript files only
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run build:chrome` - Build and package specifically for Chrome
- `npm run build:edge` - Build and package specifically for Edge
- `npm run build:brave` - Build and package specifically for Brave
- `npm run build:all` - Build and package for all browsers
- `npm run validate` - Validate extension structure and files
- `npm run prepare-icons` - Generate icon files from source

### Browser-Specific Building

You can now build the extension for specific browsers to save time during development:

```bash
# Build only for Chrome (fastest for development)
npm run build:chrome

# Build only for Edge
npm run build:edge

# Build only for Brave
npm run build:brave

# Build for all browsers (default)
npm run build:all
```

The browser-specific builds will create the distribution package in `dist/[browser]/` and generate the corresponding ZIP file for store submission.

### Project Structure

```
wepilot/
├── src/
│   ├── background/          # Background script
│   ├── content/             # Content scripts
│   ├── popup/               # Extension popup
│   ├── sidebar/             # AI assistant sidebar
│   ├── options/             # Extension options page
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── scripts/                 # Build and packaging scripts
└── dist/                    # Built extension files
```

## Usage

1. **Open the Assistant**: Click the Wepilot icon in your browser toolbar or use the keyboard shortcut
2. **Start a Conversation**: Type your request in natural language
3. **Let AI Help**: The assistant will analyze the page and perform actions based on your instructions

### Example Commands

- "Fill this form with my contact information"
- "Find all the links on this page"
- "Click the submit button"
- "Extract the main content from this article"
- "Help me navigate to the checkout page"

## Configuration

Access the extension options by:
1. Right-clicking the extension icon
2. Selecting "Options"
3. Configure your preferences and API settings

## Browser Compatibility

- ✅ Google Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave Browser
- ✅ Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Privacy

Wepilot respects your privacy:
- No personal data is collected without consent
- Page content is processed locally when possible
- See our [Privacy Policy](PRIVACY.md) for full details
