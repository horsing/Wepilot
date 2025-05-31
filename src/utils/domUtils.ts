import { ElementInfo } from '../types';

export function generateSelector(element: Element): string {
  // Generate a unique CSS selector for an element
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = element.className.split(' ')
      .filter(cls => cls.trim())
      .slice(0, 3); // Limit to first 3 classes
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  // Add nth-child if needed for uniqueness
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      sibling => sibling.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selector += `:nth-child(${index})`;
    }
  }
  
  return selector;
}

export function getElementInfo(element: Element): ElementInfo {
  const rect = element.getBoundingClientRect();
  const info: ElementInfo = {
    tag: element.tagName.toLowerCase(),
    selector: generateSelector(element),
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

export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

export function findInteractiveElements(): ElementInfo[] {
  const selectors = [
    'input:not([type="hidden"])',
    'textarea',
    'select',
    'button',
    'a[href]',
    '[role="button"]',
    '[onclick]',
    '[tabindex]'
  ];
  
  const elements: ElementInfo[] = [];
  
  selectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    found.forEach(element => {
      if (isElementVisible(element)) {
        elements.push(getElementInfo(element));
      }
    });
  });
  
  return elements;
}

export function scrollToElement(selector: string): boolean {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center' 
    });
    return true;
  }
  return false;
}

export function highlightElement(selector: string, duration: number = 3000): boolean {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) return false;
  
  const originalStyle = element.style.cssText;
  const highlightStyle = `
    outline: 3px solid #4285f4 !important;
    outline-offset: 2px !important;
    background-color: rgba(66, 133, 244, 0.1) !important;
    transition: all 0.3s ease !important;
  `;
  
  element.style.cssText += highlightStyle;
  
  setTimeout(() => {
    element.style.cssText = originalStyle;
  }, duration);
  
  return true;
}

export function extractPageContent() {
  return {
    title: document.title,
    url: window.location.href,
    selectedText: window.getSelection()?.toString() || '',
    mainContent: getMainContent(),
    forms: getFormData(),
    links: getLinks(),
    images: getImages()
  };
}

function getMainContent(): string {
  // Try to find main content using common selectors
  const contentSelectors = [
    'main',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.content',
    '#content',
    'article',
    '.post-content',
    '.entry-content'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return element.textContent.trim().substring(0, 2000);
    }
  }
  
  // Fallback to body content
  return document.body.textContent?.trim().substring(0, 2000) || '';
}

export function getFormData() {
  const forms = Array.from(document.forms);
  const formData = forms.map((form, index) => {
    const formInfo = {
      id: form.id || `form-${index}`,
      action: form.action || window.location.href,
      method: form.method || 'GET',
      name: form.name || '',
      selector: generateSelector(form),
      fields: [] as ElementInfo[]
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
        
        // Filter out hidden and unlabeled inputs
        if (element instanceof HTMLInputElement) {
          // Skip hidden inputs
          if (element.type === 'hidden') {
            return null;
          }
          
          // Skip inputs that are not visible
          if (!isElementVisible(element)) {
            return null;
          }
        }
        
        const elementInfo = getElementInfo(element);
        
        // Get associated label first
        const label = document.querySelector(`label[for="${element.id}"]`) || 
                     element.closest('label');
        if (label) {
          elementInfo.label = label.textContent?.trim();
        }
        
        // Filter out inputs without labels, placeholders, or meaningful identifiers
        if (element instanceof HTMLInputElement) {
          const hasLabel = elementInfo.label && elementInfo.label.length > 0;
          const hasPlaceholder = element.placeholder && element.placeholder.length > 0;
          const hasName = element.name && element.name.length > 0;
          const hasId = element.id && element.id.length > 0;
          const isButton = element.type === 'submit' || element.type === 'button' || element.type === 'reset';
          
          // Keep buttons and inputs with some form of identification
          if (!isButton && !hasLabel && !hasPlaceholder && !hasName && !hasId) {
            return null;
          }
        }
        
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

        return elementInfo;
      }
      return null;
    }).filter((item): item is ElementInfo => item !== null);

    return formInfo;
  });

  return formData;
}

function getLinks() {
  return Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 20) // Limit to first 20 links
    .map(link => ({
      text: link.textContent?.trim() || '',
      href: (link as HTMLAnchorElement).href,
      selector: generateSelector(link)
    }));
}

function getImages() {
  return Array.from(document.querySelectorAll('img'))
    .slice(0, 10) // Limit to first 10 images
    .map(img => ({
      src: (img as HTMLImageElement).src,
      alt: (img as HTMLImageElement).alt,
      selector: generateSelector(img)
    }));
}
