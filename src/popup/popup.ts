import './popup.css';

class PopupApp {
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('popup-root')!;
    this.initialize();
  }

  private async initialize() {
    await this.render();
    this.setupEventListeners();
  }

  private async render() {
    this.container.innerHTML = `
      <div class="popup-container">
        <header class="popup-header">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            <span>Wepilot</span>
          </div>
        </header>

        <main class="popup-main">
          <div class="quick-actions">
            <button class="action-btn primary" data-action="open-sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H8" stroke="currentColor" stroke-width="2"/>
                <path d="M16 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H16" stroke="currentColor" stroke-width="2"/>
                <path d="M12 9L16 12L12 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Open Assistant
            </button>
            
            <button class="action-btn" data-action="analyze-page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" stroke-width="2"/>
                <path d="M7.5 4.21L12 6.81L16.5 4.21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.5 19.79V14.6L3 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12L16.5 14.6V19.79" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 22.81V17L12 6.81" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Analyze Page
            </button>

            <button class="action-btn" data-action="fill-forms">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2"/>
                <path d="M16 13H8" stroke="currentColor" stroke-width="2"/>
                <path d="M16 17H8" stroke="currentColor" stroke-width="2"/>
                <path d="M10 9H9H8" stroke="currentColor" stroke-width="2"/>
              </svg>
              Fill Forms
            </button>
          </div>

          <div class="page-info">
            <h3>Current Page</h3>
            <div class="page-details">
              <div class="page-title" id="page-title">Loading...</div>
              <div class="page-url" id="page-url">Loading...</div>
            </div>
          </div>

          <div class="quick-chat">
            <div class="chat-input-container">
              <input 
                type="text" 
                id="quick-chat-input" 
                placeholder="Ask me to help with this page..."
                class="chat-input"
              >
              <button id="send-chat" class="send-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>
        </main>

        <footer class="popup-footer">
          <button class="footer-btn" data-action="options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1V3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 21V23" stroke="currentColor" stroke-width="2"/>
              <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" stroke-width="2"/>
              <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" stroke-width="2"/>
              <path d="M1 12H3" stroke="currentColor" stroke-width="2"/>
              <path d="M21 12H23" stroke="currentColor" stroke-width="2"/>
              <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" stroke-width="2"/>
              <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2"/>
            </svg>
            Settings
          </button>
          <div class="version">v1.0.0</div>
        </footer>
      </div>
    `;

    await this.loadPageInfo();
  }

  private setupEventListeners() {
    // Quick action buttons
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement;
      
      if (button) {
        const action = button.dataset.action;
        this.handleAction(action!);
      }
    });

    // Quick chat
    const chatInput = this.container.querySelector('#quick-chat-input') as HTMLInputElement;
    const sendBtn = this.container.querySelector('#send-chat') as HTMLButtonElement;

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleQuickChat(chatInput.value);
      }
    });

    sendBtn.addEventListener('click', () => {
      this.handleQuickChat(chatInput.value);
    });
  }

  private async handleAction(action: string) {
    switch (action) {
      case 'open-sidebar':
        await this.openSidebar();
        break;
      case 'analyze-page':
        await this.analyzePage();
        break;
      case 'fill-forms':
        await this.fillForms();
        break;
      case 'options':
        await this.openOptions();
        break;
    }
  }

  private async openSidebar() {
    await chrome.runtime.sendMessage({ type: 'SHOW_FLOATING_CHAT' });
    window.close();
  }

  private async analyzePage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id!, { type: 'GET_PAGE_INFO' });
      
      if (response.success) {
        // Open floating chat with analysis request
        await chrome.runtime.sendMessage({ 
          type: 'SEND_MESSAGE_TO_CHAT', 
          data: "Please analyze this page and tell me what's on it." 
        });
        await this.openSidebar();
      }
    } catch (error) {
      console.error('Failed to analyze page:', error);
    }
  }

  private async fillForms() {
    // Send message to floating chat and open it
    await chrome.runtime.sendMessage({ 
      type: 'SEND_MESSAGE_TO_CHAT', 
      data: "Help me fill out any forms on this page." 
    });
    await this.openSidebar();
  }

  private async openOptions() {
    await chrome.runtime.openOptionsPage();
    window.close();
  }

  private async handleQuickChat(message: string) {
    if (!message.trim()) return;
    
    // Clear input
    const input = this.container.querySelector('#quick-chat-input') as HTMLInputElement;
    input.value = '';
    
    // Send message to floating chat and open it
    await chrome.runtime.sendMessage({ 
      type: 'SEND_MESSAGE_TO_CHAT', 
      data: message 
    });
    await this.openSidebar();
  }

  private async loadPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const titleElement = this.container.querySelector('#page-title');
      const urlElement = this.container.querySelector('#page-url');
      
      if (titleElement && urlElement) {
        titleElement.textContent = tab.title || 'Unknown Page';
        urlElement.textContent = new URL(tab.url || '').hostname;
      }
    } catch (error) {
      console.error('Failed to load page info:', error);
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupApp();
});
