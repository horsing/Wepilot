import { AIRequest, AIResponse, Action } from '../types';

export class AIService {
  private apiKey: string = '';
  private provider: 'openai' | 'claude' | 'deepseek' | 'ollama' | 'local' = 'local';
  private ollamaUrl: string = 'http://localhost:11434';

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    const result = await chrome.storage.sync.get(['apiKey', 'aiProvider', 'ollamaUrl']);
    this.apiKey = result.apiKey || '';
    this.provider = result.aiProvider || 'local';
    this.ollamaUrl = result.ollamaUrl || 'http://localhost:11434';
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Reload settings to get the latest configuration
      await this.loadSettings();
      
      // Use actual AI service if configured (even without API key for Ollama)
      if (this.provider === 'ollama' || (this.provider !== 'local' && this.apiKey)) {
        return await this.callAIService(request);
      }
      
      // Only fall back to simulation if explicitly set to 'local'
      if (this.provider === 'local') {
        return await this.simulateAIResponse(request);
      }
      
      // If provider is set but no API key, return helpful error
      return {
        success: false,
        message: `${this.provider.toUpperCase()} provider selected but no API key configured. Please set your API key in the extension settings.`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async callAIService(request: AIRequest): Promise<AIResponse> {
    switch (this.provider) {
      case 'openai':
        return await this.callOpenAI(request);
      case 'claude':
        return await this.callClaude(request);
      case 'deepseek':
        return await this.callDeepSeek(request);
      case 'ollama':
        return await this.callOllama(request);
      default:
        return await this.simulateAIResponse(request);
    }
  }

  private async callOpenAI(request: AIRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are Wepilot, an AI assistant that helps users interact with web pages. Analyze the user request and page context, then provide specific actions to accomplish the task. Return responses in JSON format with success, message, and actions fields.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return this.parseAIResponse(content);
    } catch (error) {
      return {
        success: false,
        message: `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async callClaude(request: AIRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are Wepilot, an AI assistant that helps users interact with web pages. Analyze the user request and page context, then provide specific actions to accomplish the task. Return responses in JSON format with success, message, and actions fields.\n\n${prompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      return this.parseAIResponse(content);
    } catch (error) {
      return {
        success: false,
        message: `Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async callDeepSeek(request: AIRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are Wepilot, an AI assistant that helps users interact with web pages. Analyze the user request and page context, then provide specific actions to accomplish the task. Return responses in JSON format with success, message, and actions fields.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return this.parseAIResponse(content);
    } catch (error) {
      return {
        success: false,
        message: `DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async callOllama(request: AIRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2', // Default model, can be made configurable
          messages: [
            {
              role: 'system',
              content: 'You are Wepilot, an AI assistant that helps users interact with web pages. Analyze the user request and page context, then provide specific actions to accomplish the task. Return responses in JSON format with success, message, and actions fields.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.message.content;
      
      return this.parseAIResponse(content);
    } catch (error) {
      return {
        success: false,
        message: `Ollama API error: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure Ollama is running on ${this.ollamaUrl}`
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const { type, instruction, context } = request;
    
    let prompt = `Task: ${instruction}\n`;
    prompt += `Action Type: ${type}\n`;
    
    if (context) {
      prompt += `\nPage Context:\n`;
      prompt += `URL: ${context.url}\n`;
      prompt += `Title: ${context.title}\n`;
      
      if (context.selectedText) {
        prompt += `Selected Text: ${context.selectedText}\n`;
      }
      
      // Include page content with length limits for API compatibility
      if (context.pageContent) {
        const maxPageContentLength = this.getMaxContentLength();
        let pageContent = context.pageContent;
        
        // For DeepSeek and other APIs, limit HTML content and clean it
        if (pageContent.length > maxPageContentLength) {
          // Try to extract meaningful content instead of raw HTML
          pageContent = this.extractMeaningfulContent(pageContent, maxPageContentLength);
        }
        
        prompt += `\nPage Content:\n${pageContent}\n`;
      }
      
      if (context.visibleElements && context.visibleElements.length > 0) {
        prompt += `\nVisible Elements:\n`;
        context.visibleElements.slice(0, 10).forEach((element: any, index: number) => {
          prompt += `${index + 1}. ${element.tag}`;
          if (element.text) prompt += ` - "${element.text}"`;
          if (element.placeholder) prompt += ` (placeholder: "${element.placeholder}")`;
          prompt += ` [${element.selector}]\n`;
        });
      }
      
      // Include attached files with size limits for API compatibility
      if (context.attachedFiles && context.attachedFiles.length > 0) {
        prompt += `\nAttached Files:\n`;
        context.attachedFiles.forEach((file: any, index: number) => {
          prompt += `${index + 1}. ${file.name} (${file.type}, ${file.size} bytes)\n`;
          
          // For plain text files, decode base64 and include readable content with limits
          const isPlainTextFile = file.type.startsWith('text/') || 
                                 file.name.endsWith('.md') || 
                                 file.name.endsWith('.txt') ||
                                 file.name.endsWith('.json') ||
                                 file.name.endsWith('.csv');
          
          if (isPlainTextFile) {
            try {
              // Decode base64 to get readable text content
              const fullContent = atob(file.content);
              const maxFileContentLength = 2000; // Limit per file
              
              if (fullContent.length > maxFileContentLength) {
                const truncated = fullContent.substring(0, maxFileContentLength);
                const lastSpace = truncated.lastIndexOf(' ');
                const finalContent = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
                prompt += `   Content (truncated):\n${finalContent}\n   [File content truncated for API compatibility]\n`;
              } else {
                prompt += `   Full Content:\n${fullContent}\n`;
              }
            } catch (error) {
              prompt += `   Content: [Error decoding base64 file content]\n`;
            }
          } else if (file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            // For document files, mention availability but don't include full base64 for most providers
            if (this.provider === 'openai') {
              // Only OpenAI GPT-4 Vision reliably supports base64 documents
              prompt += `   Document Content (base64-encoded, available for processing)\n`;
            } else {
              prompt += `   Document Content: [${file.type} file available but not included for API compatibility]\n`;
            }
          } else {
            // For other file types, show file info only
            prompt += `   Content: [Binary file - ${file.type}]\n`;
          }
        });
      }
    }
    
    prompt += `\nPlease analyze this request and provide specific actions to accomplish the task. Return a JSON response with:
- success: boolean
- message: string explanation
- actions: array of action objects with type, selector, value fields`;
    
    return prompt;
  }

  private parseAIResponse(content: string): AIResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: parsed.success || true,
          message: parsed.message || content,
          actions: parsed.actions || []
        };
      }
      
      // If no JSON found, return the content as a message
      return {
        success: true,
        message: content,
        actions: []
      };
    } catch (error) {
      return {
        success: true,
        message: content,
        actions: []
      };
    }
  }

  private async simulateAIResponse(request: AIRequest): Promise<AIResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const { type, instruction, context } = request;

    switch (type) {
      case 'fill_form':
        return this.handleFormFilling(instruction, context);
      
      case 'click_element':
        return this.handleElementClick(instruction, context);
      
      case 'extract_content':
        return this.handleContentExtraction(instruction, context);
      
      case 'navigate':
        return this.handleNavigation(instruction, context);
      
      case 'analyze':
        return this.handlePageAnalysis(instruction, context);
      
      default:
        return this.handleGeneralQuery(instruction, context);
    }
  }

  private handleFormFilling(instruction: string, context: any): AIResponse {
    // Look for form data in the instruction
    const formDataMatch = instruction.match(/Form Details:\s*([\s\S]*?)(?:Please provide|$)/);
    
    if (formDataMatch) {
      // Parse form information from the detailed message
      const formDetails = formDataMatch[1];
      const actions: Action[] = [];
      
      // Extract form information and generate intelligent filling actions
      const lines = formDetails.split('\n');
      let currentForm = '';
      
      for (const line of lines) {
        if (line.match(/Form \d+/)) {
          currentForm = line;
        } else if (line.trim().startsWith('- ')) {
          // This is a field description
          const fieldMatch = line.match(/- ([^:]+):\s*(\w+)(\s*\(required\))?/);
          if (fieldMatch) {
            const [, label, type, required] = fieldMatch;
            const isRequired = !!required;
            
            // Generate intelligent values based on field type and label
            const value = this.generateFieldValue(label.toLowerCase(), type, isRequired);
            if (value) {
              // Create a selector based on the label
              const selector = this.generateFieldSelector(label, type);
              actions.push({
                type: 'fill',
                selector,
                value
              });
            }
          }
        }
      }
      
      if (actions.length > 0) {
        return {
          success: true,
          message: `I've analyzed the form structure and prepared to fill ${actions.length} fields with appropriate sample data. Here's what I'll fill:\n\n${actions.map(action => `• ${action.selector}: "${action.value}"`).join('\n')}`,
          actions
        };
      }
    }
    
    // Fallback to original logic for simpler requests
    const actions: Action[] = [];
    
    // Look for common form fields and suggest values
    if (instruction.toLowerCase().includes('contact') || instruction.toLowerCase().includes('form')) {
      actions.push(
        {
          type: 'fill',
          selector: 'input[name*="name"], input[id*="name"], input[placeholder*="name"]',
          value: 'John Doe'
        },
        {
          type: 'fill', 
          selector: 'input[type="email"], input[name*="email"], input[id*="email"]',
          value: 'john.doe@example.com'
        },
        {
          type: 'fill',
          selector: 'input[type="tel"], input[name*="phone"], input[id*="phone"]',
          value: '(555) 123-4567'
        }
      );
    }

    return {
      success: true,
      message: `I've identified ${actions.length} form fields to fill. The form will be populated with sample contact information.`,
      actions
    };
  }

  private generateFieldValue(label: string, type: string, required: boolean): string | null {
    const labelLower = label.toLowerCase();
    
    // Email fields
    if (type === 'email' || labelLower.includes('email')) {
      return 'john.doe@example.com';
    }
    
    // Phone fields
    if (type === 'tel' || labelLower.includes('phone') || labelLower.includes('tel')) {
      return '(555) 123-4567';
    }
    
    // Name fields
    if (labelLower.includes('name')) {
      if (labelLower.includes('first')) return 'John';
      if (labelLower.includes('last')) return 'Doe';
      if (labelLower.includes('full')) return 'John Doe';
      return 'John Doe';
    }
    
    // Address fields
    if (labelLower.includes('address')) {
      if (labelLower.includes('street')) return '123 Main Street';
      if (labelLower.includes('city')) return 'New York';
      if (labelLower.includes('state')) return 'NY';
      if (labelLower.includes('zip') || labelLower.includes('postal')) return '10001';
      return '123 Main Street';
    }
    
    // Company/Organization fields
    if (labelLower.includes('company') || labelLower.includes('organization')) {
      return 'Acme Corporation';
    }
    
    // Job/Role fields
    if (labelLower.includes('job') || labelLower.includes('title') || labelLower.includes('role')) {
      return 'Software Developer';
    }
    
    // Age/Date fields
    if (labelLower.includes('age')) {
      return '30';
    }
    
    if (type === 'date' || labelLower.includes('date')) {
      return '1990-01-01';
    }
    
    // Generic text fields
    if (type === 'text' || type === 'textarea') {
      if (labelLower.includes('comment') || labelLower.includes('message') || labelLower.includes('note')) {
        return 'This is a sample message for testing purposes.';
      }
      return 'Sample text';
    }
    
    // Number fields
    if (type === 'number') {
      return '1';
    }
    
    // URL fields
    if (type === 'url' || labelLower.includes('website') || labelLower.includes('url')) {
      return 'https://example.com';
    }
    
    return null;
  }

  private generateFieldSelector(label: string, type: string): string {
    const labelForSelector = label.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    
    // Try multiple selector strategies
    const selectors = [
      `input[name*="${labelForSelector}"]`,
      `input[id*="${labelForSelector}"]`,
      `input[placeholder*="${label}"]`,
      `textarea[name*="${labelForSelector}"]`,
      `textarea[id*="${labelForSelector}"]`,
      `select[name*="${labelForSelector}"]`,
      `select[id*="${labelForSelector}"]`
    ];
    
    if (type === 'email') {
      selectors.unshift('input[type="email"]');
    } else if (type === 'tel') {
      selectors.unshift('input[type="tel"]');
    } else if (type === 'textarea') {
      selectors.unshift('textarea');
    } else if (type === 'select') {
      selectors.unshift('select');
    }
    
    return selectors.join(', ');
  }

  private handleElementClick(instruction: string, context: any): AIResponse {
    // Parse instruction to find what element to click
    let selector = '';
    let message = '';

    if (instruction.toLowerCase().includes('submit')) {
      selector = 'input[type="submit"], button[type="submit"], button:contains("submit")';
      message = 'I\'ll click the submit button for you.';
    } else if (instruction.toLowerCase().includes('button')) {
      selector = 'button';
      message = 'I\'ll click the first button I find.';
    } else if (instruction.toLowerCase().includes('link')) {
      selector = 'a[href]';
      message = 'I\'ll click the first link I find.';
    } else {
      return {
        success: false,
        message: 'I couldn\'t identify which element you want me to click. Please be more specific.'
      };
    }

    return {
      success: true,
      message,
      actions: [{
        type: 'click',
        selector
      }]
    };
  }

  private handleContentExtraction(instruction: string, context: any): AIResponse {
    return {
      success: true,
      message: 'I\'ve analyzed the page content. Here\'s what I found:',
      data: {
        title: context?.title || 'Page Title',
        url: context?.url || window.location.href,
        summary: 'This appears to be a web page with various interactive elements including forms, links, and content sections.',
        keyElements: context?.visibleElements?.slice(0, 5) || []
      }
    };
  }

  private handleNavigation(instruction: string, context: any): AIResponse {
    // Simulate navigation logic
    let url = '';
    
    if (instruction.toLowerCase().includes('home')) {
      url = '/';
    } else if (instruction.toLowerCase().includes('back')) {
      return {
        success: true,
        message: 'I\'ll take you back to the previous page.',
        actions: [{ type: 'navigate', url: 'history:back' }]
      };
    }

    return {
      success: false,
      message: 'I need more specific instructions about where you\'d like to navigate.'
    };
  }

  private handlePageAnalysis(instruction: string, context: any): AIResponse {
    const elements = context?.visibleElements || [];
    const formCount = elements.filter((el: any) => 
      ['input', 'textarea', 'select'].includes(el.tag)
    ).length;
    const linkCount = elements.filter((el: any) => el.tag === 'a').length;
    
    return {
      success: true,
      message: `I've analyzed this page and found:
• ${formCount} form fields
• ${linkCount} links  
• ${elements.length} total interactive elements

The page appears to be focused on ${this.inferPagePurpose(context)}. Let me know what you'd like to do next!`,
      data: {
        elementCount: elements.length,
        formFields: formCount,
        links: linkCount,
        purpose: this.inferPagePurpose(context)
      }
    };
  }

  private handleGeneralQuery(instruction: string, context: any): AIResponse {
    return {
      success: true,
      message: `I understand you want to: "${instruction}". Based on the current page, I can help you with:

• Filling out forms
• Clicking buttons and links  
• Extracting content
• Navigating the page
• Analyzing page elements

Please let me know specifically what you'd like me to do!`
    };
  }

  private inferPagePurpose(context: any): string {
    const url = context?.url || '';
    const title = context?.title || '';
    
    if (url.includes('login') || title.toLowerCase().includes('login')) return 'user authentication';
    if (url.includes('checkout') || title.toLowerCase().includes('checkout')) return 'e-commerce checkout';
    if (url.includes('contact') || title.toLowerCase().includes('contact')) return 'contact/communication';
    if (url.includes('search') || title.toLowerCase().includes('search')) return 'search functionality';
    if (url.includes('profile') || title.toLowerCase().includes('profile')) return 'user profile management';
    
    return 'general web interaction';
  }

  private getMaxContentLength(): number {
    // Different providers have different limits
    switch (this.provider) {
      case 'deepseek':
        return 8000; // Conservative limit for DeepSeek API
      case 'claude':
        return 15000; // Claude can handle more
      case 'openai':
        return 12000; // GPT-4 limit
      case 'ollama':
        return 20000; // Local models can handle more
      default:
        return 10000; // Safe default
    }
  }

  private extractMeaningfulContent(htmlContent: string, maxLength: number): string {
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      // Remove script and style tags
      const scripts = tempDiv.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());

      // Extract meaningful text content
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // If text content is still too long, truncate intelligently
      if (textContent.length > maxLength) {
        const truncated = textContent.substring(0, maxLength - 100);
        const lastSpace = truncated.lastIndexOf(' ');
        return lastSpace > 0 ? 
          truncated.substring(0, lastSpace) + '\n\n[Content truncated for API compatibility]' :
          truncated + '\n\n[Content truncated for API compatibility]';
      }

      return textContent;
    } catch (error) {
      // Fallback: simple text truncation
      const plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plainText.length > maxLength) {
        return plainText.substring(0, maxLength - 100) + '\n\n[Content truncated for API compatibility]';
      }
      return plainText;
    }
  }
}
