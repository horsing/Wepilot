export class PersistentSidebar {
  private sidebar: HTMLElement | null = null;
  private isVisible = false;
  private chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];
  private currentPageInfo: any = null;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'TOGGLE_PERSISTENT_SIDEBAR':
          this.toggle();
          break;
        case 'SHOW_PERSISTENT_SIDEBAR':
          this.show();
          break;
        case 'HIDE_PERSISTENT_SIDEBAR':
          this.hide();
          break;
        case 'SEND_MESSAGE_TO_SIDEBAR':
          this.handleIncomingMessage(message.data);
          break;
      }
    });

    // Create sidebar on initialization
    this.createSidebar();
  }

  private createSidebar() {
    if (this.sidebar) return;

    this.sidebar = document.createElement('div');
    this.sidebar.id = 'wepilot-persistent-sidebar';
    this.sidebar.innerHTML = this.getSidebarHTML();
    
    // Apply styles
    this.applySidebarStyles();
    
    // Add to page
    document.body.appendChild(this.sidebar);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial page info
    this.loadPageInfo();
  }

  private getSidebarHTML(): string {
    return `
      <div class="wepilot-sidebar-container">
        <div class="wepilot-sidebar-header">
          <div class="wepilot-sidebar-title">
            <span class="wepilot-logo">🤖</span>
            <span>Wepilot Assistant</span>
          </div>
          <div class="wepilot-sidebar-controls">
            <button class="wepilot-btn-icon" id="wepilot-minimize-btn" title="Minimize">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 8h8v1H4z"/>
              </svg>
            </button>
            <button class="wepilot-btn-icon" id="wepilot-close-btn" title="Close">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="wepilot-sidebar-content">
          <div class="wepilot-page-context">
            <div class="wepilot-context-title">Current Page</div>
            <div class="wepilot-context-info" id="wepilot-page-info">Loading...</div>
          </div>
          
          <div class="wepilot-chat-container">
            <div class="wepilot-chat-messages" id="wepilot-chat-messages">
              <div class="wepilot-welcome-message">
                <div class="wepilot-message wepilot-assistant-message">
                  <div class="wepilot-message-content">
                    Hello! I'm your AI assistant. I can help you:
                    <ul>
                      <li>Analyze this page's content</li>
                      <li>Fill out forms automatically</li>
                      <li>Extract information</li>
                      <li>Navigate and interact with elements</li>
                    </ul>
                    What would you like me to help you with?
                  </div>
                </div>
              </div>
            </div>
            
            <div class="wepilot-chat-input-container">
              <div class="wepilot-quick-actions">
                <button class="wepilot-quick-btn" data-action="analyze">📊 Analyze Page</button>
                <button class="wepilot-quick-btn" data-action="forms">📝 Fill Forms</button>
                <button class="wepilot-quick-btn" data-action="extract">📋 Extract Info</button>
              </div>
              <div class="wepilot-input-wrapper">
                <textarea 
                  id="wepilot-chat-input" 
                  placeholder="Ask me anything about this page or what you'd like me to do..."
                  rows="2"
                ></textarea>
                <button id="wepilot-send-btn" class="wepilot-send-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54L13.026 8l2.938 7.314a.5.5 0 0 1-.538.632l-12-2A.5.5 0 0 1 3 13.5l1.293-1.293 7.793-7.793a.5.5 0 0 1 .708.708L5.5 12.207l7.293 1.293 2.646-6.646a.5.5 0 0 1 .54-.11z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="wepilot-resize-handle"></div>
      </div>
    `;
  }

  private applySidebarStyles() {
    if (!this.sidebar) return;

    const styles = `
      #wepilot-persistent-sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 400px;
        height: 100vh;
        background: #ffffff;
        border-left: 1px solid #e5e7eb;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1f2937;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      #wepilot-persistent-sidebar.wepilot-visible {
        right: 0;
      }
      
      #wepilot-persistent-sidebar.wepilot-minimized {
        right: -350px;
      }
      
      .wepilot-sidebar-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .wepilot-sidebar-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      
      .wepilot-sidebar-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
      }
      
      .wepilot-logo {
        font-size: 18px;
      }
      
      .wepilot-sidebar-controls {
        display: flex;
        gap: 8px;
      }
      
      .wepilot-btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .wepilot-btn-icon:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
      
      .wepilot-sidebar-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .wepilot-page-context {
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        flex-shrink: 0;
      }
      
      .wepilot-context-title {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .wepilot-context-info {
        font-size: 13px;
        color: #374151;
      }
      
      .wepilot-chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .wepilot-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        scroll-behavior: smooth;
      }
      
      .wepilot-message {
        margin-bottom: 16px;
        animation: fadeInUp 0.3s ease-out;
      }
      
      .wepilot-message-content {
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 90%;
      }
      
      .wepilot-user-message .wepilot-message-content {
        background: #3b82f6;
        color: white;
        margin-left: auto;
        border-bottom-right-radius: 4px;
      }
      
      .wepilot-assistant-message .wepilot-message-content {
        background: #f3f4f6;
        color: #1f2937;
        margin-right: auto;
        border-bottom-left-radius: 4px;
      }
      
      .wepilot-assistant-message ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .wepilot-assistant-message li {
        margin: 4px 0;
      }
      
      .wepilot-chat-input-container {
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        background: #ffffff;
        flex-shrink: 0;
      }
      
      .wepilot-quick-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        overflow-x: auto;
      }
      
      .wepilot-quick-btn {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 16px;
        background: #ffffff;
        color: #6b7280;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }
      
      .wepilot-quick-btn:hover {
        background: #f9fafb;
        border-color: #9ca3af;
        color: #374151;
      }
      
      .wepilot-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }
      
      #wepilot-chat-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
        background: #ffffff;
        transition: border-color 0.2s ease;
        min-height: 20px;
        max-height: 120px;
      }
      
      #wepilot-chat-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .wepilot-send-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .wepilot-send-btn:hover {
        background: #2563eb;
        transform: scale(1.05);
      }
      
      .wepilot-send-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: none;
      }
      
      .wepilot-resize-handle {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: ew-resize;
        background: transparent;
      }
      
      .wepilot-resize-handle:hover {
        background: #3b82f6;
      }
      
      .wepilot-typing-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        color: #6b7280;
        font-style: italic;
      }
      
      .wepilot-typing-dots {
        display: flex;
        gap: 2px;
      }
      
      .wepilot-typing-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #9ca3af;
        animation: typingPulse 1.5s infinite;
      }
      
      .wepilot-typing-dot:nth-child(2) { animation-delay: 0.3s; }
      .wepilot-typing-dot:nth-child(3) { animation-delay: 0.6s; }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes typingPulse {
        0%, 60%, 100% { opacity: 0.3; }
        30% { opacity: 1; }
      }
      
      /* Scrollbar styling */
      .wepilot-chat-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      .wepilot-chat-messages::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      
      .wepilot-chat-messages::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      
      .wepilot-chat-messages::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;

    // Inject styles
    let styleSheet = document.getElementById('wepilot-sidebar-styles');
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'wepilot-sidebar-styles';
      document.head.appendChild(styleSheet);
    }
    styleSheet.textContent = styles;
  }

  private setupEventListeners() {
    if (!this.sidebar) return;

    const minimizeBtn = this.sidebar.querySelector('#wepilot-minimize-btn');
    const closeBtn = this.sidebar.querySelector('#wepilot-close-btn');
    const sendBtn = this.sidebar.querySelector('#wepilot-send-btn');
    const chatInput = this.sidebar.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
    const quickBtns = this.sidebar.querySelectorAll('.wepilot-quick-btn');

    minimizeBtn?.addEventListener('click', () => this.minimize());
    closeBtn?.addEventListener('click', () => this.hide());
    sendBtn?.addEventListener('click', () => this.handleSendMessage());

    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    chatInput?.addEventListener('input', () => {
      this.autoResizeTextarea(chatInput);
    });

    quickBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).dataset.action;
        this.handleQuickAction(action!);
      });
    });

    this.setupResizing();
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  private setupResizing() {
    if (!this.sidebar) return;

    const resizeHandle = this.sidebar.querySelector('.wepilot-resize-handle');
    let isResizing = false;
    let startX = 0;
    let startWidth = 400;

    (resizeHandle as HTMLElement)?.addEventListener('mousedown', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      isResizing = true;
      startX = mouseEvent.clientX;
      startWidth = this.sidebar!.offsetWidth;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !this.sidebar) return;
      
      const diff = startX - e.clientX;
      const newWidth = Math.max(300, Math.min(800, startWidth + diff));
      this.sidebar.style.width = newWidth + 'px';
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  private async loadPageInfo() {
    try {
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname
      };

      const pageInfoElement = this.sidebar?.querySelector('#wepilot-page-info');
      if (pageInfoElement) {
        pageInfoElement.innerHTML = `
          <div style="font-weight: 500; margin-bottom: 4px;">${pageInfo.title}</div>
          <div style="font-size: 12px; color: #6b7280;">${pageInfo.domain}</div>
        `;
      }

      this.currentPageInfo = pageInfo;
    } catch (error) {
      console.error('Failed to load page info:', error);
    }
  }

  private async handleSendMessage() {
    const chatInput = this.sidebar?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
    const message = chatInput?.value.trim();
    
    if (!message) return;

    // Clear input
    chatInput.value = '';
    this.autoResizeTextarea(chatInput);

    // Add user message to chat
    this.addMessage('user', message);

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send message to AI service via background script
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        data: {
          message,
          context: {
            pageInfo: this.currentPageInfo,
            chatHistory: this.chatHistory.slice(-10) // Last 10 messages for context
          }
        }
      });

      this.hideTypingIndicator();

      if (response.success) {
        this.addMessage('assistant', response.data.response);
        
        // Execute any actions if provided
        if (response.data.actions) {
          await this.executeActions(response.data.actions);
        }
      } else {
        this.addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
      console.error('AI request failed:', error);
    }
  }

  private async handleQuickAction(action: string) {
    const actions = {
      analyze: "Please analyze this page and tell me what's on it.",
      forms: "Help me fill out any forms on this page.",
      extract: "Extract the main information from this page."
    };

    // Special handling for forms action - automatically detect and attach form data
    if (action === "forms") {
      try {
        // Get form data from the current page
        const formData = this.getFormDataFromPage();
        
        if (formData.length > 0) {
          // Create a detailed message with form information
          const formSummary = formData.map((form: any, index: number) => {
            const fieldCount = form.fields.length;
            const requiredFields = form.fields.filter((field: any) => field.required).length;
            const fieldTypes = [...new Set(form.fields.map((field: any) => field.type))].join(', ');
            return `Form ${index + 1}: ${fieldCount} fields (${requiredFields} required) - Types: ${fieldTypes}`;
          }).join('\n');
          
          const enhancedMessage = `Help me fill out the forms on this page. I've detected ${formData.length} form(s):

${formSummary}

Form Details:
${formData.map((form: any, index: number) => {
            return `Form ${index + 1} (${form.method.toUpperCase()} to ${form.action}):
${form.fields.map((field: any) => {
              const label = field.label || field.placeholder || field.id || 'unlabeled';
              const required = field.required ? ' (required)' : '';
              const type = field.type || 'text';
              return `  - ${label}: ${type}${required}`;
            }).join('\n')}`;
          }).join('\n\n')}

Please provide intelligent suggestions for filling these forms based on their field types and labels.`;

          const chatInput = this.sidebar?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
          if (chatInput) {
            chatInput.value = enhancedMessage;
            await this.handleSendMessage();
          }
          return;
        }
      } catch (error) {
        console.error('Failed to get form data:', error);
      }
    }

    const message = actions[action as keyof typeof actions];
    if (message) {
      const chatInput = this.sidebar?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
      chatInput.value = message;
      await this.handleSendMessage();
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const timestamp = Date.now();
    const message = { role, content, timestamp };
    this.chatHistory.push(message);

    const messagesContainer = this.sidebar?.querySelector('#wepilot-chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `wepilot-message wepilot-${role}-message`;
    messageElement.innerHTML = `
      <div class="wepilot-message-content">${this.formatMessageContent(content)}</div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private formatMessageContent(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private showTypingIndicator() {
    const messagesContainer = this.sidebar?.querySelector('#wepilot-chat-messages');
    if (!messagesContainer) return;

    const indicator = document.createElement('div');
    indicator.className = 'wepilot-typing-indicator';
    indicator.id = 'wepilot-typing-indicator';
    indicator.innerHTML = `
      AI is thinking...
      <div class="wepilot-typing-dots">
        <div class="wepilot-typing-dot"></div>
        <div class="wepilot-typing-dot"></div>
        <div class="wepilot-typing-dot"></div>
      </div>
    `;

    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private hideTypingIndicator() {
    const indicator = this.sidebar?.querySelector('#wepilot-typing-indicator');
    indicator?.remove();
  }

  private async executeActions(actions: any[]) {
    for (const action of actions) {
      try {
        await chrome.runtime.sendMessage({
          type: 'EXECUTE_ACTION',
          data: action
        });
      } catch (error) {
        console.error('Failed to execute action:', error);
      }
    }
  }

  private handleIncomingMessage(message: string) {
    const chatInput = this.sidebar?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = message;
      this.autoResizeTextarea(chatInput);
      this.show(); // Show sidebar when receiving a message
    }
  }

  public show() {
    if (this.sidebar) {
      this.sidebar.classList.add('wepilot-visible');
      this.sidebar.classList.remove('wepilot-minimized');
      this.isVisible = true;
      
      // Focus on input
      const chatInput = this.sidebar.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
      setTimeout(() => chatInput?.focus(), 100);
    }
  }

  public hide() {
    if (this.sidebar) {
      this.sidebar.classList.remove('wepilot-visible', 'wepilot-minimized');
      this.isVisible = false;
    }
  }

  public minimize() {
    if (this.sidebar) {
      this.sidebar.classList.add('wepilot-minimized');
      this.sidebar.classList.remove('wepilot-visible');
    }
  }

  public toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  private getFormDataFromPage() {
    const forms = Array.from(document.forms);
    return forms.map((form: HTMLFormElement, index: number) => {
      const formInfo = {
        id: form.id || `form-${index}`,
        action: form.action || window.location.href,
        method: form.method || 'GET',
        name: form.name || '',
        selector: this.generateSelector(form),
        fields: [] as any[]
      };

      // Get all form elements including those outside the form tag but associated with it
      const elements = Array.from(form.elements);
      
      // Also check for elements with form attribute pointing to this form
      if (form.id) {
        const associatedElements = document.querySelectorAll(`[form="${form.id}"]`);
        elements.push(...Array.from(associatedElements));
      }

      formInfo.fields = elements.map(element => {
        if (element instanceof HTMLInputElement || 
            element instanceof HTMLTextAreaElement || 
            element instanceof HTMLSelectElement) {
          const elementInfo = this.getElementInfo(element);
          
          // Add form-specific information
          if (element instanceof HTMLInputElement) {
            if (element.type === 'radio' || element.type === 'checkbox') {
              elementInfo.checked = element.checked;
            }
            if (element.required) {
              elementInfo.required = true;
            }
          } else if (element instanceof HTMLTextAreaElement) {
            if (element.required) {
              elementInfo.required = true;
            }
          } else if (element instanceof HTMLSelectElement) {
            if (element.required) {
              elementInfo.required = true;
            }
            elementInfo.options = Array.from(element.options).map(option => ({
              value: option.value,
              text: option.text,
              selected: option.selected
            }));
          }

          // Get associated label
          const label = document.querySelector(`label[for="${element.id}"]`) || 
                       element.closest('label');
          if (label) {
            elementInfo.label = label.textContent?.trim();
          }

          return elementInfo;
        }
        return null;
      }).filter(Boolean);

      return formInfo;
    });
  }

  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Fallback to tag name with nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === element.tagName
      );
      const index = siblings.indexOf(element);
      return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }
    
    return element.tagName.toLowerCase();
  }

  private getElementInfo(element: Element) {
    const rect = element.getBoundingClientRect();
    const info: any = {
      tag: element.tagName.toLowerCase(),
      selector: this.generateSelector(element),
      bounds: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    };

    // Add specific attributes based on element type
    if (element.id) info.id = element.id;
    if (element.className) info.className = element.className;
    
    const htmlElement = element as HTMLElement;
    if (htmlElement.innerText) {
      info.text = htmlElement.innerText.trim().substring(0, 100);
    }

    if (element instanceof HTMLInputElement) {
      info.type = element.type;
      info.value = element.value;
      info.placeholder = element.placeholder;
    } else if (element instanceof HTMLTextAreaElement) {
      info.type = 'textarea';
      info.value = element.value;
      info.placeholder = element.placeholder;
    } else if (element instanceof HTMLSelectElement) {
      info.type = 'select';
      info.value = element.value;
    } else if (element instanceof HTMLAnchorElement) {
      info.href = element.href;
    }

    return info;
  }
}
