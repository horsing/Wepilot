import { ExtensionSettings } from '../types';
import './options.css';

class OptionsApp {
  private container: HTMLElement;
  private settings: ExtensionSettings = {
    apiKey: '',
    aiProvider: 'local',
    enablePageAnalysis: true,
    enableFormFilling: true,
    keyboardShortcut: 'Ctrl+Shift+Y',
    theme: 'auto'
  };

  constructor() {
    this.container = document.getElementById('options-root')!;
    this.initialize();
  }

  private async initialize() {
    await this.loadSettings();
    await this.render();
    this.setupEventListeners();
  }

  private async loadSettings() {
    const result = await chrome.storage.sync.get([
      'apiKey',
      'aiProvider', 
      'enablePageAnalysis',
      'enableFormFilling',
      'keyboardShortcut',
      'theme',
      'ollamaUrl'
    ]);

    this.settings = { ...this.settings, ...result };
  }

  private async render() {
    this.container.innerHTML = `
      <div class="options-container">
        <header class="options-header">
          <div class="header-content">
            <div class="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
              <h1>Wepilot Settings</h1>
            </div>
            <div class="version">v1.0.0</div>
          </div>
        </header>

        <nav class="options-nav">
          <button class="nav-btn active" data-section="ai">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
            </svg>
            AI Provider
          </button>
          <button class="nav-btn" data-section="features">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
              <path d="M9 9H15V15H9Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Features
          </button>
          <button class="nav-btn" data-section="interface">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2"/>
            </svg>
            Interface
          </button>
          <button class="nav-btn" data-section="about">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M9.09 9A3 3 0 0 1 12 6A3 3 0 0 1 15 9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 17V12" stroke="currentColor" stroke-width="2"/>
            </svg>
            About
          </button>
        </nav>

        <main class="options-content">
          <section class="section active" data-section="ai">
            <div class="section-header">
              <h2>AI Provider Settings</h2>
              <p>Configure your preferred AI service for web automation</p>
            </div>

            <div class="setting-group">
              <h3>AI Service</h3>
              <div class="setting-item">
                <label for="provider-select">AI Provider</label>
                <select id="provider-select">
                  <option value="local">Local (Demo Mode)</option>
                  <option value="openai">OpenAI GPT</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
                <p class="setting-description">Choose your preferred AI service</p>
              </div>

              <div class="setting-item" id="api-key-container">
                <label for="api-key-input">API Key</label>
                <div class="input-with-button">
                  <input type="password" id="api-key-input" placeholder="Enter your API key" />
                  <button type="button" id="toggle-api-key">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
                <p class="setting-description">Your API key is stored securely and never shared</p>
              </div>

              <div class="setting-item" id="ollama-url-container">
                <label for="ollama-url-input">Ollama URL</label>
                <input type="text" id="ollama-url-input" placeholder="http://localhost:11434" />
                <p class="setting-description">URL for your local Ollama installation</p>
              </div>
            </div>

            <div class="warning-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18C1.64 18.37 1.64 18.82 1.82 19.19C2 19.56 2.37 19.78 2.77 19.78H21.23C21.63 19.78 22 19.56 22.18 19.19C22.36 18.82 22.36 18.37 22.18 18L13.71 3.86C13.53 3.49 13.16 3.27 12.76 3.27C12.36 3.27 11.99 3.49 11.81 3.86H10.29Z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 9V13" stroke="currentColor" stroke-width="2"/>
                <path d="M12 17H12.01" stroke="currentColor" stroke-width="2"/>
              </svg>
              <div>
                <strong>Privacy Notice:</strong> When using external AI providers, your page content may be sent to third-party services. Local mode and Ollama process everything locally for maximum privacy.
              </div>
            </div>

            <div class="provider-info" id="provider-info">
              <div class="provider-details">
                <h4>Provider Information</h4>
                <div id="provider-description"></div>
              </div>
            </div>
          </section>

          <section class="section" data-section="features">
            <div class="section-header">
              <h2>Feature Settings</h2>
              <p>Customize Wepilot's behavior and capabilities</p>
            </div>

            <div class="setting-group">
              <h3>Page Analysis</h3>
              <div class="setting-item">
                <div class="toggle-group">
                  <label for="enable-analysis">Automatic Page Analysis</label>
                  <label class="toggle">
                    <input type="checkbox" id="enable-analysis" />
                    <span class="slider"></span>
                  </label>
                </div>
                <p class="setting-description">Automatically analyze pages when you visit them</p>
              </div>
            </div>

            <div class="setting-group">
              <h3>Form Filling</h3>
              <div class="setting-item">
                <div class="toggle-group">
                  <label for="enable-form-filling">Smart Form Filling</label>
                  <label class="toggle">
                    <input type="checkbox" id="enable-form-filling" />
                    <span class="slider"></span>
                  </label>
                </div>
                <p class="setting-description">Allow AI to intelligently fill out forms</p>
              </div>
            </div>
          </section>

          <section class="section" data-section="interface">
            <div class="section-header">
              <h2>Interface Settings</h2>
              <p>Customize the appearance and behavior of Wepilot</p>
            </div>

            <div class="setting-group">
              <h3>Appearance</h3>
              <div class="setting-item">
                <label for="theme-select">Theme</label>
                <select id="theme-select">
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <p class="setting-description">Choose your preferred color scheme</p>
              </div>
            </div>

            <div class="setting-group">
              <h3>Keyboard Shortcuts</h3>
              <div class="setting-item">
                <label for="shortcut-input">Toggle Sidebar</label>
                <input type="text" id="shortcut-input" readonly />
                <p class="setting-description">Keyboard shortcut to open/close the Wepilot sidebar</p>
              </div>
            </div>
          </section>

          <section class="section" data-section="about">
            <div class="section-header">
              <h2>About Wepilot</h2>
              <p>AI-powered web automation assistant</p>
            </div>

            <div class="about-content">
              <div class="about-item">
                <h3>Version</h3>
                <p>1.0.0</p>
              </div>

              <div class="about-item">
                <h3>Description</h3>
                <p>Wepilot is an AI-powered Chrome extension that helps you interact with web pages through natural language commands. It can fill forms, click elements, extract content, and automate common web tasks.</p>
              </div>

              <div class="about-item">
                <h3>Features</h3>
                <ul>
                  <li>Natural language web automation</li>
                  <li>Smart form filling</li>
                  <li>Element highlighting and interaction</li>
                  <li>Content extraction and analysis</li>
                  <li>Multiple AI provider support (OpenAI, Claude, DeepSeek, Ollama)</li>
                  <li>Privacy-focused local processing option</li>
                </ul>
              </div>

              <div class="about-item">
                <h3>Privacy & Security</h3>
                <p>Your privacy is important to us. When using local mode or Ollama, all processing happens on your device. When using external AI providers, only necessary page content is sent to provide the requested functionality.</p>
              </div>

              <div class="about-item">
                <h3>Support</h3>
                <p>For help, feedback, or bug reports, please visit our <a href="#" target="_blank">GitHub repository</a>.</p>
              </div>

              <div class="about-item">
                <h3>License</h3>
                <p>MIT License - Open source and free to use</p>
              </div>
            </div>
          </section>
        </main>

        <div class="save-indicator" id="save-indicator">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Settings saved
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    // Navigation
    this.container.addEventListener('click', (e) => {
      const navBtn = (e.target as HTMLElement).closest('.nav-btn') as HTMLElement;
      if (navBtn && navBtn.classList.contains('nav-btn')) {
        this.switchSection(navBtn.dataset.section!);
      }
    });

    // Settings inputs
    const themeSelect = this.container.querySelector('#theme-select') as HTMLSelectElement;
    const providerSelect = this.container.querySelector('#provider-select') as HTMLSelectElement;
    const apiKeyInput = this.container.querySelector('#api-key-input') as HTMLInputElement;
    const ollamaUrlInput = this.container.querySelector('#ollama-url-input') as HTMLInputElement;
    const enableAnalysis = this.container.querySelector('#enable-analysis') as HTMLInputElement;
    const enableFormFilling = this.container.querySelector('#enable-form-filling') as HTMLInputElement;
    const toggleApiKey = this.container.querySelector('#toggle-api-key') as HTMLButtonElement;

    themeSelect.addEventListener('change', () => {
      this.settings.theme = themeSelect.value as 'light' | 'dark' | 'auto';
      this.saveSettings();
    });

    providerSelect.addEventListener('change', () => {
      this.settings.aiProvider = providerSelect.value as 'openai' | 'claude' | 'deepseek' | 'ollama' | 'local';
      this.updateUIForProvider();
      this.saveSettings();
    });

    apiKeyInput.addEventListener('input', () => {
      this.settings.apiKey = apiKeyInput.value;
      this.saveSettings();
    });

    ollamaUrlInput.addEventListener('input', () => {
      this.saveSettings();
    });

    enableAnalysis.addEventListener('change', () => {
      this.settings.enablePageAnalysis = enableAnalysis.checked;
      this.saveSettings();
    });

    enableFormFilling.addEventListener('change', () => {
      this.settings.enableFormFilling = enableFormFilling.checked;
      this.saveSettings();
    });

    toggleApiKey.addEventListener('click', () => {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      
      const icon = toggleApiKey.querySelector('svg path');
      if (icon) {
        if (isPassword) {
          icon.setAttribute('d', 'M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42');
        } else {
          icon.setAttribute('d', 'M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z');
        }
      }
    });

    // Load current values
    this.loadCurrentValues();
    this.updateUIForProvider();
  }

  private loadCurrentValues() {
    const themeSelect = this.container.querySelector('#theme-select') as HTMLSelectElement;
    const providerSelect = this.container.querySelector('#provider-select') as HTMLSelectElement;
    const apiKeyInput = this.container.querySelector('#api-key-input') as HTMLInputElement;
    const ollamaUrlInput = this.container.querySelector('#ollama-url-input') as HTMLInputElement;
    const enableAnalysis = this.container.querySelector('#enable-analysis') as HTMLInputElement;
    const enableFormFilling = this.container.querySelector('#enable-form-filling') as HTMLInputElement;
    const shortcutInput = this.container.querySelector('#shortcut-input') as HTMLInputElement;

    themeSelect.value = this.settings.theme;
    providerSelect.value = this.settings.aiProvider;
    apiKeyInput.value = this.settings.apiKey || '';
    
    // Load Ollama URL from storage
    chrome.storage.sync.get(['ollamaUrl']).then(result => {
      ollamaUrlInput.value = result.ollamaUrl || 'http://localhost:11434';
    });
    
    enableAnalysis.checked = this.settings.enablePageAnalysis;
    enableFormFilling.checked = this.settings.enableFormFilling;
    shortcutInput.value = this.settings.keyboardShortcut;
  }

  private updateUIForProvider() {
    const apiKeyContainer = this.container.querySelector('#api-key-container') as HTMLElement;
    const ollamaUrlContainer = this.container.querySelector('#ollama-url-container') as HTMLElement;
    const providerInfo = this.container.querySelector('#provider-description') as HTMLElement;
    
    const needsApiKey = ['openai', 'claude', 'deepseek'].includes(this.settings.aiProvider);
    const isOllama = this.settings.aiProvider === 'ollama';

    apiKeyContainer.style.display = needsApiKey ? 'block' : 'none';
    ollamaUrlContainer.style.display = isOllama ? 'block' : 'none';

    // Update provider information
    const descriptions = {
      local: 'Demo mode with simulated AI responses. No external API required. All processing happens locally.',
      openai: 'OpenAI GPT models provide high-quality responses. Requires an OpenAI API key.',
      claude: 'Anthropic Claude models offer excellent reasoning capabilities. Requires an Anthropic API key.',
      deepseek: 'DeepSeek provides cost-effective AI capabilities. Requires a DeepSeek API key.',
      ollama: 'Run AI models locally using Ollama. Requires Ollama to be installed and running on your machine.'
    };

    if (providerInfo) {
      providerInfo.textContent = descriptions[this.settings.aiProvider] || '';
    }
  }

  private switchSection(section: string) {
    // Update navigation
    this.container.querySelectorAll('.nav-btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.section === section);
    });

    // Update content sections
    this.container.querySelectorAll('.section').forEach(sec => {
      (sec as HTMLElement).classList.toggle('active', (sec as HTMLElement).dataset.section === section);
    });
  }

  private async saveSettings() {
    const ollamaUrlInput = this.container.querySelector('#ollama-url-input') as HTMLInputElement;
    
    const settingsToSave = {
      ...this.settings,
      ollamaUrl: ollamaUrlInput?.value || 'http://localhost:11434'
    };

    await chrome.storage.sync.set(settingsToSave);
    
    // Notify background script of settings change
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: settingsToSave
    });

    this.showSaveIndicator();
  }

  private showSaveIndicator() {
    const indicator = this.container.querySelector('#save-indicator') as HTMLElement;
    indicator.classList.add('show');
    
    setTimeout(() => {
      indicator.classList.remove('show');
    }, 2000);
  }
}

// Initialize the options app
document.addEventListener('DOMContentLoaded', () => {
  new OptionsApp();
});
