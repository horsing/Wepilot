import { Message, AIRequest, AIResponse } from '../types';
import './sidebar.css';

class SidebarApp {
  private container: HTMLElement;
  private messages: Message[] = [];
  private isProcessing = false;
  private currentTabId: number | null = null;

  constructor() {
    this.container = document.getElementById('sidebar-root')!;
    this.initialize();
  }

  private async initialize() {
    await this.getCurrentTab();
    await this.render();
    this.setupEventListeners();
    await this.checkForPendingMessage();
    this.addWelcomeMessage();
  }

  private async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id || null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }

  private async render() {
    this.container.innerHTML = `
      <div class="sidebar-container">
        <header class="sidebar-header">
          <div class="header-content">
            <div class="logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
              <span>Wepilot Assistant</span>
            </div>
            <button class="header-btn" id="clear-chat" title="Clear conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="page-context" id="page-context">
            <div class="context-loading">Loading page context...</div>
          </div>
        </header>

        <main class="sidebar-main">
          <div class="messages-container" id="messages-container">
            <!-- Messages will be inserted here -->
          </div>
        </main>

        <footer class="sidebar-footer">
          <div class="quick-suggestions" id="quick-suggestions">
            <button class="suggestion-btn" data-suggestion="analyze">
              📊 Analyze this page
            </button>
            <button class="suggestion-btn" data-suggestion="forms">
              📝 Fill out forms
            </button>
            <button class="suggestion-btn" data-suggestion="navigate">
              🧭 Help me navigate
            </button>
          </div>
          
          <div class="input-container">
            <div class="input-wrapper">
              <textarea 
                id="message-input" 
                placeholder="Ask me to help with this page..."
                rows="1"
                maxlength="2000"
              ></textarea>
              <button id="send-button" class="send-button" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <div class="input-hint">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </footer>
      </div>
    `;

    await this.loadPageContext();
  }

  private setupEventListeners() {
    const messageInput = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    const sendButton = this.container.querySelector('#send-button') as HTMLButtonElement;
    const clearButton = this.container.querySelector('#clear-chat') as HTMLButtonElement;
    const suggestionsContainer = this.container.querySelector('#quick-suggestions') as HTMLElement;

    // Message input handling
    messageInput.addEventListener('input', () => {
      this.handleInputChange(messageInput, sendButton);
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Clear chat
    clearButton.addEventListener('click', () => {
      this.clearChat();
    });

    // Quick suggestions
    suggestionsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const suggestion = target.closest('[data-suggestion]') as HTMLElement;
      
      if (suggestion) {
        this.handleSuggestion(suggestion.dataset.suggestion!);
      }
    });
  }

  private handleInputChange(input: HTMLTextAreaElement, button: HTMLButtonElement) {
    // Auto-resize textarea
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';

    // Enable/disable send button
    const hasText = input.value.trim().length > 0;
    button.disabled = !hasText;
    button.classList.toggle('enabled', hasText);
  }

  private async sendMessage() {
    const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    const message = input.value.trim();
    
    if (!message || this.isProcessing) return;

    // Add user message
    this.addMessage({
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Clear input
    input.value = '';
    input.style.height = 'auto';
    const sendButton = this.container.querySelector('#send-button') as HTMLButtonElement;
    sendButton.disabled = true;
    sendButton.classList.remove('enabled');

    // Hide suggestions
    this.hideSuggestions();

    // Process message
    await this.processMessage(message);
  }

  private async processMessage(message: string) {
    this.isProcessing = true;

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    this.addMessage({
      id: typingId,
      type: 'assistant',
      content: '...',
      timestamp: Date.now()
    });

    try {
      // Get page context
      const pageContext = await this.getPageContext();
      
      // Determine request type based on message content
      const requestType = this.classifyRequest(message);
      
      // Create AI request
      const aiRequest: AIRequest = {
        type: requestType,
        instruction: message,
        context: pageContext
      };

      // Send to background for processing
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_AI_REQUEST',
        data: aiRequest
      }) as AIResponse;

      // Remove typing indicator
      this.removeMessage(typingId);

      // Add AI response
      this.addMessage({
        id: Date.now().toString(),
        type: 'assistant',
        content: response.message,
        timestamp: Date.now()
      });

      // Execute actions if any
      if (response.actions && response.actions.length > 0) {
        await this.executeActions(response.actions);
      }

    } catch (error) {
      // Remove typing indicator
      this.removeMessage(typingId);
      
      // Add error message
      this.addMessage({
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      });
    }

    this.isProcessing = false;
  }

  private classifyRequest(message: string): AIRequest['type'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('fill') && (lowerMessage.includes('form') || lowerMessage.includes('field'))) {
      return 'fill_form';
    }
    if (lowerMessage.includes('click') || lowerMessage.includes('press')) {
      return 'click_element';
    }
    if (lowerMessage.includes('extract') || lowerMessage.includes('get') || lowerMessage.includes('find')) {
      return 'extract_content';
    }
    if (lowerMessage.includes('navigate') || lowerMessage.includes('go to')) {
      return 'navigate';
    }
    if (lowerMessage.includes('analyze') || lowerMessage.includes('understand')) {
      return 'analyze';
    }
    
    return 'general';
  }

  private async getPageContext() {
    if (!this.currentTabId) return null;

    try {
      const response = await chrome.tabs.sendMessage(this.currentTabId, {
        type: 'GET_PAGE_INFO'
      });
      
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get page context:', error);
      return null;
    }
  }

  private async executeActions(actions: any[]) {
    if (!this.currentTabId) return;

    for (const action of actions) {
      try {
        await chrome.tabs.sendMessage(this.currentTabId, {
          type: 'EXECUTE_ACTION',
          data: action
        });
        
        // Add a small delay between actions
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to execute action:', error);
      }
    }
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  private removeMessage(id: string) {
    this.messages = this.messages.filter(m => m.id !== id);
    const messageElement = this.container.querySelector(`[data-message-id="${id}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  }

  private renderMessage(message: Message) {
    const messagesContainer = this.container.querySelector('#messages-container')!;
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${message.type}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    const isTyping = message.content === '...';
    
    messageElement.innerHTML = `
      <div class="message-content">
        ${isTyping ? this.getTypingIndicator() : this.formatMessageContent(message.content)}
      </div>
      <div class="message-time">
        ${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    `;

    messagesContainer.appendChild(messageElement);
  }

  private getTypingIndicator(): string {
    return `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  }

  private formatMessageContent(content: string): string {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom() {
    const messagesContainer = this.container.querySelector('#messages-container')!;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private clearChat() {
    this.messages = [];
    const messagesContainer = this.container.querySelector('#messages-container')!;
    messagesContainer.innerHTML = '';
    this.addWelcomeMessage();
    this.showSuggestions();
  }

  private addWelcomeMessage() {
    this.addMessage({
      id: 'welcome',
      type: 'assistant',
      content: `Hello! I'm your AI web assistant. I can help you interact with this page in natural language. 

Try asking me to:
• **Analyze this page** - I'll examine the content and structure
• **Fill out forms** - I'll help complete forms with appropriate information  
• **Click elements** - I'll find and click buttons, links, etc.
• **Extract information** - I'll gather specific data from the page
• **Navigate** - I'll help you move around the site

What would you like me to help you with?`,
      timestamp: Date.now()
    });
  }

  private async checkForPendingMessage() {
    const result = await chrome.storage.session.get(['pendingMessage']);
    if (result.pendingMessage) {
      const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
      input.value = result.pendingMessage;
      this.handleInputChange(input, this.container.querySelector('#send-button') as HTMLButtonElement);
      await chrome.storage.session.remove(['pendingMessage']);
    }
  }

  private async loadPageContext() {
    const contextElement = this.container.querySelector('#page-context')!;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      contextElement.innerHTML = `
        <div class="context-info">
          <div class="context-title">${tab.title || 'Unknown Page'}</div>
          <div class="context-url">${new URL(tab.url || '').hostname}</div>
        </div>
      `;
    } catch (error) {
      contextElement.innerHTML = `
        <div class="context-error">Unable to load page context</div>
      `;
    }
  }

  private handleSuggestion(suggestion: string) {
    const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    
    switch (suggestion) {
      case 'analyze':
        input.value = 'Please analyze this page and tell me what you can help me with';
        break;
      case 'forms':
        input.value = 'Help me fill out any forms on this page';
        break;
      case 'navigate':
        input.value = 'Help me navigate this website';
        break;
    }
    
    this.handleInputChange(input, this.container.querySelector('#send-button') as HTMLButtonElement);
    input.focus();
  }

  private hideSuggestions() {
    const suggestions = this.container.querySelector('#quick-suggestions') as HTMLElement;
    suggestions.style.display = 'none';
  }

  private showSuggestions() {
    const suggestions = this.container.querySelector('#quick-suggestions') as HTMLElement;
    suggestions.style.display = 'flex';
  }
}

// Initialize sidebar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SidebarApp();
});
