import { ContentMessage, Action, ElementInfo, FormData } from '../types';
import { 
  extractPageContent, 
  findInteractiveElements, 
  highlightElement, 
  scrollToElement,
  getElementInfo,
  getFormData
} from '../utils/domUtils';
import { FloatingChat } from './floating-chat';

class ContentScript {
  private isInitialized = false;
  private floatingChat: FloatingChat | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;
    
    this.setupMessageListener();
    this.setupPageObserver();
    this.initializeFloatingChat();
    this.isInitialized = true;
    
    console.log('Wepilot content script loaded');
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: ContentMessage, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  private setupPageObserver() {
    // Observer for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid excessive processing
      clearTimeout(this.observerTimeout);
      this.observerTimeout = setTimeout(() => {
        this.onPageChanged();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  private observerTimeout: any = null;

  private initializeFloatingChat() {
    // Initialize the floating chat
    this.floatingChat = new FloatingChat();
  }

  private onPageChanged() {
    // Notify background script about page changes if needed
    // This could be used to update the AI's understanding of the page
  }

  private async handleMessage(message: ContentMessage, sendResponse: (response: any) => void) {
    try {
      switch (message.type) {
        case 'GET_PAGE_INFO':
          const pageInfo = await this.getPageInfo();
          sendResponse({ success: true, data: pageInfo });
          break;

        case 'EXECUTE_ACTION':
          const result = await this.executeAction(message.data);
          sendResponse(result);
          break;

        case 'HIGHLIGHT_ELEMENT':
          const highlighted = this.highlightElement(message.data.selector);
          sendResponse({ success: highlighted });
          break;

        case 'GET_FORM_DATA':
          const formData = this.getFormData();
          sendResponse({ success: true, data: formData });
          break;

        case 'TOGGLE_FLOATING_CHAT':
          this.floatingChat?.toggle();
          sendResponse({ success: true });
          break;

        case 'SHOW_FLOATING_CHAT':
          this.floatingChat?.show();
          sendResponse({ success: true });
          break;

        case 'HIDE_FLOATING_CHAT':
          this.floatingChat?.hide();
          sendResponse({ success: true });
          break;

        case 'SEND_MESSAGE_TO_CHAT':
          this.floatingChat?.handleIncomingMessage(message.data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async getPageInfo() {
    return {
      ...extractPageContent(),
      interactiveElements: findInteractiveElements(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }
    };
  }

  private async executeAction(action: Action) {
    try {
      switch (action.type) {
        case 'fill':
          return this.fillField(action.selector!, action.value!);
        
        case 'click':
          return this.clickElement(action.selector!);
        
        case 'scroll':
          return this.scrollToElement(action.selector!);
        
        case 'highlight':
          return this.highlightElement(action.selector!);
        
        case 'navigate':
          return this.navigate(action.url!);
        
        default:
          return { success: false, error: 'Unknown action type' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Action failed' 
      };
    }
  }

  private fillField(selector: string, value: string) {
    const elements = document.querySelectorAll(selector);
    let filled = 0;

    elements.forEach(element => {
      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = value.toLowerCase() === 'true' || value === '1';
        } else {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        filled++;
      } else if (element instanceof HTMLTextAreaElement) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      } else if (element instanceof HTMLSelectElement) {
        // Try to find matching option
        const option = Array.from(element.options).find(opt => 
          opt.text.toLowerCase().includes(value.toLowerCase()) ||
          opt.value.toLowerCase().includes(value.toLowerCase())
        );
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        }
      }
    });

    return { 
      success: filled > 0, 
      message: `Filled ${filled} field(s)`,
      count: filled 
    };
  }

  private clickElement(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    // Scroll to element first
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Highlight briefly before clicking
    this.highlightElement(selector, 1000);
    
    // Click after a short delay
    setTimeout(() => {
      element.click();
    }, 500);

    return { 
      success: true, 
      message: `Clicked element: ${element.tagName}`,
      element: getElementInfo(element)
    };
  }

  private scrollToElement(selector: string) {
    const success = scrollToElement(selector);
    return { 
      success, 
      message: success ? 'Scrolled to element' : 'Element not found' 
    };
  }

  private highlightElement(selector: string, duration: number = 3000) {
    const success = highlightElement(selector, duration);
    return { 
      success, 
      message: success ? 'Element highlighted' : 'Element not found' 
    };
  }

  private navigate(url: string) {
    if (url === 'history:back') {
      window.history.back();
      return { success: true, message: 'Navigated back' };
    } else if (url === 'history:forward') {
      window.history.forward();
      return { success: true, message: 'Navigated forward' };
    } else {
      window.location.href = url;
      return { success: true, message: `Navigating to ${url}` };
    }
  }

  private getFormData(): FormData[] {
    return getFormData();
  }

  // Public method to manually trigger page analysis
  public analyzeCurrentPage() {
    return this.getPageInfo();
  }

  // Method to inject CSS for highlighting and other visual effects
  private injectStyles() {
    if (document.getElementById('wepilot-styles')) return;

    const style = document.createElement('style');
    style.id = 'wepilot-styles';
    style.textContent = `
      .wepilot-highlight {
        outline: 3px solid #4285f4 !important;
        outline-offset: 2px !important;
        background-color: rgba(66, 133, 244, 0.1) !important;
        transition: all 0.3s ease !important;
      }
      
      .wepilot-processing {
        position: relative;
      }
      
      .wepilot-processing::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(66, 133, 244, 0.1);
        border: 2px dashed #4285f4;
        pointer-events: none;
        animation: wepilot-pulse 1s infinite;
      }
      
      @keyframes wepilot-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}
