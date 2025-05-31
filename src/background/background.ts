import { BackgroundMessage, ContentMessage, AIRequest } from '../types';
import { AIService } from '../utils/aiService';

class BackgroundService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
    this.setupMessageListeners();
    this.setupCommandListeners();
    this.setupInstallHandler();
  }

  private setupMessageListeners() {
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  private setupCommandListeners() {
    // Listen for keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'toggle-sidebar') {
        this.toggleFloatingChatForCurrentTab();
      }
    });
  }

  private setupInstallHandler() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleInstall();
      }
    });
  }

  private async handleMessage(
    message: BackgroundMessage, 
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    try {
      switch (message.type) {
        case 'OPEN_SIDEBAR':
          await this.openSidebar(sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'TOGGLE_FLOATING_CHAT':
          await this.toggleFloatingChat(sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'SHOW_FLOATING_CHAT':
          await this.showFloatingChat(sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'AI_REQUEST':
          const aiResponse = await this.aiService.processRequest(message.data as AIRequest);
          sendResponse(aiResponse);
          break;

        case 'EXECUTE_ACTION':
          await this.executeActionOnTab(message.data, sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'SEND_MESSAGE_TO_CHAT':
          await this.sendMessageToFloatingChat(message.data, sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'PROCESS_AI_REQUEST':
          const response = await this.aiService.processRequest(message.data as AIRequest);
          sendResponse(response);
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async openSidebar(tabId?: number) {
    if (!tabId) return;
    
    try {
      // Open the side panel for the current tab
      await chrome.sidePanel.open({ tabId });
    } catch (error) {
      console.error('Failed to open sidebar:', error);
      // Fallback: try to open as a popup window
      await chrome.windows.create({
        url: chrome.runtime.getURL('sidebar.html'),
        type: 'popup',
        width: 400,
        height: 600,
        left: screen.width - 420,
        top: 100
      });
    }
  }

  private async toggleSidebar() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await this.openSidebar(tab.id);
    }
  }

  private async toggleFloatingChat(tabId?: number) {
    if (!tabId) return;
    
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FLOATING_CHAT' });
    } catch (error) {
      console.error('Failed to toggle floating chat:', error);
    }
  }

  private async showFloatingChat(tabId?: number) {
    if (!tabId) return;
    
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'SHOW_FLOATING_CHAT' });
    } catch (error) {
      console.error('Failed to show floating chat:', error);
    }
  }

  private async executeActionOnTab(action: any, tabId?: number) {
    if (!tabId) return;
    
    try {
      await chrome.tabs.sendMessage(tabId, { 
        type: 'EXECUTE_ACTION', 
        data: action 
      });
    } catch (error) {
      console.error('Failed to execute action on tab:', error);
    }
  }

  private async toggleFloatingChatForCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await this.toggleFloatingChat(tab.id);
    }
  }

  private async sendMessageToFloatingChat(message: string, tabId?: number) {
    if (!tabId) return;
    
    try {
      await chrome.tabs.sendMessage(tabId, { 
        type: 'SEND_MESSAGE_TO_CHAT', 
        data: message 
      });
    } catch (error) {
      console.error('Failed to send message to floating chat:', error);
    }
  }

  private async updateSettings(settings: any) {
    await chrome.storage.sync.set(settings);
  }

  private async handleInstall() {
    // Set default settings
    const defaultSettings = {
      enablePageAnalysis: true,
      enableFormFilling: true,
      keyboardShortcut: 'Ctrl+Shift+Y',
      theme: 'auto',
      aiProvider: 'local'
    };

    await chrome.storage.sync.set(defaultSettings);
    
    // Open welcome page
    await chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
  }

  // Method to communicate with content scripts
  async sendToContentScript(tabId: number, message: ContentMessage) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      return { success: false, error: 'Content script not available' };
    }
  }

  // Method to get current tab info
  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Method to execute actions in content script
  async executeAction(tabId: number, action: any) {
    return this.sendToContentScript(tabId, {
      type: 'EXECUTE_ACTION',
      data: action
    });
  }
}

// Initialize the background service
new BackgroundService();
