export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIRequest {
  type: 'analyze' | 'fill_form' | 'click_element' | 'extract_content' | 'navigate' | 'general';
  instruction: string;
  context?: {
    url: string;
    title: string;
    selectedText?: string;
    pageContent?: string;
    visibleElements?: ElementInfo[];
    attachedFiles?: AttachedFile[];
  };
}

export interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string; // Always base64 encoded content (for both text and binary files)
  lastModified: number;
}

export interface AIResponse {
  success: boolean;
  message: string;
  actions?: Action[];
  data?: any;
}

export interface FormData {
  id: string;
  action: string;
  method: string;
  name: string;
  selector: string;
  fields: ElementInfo[];
}

export interface ElementInfo {
  id?: string;
  tag: string;
  type?: string;
  text?: string;
  placeholder?: string;
  value?: string;
  href?: string;
  className?: string;
  selector: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Form-specific properties
  label?: string;
  required?: boolean;
  checked?: boolean;
  options?: Array<{
    value: string;
    text: string;
    selected: boolean;
  }>;
}

export interface Action {
  type: 'fill' | 'click' | 'scroll' | 'highlight' | 'navigate';
  selector?: string;
  value?: string;
  url?: string;
  element?: ElementInfo;
}

export interface ExtensionSettings {
  apiKey?: string;
  aiProvider: 'openai' | 'claude' | 'deepseek' | 'ollama' | 'local';
  enablePageAnalysis: boolean;
  enableFormFilling: boolean;
  keyboardShortcut: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface ContentMessage {
  type: 'GET_PAGE_INFO' | 'EXECUTE_ACTION' | 'HIGHLIGHT_ELEMENT' | 'GET_FORM_DATA' | 
        'TOGGLE_FLOATING_CHAT' | 'SHOW_FLOATING_CHAT' | 'HIDE_FLOATING_CHAT' | 
        'SEND_MESSAGE_TO_CHAT';
  data?: any;
  tabId?: number;
}

export interface BackgroundMessage {
  type: 'OPEN_SIDEBAR' | 'PROCESS_AI_REQUEST' | 'UPDATE_SETTINGS' | 
        'TOGGLE_FLOATING_CHAT' | 'SHOW_FLOATING_CHAT' | 'AI_REQUEST' | 'EXECUTE_ACTION' |
        'SEND_MESSAGE_TO_CHAT';
  data?: any;
}
