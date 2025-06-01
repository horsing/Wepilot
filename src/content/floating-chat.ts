export class FloatingChat {
  private chatContainer: HTMLElement | null = null;
  private isVisible = false;
  private isMinimized = false;
  private chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];
  private currentPageInfo: any = null;
  private position = { x: 20, y: 20 };
  private size = { width: 380, height: 600 };
  private attachedFiles: Array<{ name: string; type: string; size: number; content: string; lastModified: number }> = [];
  private includePageContent: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'TOGGLE_FLOATING_CHAT':
          this.toggle();
          break;
        case 'SHOW_FLOATING_CHAT':
          this.show();
          break;
        case 'HIDE_FLOATING_CHAT':
          this.hide();
          break;
        case 'SEND_MESSAGE_TO_CHAT':
          this.handleIncomingMessage(message.data);
          break;
      }
    });

    // Create chat on initialization but keep it hidden
    this.createFloatingChat();
    this.loadPageInfo();
  }

  private createFloatingChat() {
    if (this.chatContainer) return;

    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'wepilot-floating-chat';
    this.chatContainer.innerHTML = this.getChatHTML();
    
    // Apply styles
    this.applyChatStyles();
    
    // Add to page
    document.body.appendChild(this.chatContainer);
    
    // Setup event listeners
    this.setupEventListeners();
  }

  private getChatHTML(): string {
    return `
      <div class="wepilot-chat-container">
        <!-- Chat Button (always visible when minimized) -->
        <div class="wepilot-chat-button" id="wepilot-chat-button">
          <div class="wepilot-chat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 9H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 13H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="wepilot-chat-label">Wepilot AI</div>
        </div>

        <!-- Chat Dialog -->
        <div class="wepilot-chat-dialog" id="wepilot-chat-dialog">
          <!-- Header -->
          <div class="wepilot-chat-header">
            <div class="wepilot-header-left">
              <div class="wepilot-chat-title">
                <span class="wepilot-logo">🤖</span>
                <span>Wepilot Assistant</span>
              </div>
              <div class="wepilot-page-context">
                <span id="wepilot-page-title">Loading...</span>
              </div>
            </div>
            <div class="wepilot-header-controls">
              <button class="wepilot-control-btn" id="wepilot-minimize-btn" title="Minimize">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 12H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              <button class="wepilot-control-btn" id="wepilot-close-btn" title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="wepilot-messages-container" id="wepilot-messages">
            <div class="wepilot-welcome-message">
              <div class="wepilot-message wepilot-assistant-message">
                <div class="wepilot-message-avatar">🤖</div>
                <div class="wepilot-message-content">
                  <div class="wepilot-message-text">
                    Hello! I'm your AI assistant. I can help you with:
                    <br><br>
                    • Analyze this page's content<br>
                    • Fill out forms automatically<br>
                    • Extract information<br>
                    • Navigate and interact with elements
                    <br><br>
                    What would you like me to help you with?
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="wepilot-quick-actions">
            <button class="wepilot-quick-action" data-action="analyze">
              <span>📊</span> Analyze Page
            </button>
            <button class="wepilot-quick-action" data-action="attach-page">
              <span>🌐</span> Attach Page HTML
            </button>
            <button class="wepilot-quick-action" data-action="forms">
              <span>📝</span> Fill Forms
            </button>
            <button class="wepilot-quick-action" data-action="extract">
              <span>📋</span> Extract Info
            </button>
          </div>

          <!-- Input Area -->
          <div class="wepilot-input-area">
            <!-- Attached Files Display -->
            <div class="wepilot-attached-files" id="wepilot-attached-files" style="display: none;"></div>
            
            <div class="wepilot-input-container">
              <button id="wepilot-attach-btn" class="wepilot-attach-btn" title="Attach file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59719 21.9983 8.005 21.9983C6.41281 21.9983 4.88581 21.3658 3.76 20.24C2.63419 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63419 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38755 15.78 1.38755C16.8414 1.38755 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7825 4.32856 19.7825 5.39C19.7825 6.45144 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03476 17.7852 8.52573 17.9946 7.995 17.9946C7.46427 17.9946 6.95524 17.7852 6.58 17.41C6.20476 17.0348 5.99539 16.5257 5.99539 15.995C5.99539 15.4643 6.20476 14.9552 6.58 14.58L15.07 6.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <input type="file" id="wepilot-file-input" multiple accept=".txt,.pdf,.doc,.docx,.json,.csv,.md" style="display: none;">
              <textarea 
                id="wepilot-chat-input" 
                placeholder="Ask me anything about this page..."
                rows="1"
              ></textarea>
              <button id="wepilot-send-btn" class="wepilot-send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Resize Handles (only visible when dialog is expanded) -->
        <div class="wepilot-resize-handle left" data-resize="left"></div>
        <div class="wepilot-resize-handle right" data-resize="right"></div>
        <div class="wepilot-resize-handle top" data-resize="top"></div>
        <div class="wepilot-resize-handle bottom" data-resize="bottom"></div>

        <!-- Drag Handle -->
        <div class="wepilot-drag-handle" id="wepilot-drag-handle"></div>
      </div>
    `;
  }

  private applyChatStyles() {
    if (!this.chatContainer) return;

    const styles = `
      #wepilot-floating-chat {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1f2937;
        user-select: none;
      }

      .wepilot-chat-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      /* Chat Button */
      .wepilot-chat-button {
        display: flex;
        align-items: center;
        width: 56px;
        height: 56px;
        padding: 0;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.3s ease;
        justify-content: center;
        overflow: visible;
        position: relative;
        border: none;
        outline: none;
      }

      .wepilot-chat-button:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
        width: auto;
        border-radius: 28px;
        padding: 0 16px 0 0;
        gap: 8px;
        justify-content: flex-start;
      }

      .wepilot-chat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        flex-shrink: 0;
        position: relative;
        margin: 0;
        padding: 0;
      }

      .wepilot-chat-icon svg {
        width: 24px;
        height: 24px;
        transition: transform 0.3s ease;
        display: block;
      }

      .wepilot-chat-button:hover .wepilot-chat-icon svg {
        transform: scale(1.1);
      }

      .wepilot-chat-label {
        font-weight: 600;
        font-size: 14px;
        white-space: nowrap;
        opacity: 0;
        max-width: 0;
        transition: all 0.3s ease;
        overflow: hidden;
      }

      .wepilot-chat-button:hover .wepilot-chat-label {
        opacity: 1;
        max-width: 120px;
      }

      /* Chat Dialog */
      .wepilot-chat-dialog {
        width: var(--dialog-width, 380px);
        max-height: var(--dialog-height, 600px);
        min-width: 300px;
        min-height: 400px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        margin-bottom: 16px;
        display: none;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.95) translateY(20px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .wepilot-chat-dialog.wepilot-visible {
        display: flex;
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      /* Header */
      .wepilot-chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
      }

      .wepilot-header-left {
        flex: 1;
        min-width: 0;
      }

      .wepilot-chat-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 4px;
      }

      .wepilot-logo {
        font-size: 18px;
      }

      .wepilot-page-context {
        font-size: 12px;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .wepilot-header-controls {
        display: flex;
        gap: 8px;
      }

      .wepilot-control-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .wepilot-control-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }

      /* Messages */
      .wepilot-messages-container {
        flex: 1;
        max-height: 300px;
        overflow-y: auto;
        padding: 16px;
        scroll-behavior: smooth;
      }

      .wepilot-message {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        animation: fadeInUp 0.3s ease-out;
      }

      .wepilot-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }

      .wepilot-assistant-message .wepilot-message-avatar {
        background: #f3f4f6;
      }

      .wepilot-user-message {
        flex-direction: row-reverse;
      }

      .wepilot-user-message .wepilot-message-avatar {
        background: #3b82f6;
        color: white;
        font-size: 14px;
        font-weight: 600;
      }

      .wepilot-message-content {
        flex: 1;
        min-width: 0;
      }

      .wepilot-message-text {
        padding: 12px 16px;
        border-radius: 18px;
        background: #f3f4f6;
        color: #1f2937;
        line-height: 1.4;
        word-wrap: break-word;
      }

      .wepilot-user-message .wepilot-message-text {
        background: #3b82f6;
        color: white;
      }

      /* Quick Actions */
      .wepilot-quick-actions {
        display: flex;
        gap: 8px;
        padding: 0 16px 12px 16px;
        overflow-x: auto;
      }

      .wepilot-quick-action {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        background: #ffffff;
        color: #6b7280;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .wepilot-quick-action:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        color: #3b82f6;
        transform: translateY(-1px);
      }

      .wepilot-quick-action.wepilot-active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }

      .wepilot-quick-action.wepilot-active:hover {
        background: #2563eb;
        color: white;
      }

      /* Input Area */
      .wepilot-input-area {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: #ffffff;
      }

      .wepilot-input-container {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      #wepilot-chat-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
        background: #f9fafb;
        transition: all 0.2s ease;
        min-height: 20px;
        max-height: 100px;
        outline: none;
      }

      #wepilot-chat-input:focus {
        border-color: #3b82f6;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .wepilot-send-btn {
        width: 44px;
        height: 44px;
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

      /* File Attachment Styles */
      .wepilot-attach-btn {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        background: #6b7280;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .wepilot-attach-btn:hover {
        background: #4b5563;
        transform: scale(1.05);
      }

      .wepilot-attached-files {
        margin-bottom: 8px;
        max-height: 120px;
        overflow-y: auto;
      }

      .wepilot-attached-file {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 4px;
        font-size: 12px;
      }

      .wepilot-page-attachment {
        background: #eff6ff;
        border-color: #3b82f6;
      }

      .wepilot-page-attachment .wepilot-file-name {
        color: #1d4ed8;
        font-weight: 600;
      }

      .wepilot-file-icon {
        font-size: 14px;
        color: #6b7280;
      }

      .wepilot-file-info {
        flex: 1;
        min-width: 0;
      }

      .wepilot-file-name {
        font-weight: 500;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .wepilot-file-size {
        color: #6b7280;
        font-size: 11px;
      }

      .wepilot-remove-file {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 50%;
        background: #ef4444;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .wepilot-remove-file:hover {
        background: #dc2626;
        transform: scale(1.1);
      }

      /* Drag Handle */
      .wepilot-drag-handle {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        cursor: move;
        z-index: 10;
      }

      /* Resize Handles */
      .wepilot-resize-handle {
        position: absolute;
        background: transparent;
        z-index: 11;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      /* Only show resize handles when dialog is visible */
      .wepilot-chat-dialog.wepilot-visible .wepilot-resize-handle {
        opacity: 1;
      }

      .wepilot-resize-handle.left {
        top: 50%;
        left: 0;
        width: 8px;
        height: 60px;
        transform: translateY(-50%);
        cursor: ew-resize;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 0 4px 4px 0;
      }

      .wepilot-resize-handle.left:hover {
        background: rgba(59, 130, 246, 0.2);
      }

      .wepilot-resize-handle.right {
        top: 50%;
        right: 0;
        width: 8px;
        height: 60px;
        transform: translateY(-50%);
        cursor: ew-resize;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 4px 0 0 4px;
      }

      .wepilot-resize-handle.right:hover {
        background: rgba(59, 130, 246, 0.2);
      }

      .wepilot-resize-handle.top {
        top: 0;
        left: 50%;
        width: 60px;
        height: 8px;
        transform: translateX(-50%);
        cursor: ns-resize;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 0 0 4px 4px;
      }

      .wepilot-resize-handle.top:hover {
        background: rgba(59, 130, 246, 0.2);
      }

      .wepilot-resize-handle.bottom {
        bottom: 0;
        left: 50%;
        width: 60px;
        height: 8px;
        transform: translateX(-50%);
        cursor: ns-resize;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 4px 4px 0 0;
      }

      .wepilot-resize-handle.bottom:hover {
        background: rgba(59, 130, 246, 0.2);
      }

      /* Typing Indicator */
      .wepilot-typing-indicator {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .wepilot-typing-indicator .wepilot-message-avatar {
        background: #f3f4f6;
      }

      .wepilot-typing-content {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-radius: 18px;
        background: #f3f4f6;
        color: #6b7280;
        font-style: italic;
      }

      .wepilot-typing-dots {
        display: flex;
        gap: 4px;
      }

      .wepilot-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9ca3af;
        animation: typingPulse 1.5s infinite;
      }

      .wepilot-typing-dot:nth-child(2) { animation-delay: 0.3s; }
      .wepilot-typing-dot:nth-child(3) { animation-delay: 0.6s; }

      /* Scrollbar */
      .wepilot-messages-container::-webkit-scrollbar {
        width: 6px;
      }

      .wepilot-messages-container::-webkit-scrollbar-track {
        background: #f1f5f9;
      }

      .wepilot-messages-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .wepilot-messages-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* Animations */
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

      /* Responsive */
      @media (max-width: 480px) {
        #wepilot-floating-chat {
          bottom: 10px;
          right: 10px;
          left: 10px;
        }

        .wepilot-chat-dialog {
          width: 100%;
          max-width: none;
        }
      }
    `;

    // Inject styles
    let styleSheet = document.getElementById('wepilot-floating-chat-styles');
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'wepilot-floating-chat-styles';
      document.head.appendChild(styleSheet);
    }
    styleSheet.textContent = styles;
  }

  private setupEventListeners() {
    if (!this.chatContainer) return;

    const chatButton = this.chatContainer.querySelector('#wepilot-chat-button');
    const chatDialog = this.chatContainer.querySelector('#wepilot-chat-dialog');
    const minimizeBtn = this.chatContainer.querySelector('#wepilot-minimize-btn');
    const closeBtn = this.chatContainer.querySelector('#wepilot-close-btn');
    const sendBtn = this.chatContainer.querySelector('#wepilot-send-btn');
    const chatInput = this.chatContainer.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
    const quickActions = this.chatContainer.querySelectorAll('.wepilot-quick-action');

    // Chat button click
    chatButton?.addEventListener('click', () => this.toggleDialog());

    // Control buttons
    minimizeBtn?.addEventListener('click', () => this.minimize());
    closeBtn?.addEventListener('click', () => this.hide());

    // Send button and input
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

    // Quick actions
    quickActions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).closest('.wepilot-quick-action')?.getAttribute('data-action');
        if (action) this.handleQuickAction(action);
      });
    });

    // File attachment functionality
    this.setupFileAttachment();

    // Dragging functionality
    this.setupDragging();

    // Resizing functionality
    this.setupResizing();
  }

  private setupDragging() {
    if (!this.chatContainer) return;

    const header = this.chatContainer.querySelector('.wepilot-chat-header') as HTMLElement;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startBottom = 0;

    header?.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.chatContainer!.getBoundingClientRect();
      startLeft = rect.left;
      startBottom = window.innerHeight - rect.bottom;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !this.chatContainer) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = Math.max(10, Math.min(window.innerWidth - 400, startLeft + deltaX));
      const newBottom = Math.max(10, Math.min(window.innerHeight - 100, startBottom - deltaY));
      
      this.chatContainer.style.left = newLeft + 'px';
      this.chatContainer.style.right = 'auto';
      this.chatContainer.style.bottom = newBottom + 'px';
      
      this.position.x = newLeft;
      this.position.y = newBottom;
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  private setupResizing() {
    if (!this.chatContainer) return;

    const resizeHandles = this.chatContainer.querySelectorAll('.wepilot-resize-handle');
    const chatDialog = this.chatContainer.querySelector('.wepilot-chat-dialog') as HTMLElement;

    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e: Event) => {
        const mouseEvent = e as MouseEvent;
        e.preventDefault();
        e.stopPropagation(); // Prevent triggering drag

        const resizeType = (handle as HTMLElement).getAttribute('data-resize');
        const startX = mouseEvent.clientX;
        const startY = mouseEvent.clientY;
        const startWidth = this.size.width;
        const startHeight = this.size.height;

        const handleMouseMove = (e: MouseEvent) => {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          let newWidth = startWidth;
          let newHeight = startHeight;

          switch (resizeType) {
            case 'left':
              newWidth = Math.max(300, Math.min(800, startWidth - deltaX));
              break;
            case 'right':
              newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
              break;
            case 'top':
              newHeight = Math.max(400, Math.min(800, startHeight - deltaY));
              break;
            case 'bottom':
              newHeight = Math.max(400, Math.min(800, startHeight + deltaY));
              break;
          }

          // Update size and apply to dialog
          this.size.width = newWidth;
          this.size.height = newHeight;
          
          chatDialog.style.setProperty('--dialog-width', `${newWidth}px`);
          chatDialog.style.setProperty('--dialog-height', `${newHeight}px`);
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });
    });
  }

  private setupFileAttachment() {
    if (!this.chatContainer) return;

    const attachBtn = this.chatContainer.querySelector('#wepilot-attach-btn');
    const fileInput = this.chatContainer.querySelector('#wepilot-file-input') as HTMLInputElement;

    attachBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      for (const file of Array.from(files)) {
        await this.processAttachedFile(file);
      }

      // Clear the input so the same file can be selected again
      fileInput.value = '';
    });
  }

  private async processAttachedFile(file: File) {
    try {
      // Encode all files (including PDF, DOCX, plain text) as base64
      // This ensures consistent format for AI providers
      const base64Content = await this.readFileAsBase64(file);
      const attachedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64Content, // Always base64 encoded
        lastModified: file.lastModified
      };

      this.attachedFiles.push(attachedFile);
      this.updateAttachedFilesDisplay();
    } catch (error) {
      console.error('Error processing file:', error);
      this.addMessage('assistant', `Sorry, I couldn't process the file "${file.name}". Please try again.`);
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,") 
        // to get just the base64 content that AI providers expect
        const base64Content = result.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      // Read all files as data URLs, which automatically base64 encodes binary content
      reader.readAsDataURL(file);
    });
  }

  private updateAttachedFilesDisplay() {
    const filesContainer = this.chatContainer?.querySelector('#wepilot-attached-files') as HTMLElement;
    if (!filesContainer) return;

    const hasContent = this.attachedFiles.length > 0 || this.includePageContent;
    
    if (!hasContent) {
      filesContainer.style.display = 'none';
      return;
    }

    filesContainer.style.display = 'block';
    let htmlContent = '';

    // Show page content attachment status
    if (this.includePageContent) {
      htmlContent += `
        <div class="wepilot-attached-file wepilot-page-attachment">
          <div class="wepilot-file-icon">🌐</div>
          <div class="wepilot-file-info">
            <div class="wepilot-file-name">Page HTML Content</div>
            <div class="wepilot-file-size">Complete page structure</div>
          </div>
          <button class="wepilot-remove-file" data-type="page" title="Remove page content">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `;
    }

    // Show attached files
    htmlContent += this.attachedFiles.map((file, index) => `
      <div class="wepilot-attached-file">
        <div class="wepilot-file-icon">📎</div>
        <div class="wepilot-file-info">
          <div class="wepilot-file-name">${file.name}</div>
          <div class="wepilot-file-size">${this.formatFileSize(file.size)}</div>
        </div>
        <button class="wepilot-remove-file" data-index="${index}" title="Remove file">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `).join('');

    filesContainer.innerHTML = htmlContent;

    // Add event listeners for remove buttons
    filesContainer.querySelectorAll('.wepilot-remove-file').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('.wepilot-remove-file') as HTMLElement;
        const type = button?.getAttribute('data-type');
        const index = button?.getAttribute('data-index');
        
        if (type === 'page') {
          this.includePageContent = false;
          this.updatePageAttachmentDisplay();
        } else if (index !== null) {
          this.removeAttachedFile(parseInt(index));
        }
      });
    });
  }

  private updatePageAttachmentDisplay() {
    this.updateAttachedFilesDisplay();
    
    // Update the quick action button appearance
    const attachPageBtn = this.chatContainer?.querySelector('[data-action="attach-page"]');
    if (attachPageBtn) {
      if (this.includePageContent) {
        attachPageBtn.classList.add('wepilot-active');
        attachPageBtn.innerHTML = '<span>🌐</span> Page HTML Attached';
      } else {
        attachPageBtn.classList.remove('wepilot-active');
        attachPageBtn.innerHTML = '<span>🌐</span> Attach Page HTML';
      }
    }
  }

  private removeAttachedFile(index: number) {
    this.attachedFiles.splice(index, 1);
    this.updateAttachedFilesDisplay();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private async getPageContent(): Promise<string> {
    try {
      // Get the complete HTML content of the page
      const htmlContent = document.documentElement.outerHTML;
      return htmlContent;
    } catch (error) {
      console.error('Error extracting page content:', error);
      return '';
    }
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }

  private async loadPageInfo() {
    try {
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname
      };

      const pageTitleElement = this.chatContainer?.querySelector('#wepilot-page-title');
      if (pageTitleElement) {
        pageTitleElement.textContent = pageInfo.title || pageInfo.domain;
      }

      this.currentPageInfo = pageInfo;
    } catch (error) {
      console.error('Failed to load page info:', error);
    }
  }

  private toggleDialog() {
    const dialog = this.chatContainer?.querySelector('#wepilot-chat-dialog');
    if (dialog) {
      if (dialog.classList.contains('wepilot-visible')) {
        this.minimize();
      } else {
        this.showDialog();
      }
    }
  }

  private showDialog() {
    const dialog = this.chatContainer?.querySelector('#wepilot-chat-dialog');
    if (dialog) {
      dialog.classList.add('wepilot-visible');
      this.isVisible = true;
      this.isMinimized = false;
      
      // Focus on input
      const chatInput = this.chatContainer?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
      setTimeout(() => chatInput?.focus(), 100);
    }
  }

  private minimize() {
    const dialog = this.chatContainer?.querySelector('#wepilot-chat-dialog');
    if (dialog) {
      dialog.classList.remove('wepilot-visible');
      this.isMinimized = true;
      this.isVisible = false;
    }
  }

  private async handleSendMessage() {
    const chatInput = this.chatContainer?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
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
      // Get page content if requested
      const pageContent = this.includePageContent ? await this.getPageContent() : undefined;

      // Send message to AI service via background script
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        data: {
          type: 'general',
          instruction: message,
          context: {
            url: window.location.href,
            title: document.title,
            pageContent: pageContent,
            selectedText: window.getSelection()?.toString(),
            visibleElements: this.currentPageInfo?.interactiveElements || [],
            attachedFiles: this.attachedFiles
          }
        }
      });

      this.hideTypingIndicator();

      if (response.success) {
        // The AI service returns the message directly in the response.message field
        this.addMessage('assistant', response.message || 'I understand your request.');
        
        // Execute any actions if provided
        if (response.actions) {
          await this.executeActions(response.actions);
        }
      } else {
        this.addMessage('assistant', response.message || 'Sorry, I encountered an error processing your request. Please try again.');
      }

      // Clear attached files after sending
      this.attachedFiles = [];
      this.includePageContent = false;
      this.updateAttachedFilesDisplay();
      this.updatePageAttachmentDisplay();
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
      extract: "Extract the main information from this page.",
      "attach-page": ""
    };

    if (action === "attach-page") {
      this.includePageContent = !this.includePageContent;
      this.updatePageAttachmentDisplay();
      return;
    }

    // Special handling for forms action - automatically detect and attach form data
    if (action === "forms") {
      try {
        // Get form data from the current page
        const formData = this.getFormDataFromPage();
        
        if (formData.length > 0) {
          // Create a detailed message with form information
          const formSummary = formData.map((form, index) => {
            const fieldCount = form.fields.length;
            const requiredFields = form.fields.filter(field => field.required).length;
            const fieldTypes = [...new Set(form.fields.map(field => field.type))].join(', ');
            return `Form ${index + 1}: ${fieldCount} fields (${requiredFields} required) - Types: ${fieldTypes}`;
          }).join('\n');
          
          const enhancedMessage = `Help me fill out the forms on this page. I've detected ${formData.length} form(s):

${formSummary}

Form Details:
${formData.map((form, index) => {
            return `Form ${index + 1} (${form.method.toUpperCase()} to ${form.action}):
${form.fields.map(field => {
              const label = field.label || field.placeholder || field.id || 'unlabeled';
              const required = field.required ? ' (required)' : '';
              const type = field.type || 'text';
              return `  - ${label}: ${type}${required}`;
            }).join('\n')}`;
          }).join('\n\n')}

Please provide intelligent suggestions for filling these forms based on their field types and labels.`;

          const chatInput = this.chatContainer?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
          if (chatInput) {
            chatInput.value = enhancedMessage;
            await this.handleSendMessage();
          }
          return;
        }
      } catch (error) {
        console.error('Failed to get form data:', error);
      }
      
      // Fallback to original message if form detection fails
      const message = actions[action as keyof typeof actions];
      if (message) {
        const chatInput = this.chatContainer?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
        if (chatInput) {
          chatInput.value = message;
          await this.handleSendMessage();
        }
      }
      return;
    }

    const message = actions[action as keyof typeof actions];
    if (message) {
      const chatInput = this.chatContainer?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
      if (chatInput) {
        chatInput.value = message;
        await this.handleSendMessage();
      }
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const timestamp = Date.now();
    const message = { role, content, timestamp };
    this.chatHistory.push(message);

    const messagesContainer = this.chatContainer?.querySelector('#wepilot-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `wepilot-message wepilot-${role}-message`;
    
    const avatar = role === 'user' ? '👤' : '🤖';
    messageElement.innerHTML = `
      <div class="wepilot-message-avatar">${avatar}</div>
      <div class="wepilot-message-content">
        <div class="wepilot-message-text">${this.formatMessageContent(content)}</div>
      </div>
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
    const messagesContainer = this.chatContainer?.querySelector('#wepilot-messages');
    if (!messagesContainer) return;

    const indicator = document.createElement('div');
    indicator.className = 'wepilot-typing-indicator';
    indicator.id = 'wepilot-typing-indicator';
    indicator.innerHTML = `
      <div class="wepilot-message-avatar">🤖</div>
      <div class="wepilot-typing-content">
        AI is thinking...
        <div class="wepilot-typing-dots">
          <div class="wepilot-typing-dot"></div>
          <div class="wepilot-typing-dot"></div>
          <div class="wepilot-typing-dot"></div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private hideTypingIndicator() {
    const indicator = this.chatContainer?.querySelector('#wepilot-typing-indicator');
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

  public handleIncomingMessage(message: string) {
    // Show the dialog and pre-fill the input
    this.showDialog();
    const chatInput = this.chatContainer?.querySelector('#wepilot-chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = message;
      this.autoResizeTextarea(chatInput);
      chatInput.focus();
    }
  }

  public show() {
    if (this.chatContainer) {
      this.chatContainer.style.display = 'block';
      this.showDialog();
    }
  }

  public hide() {
    if (this.chatContainer) {
      this.chatContainer.style.display = 'none';
      this.isVisible = false;
      this.isMinimized = false;
    }
  }

  public toggle() {
    if (this.chatContainer?.style.display === 'none' || !this.isVisible) {
      this.show();
    } else {
      this.minimize();
    }
  }

  public isOpen(): boolean {
    return this.isVisible && !this.isMinimized;
  }

  private getFormDataFromPage() {
    const forms = Array.from(document.forms);
    return forms.map((form, index) => {
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
