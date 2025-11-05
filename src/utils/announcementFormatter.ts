/**
 * Utility functions for formatting announcement content
 * Handles line breaks, bullet points, and other formatting for both email and portal display
 */

export interface FormattedContent {
  html: string;
  text: string;
}

/**
 * Formats announcement content for HTML display (email and portal)
 * Converts line breaks, bullet points, and other formatting to proper HTML
 */
export function formatAnnouncementContentForHTML(content: string): string {
  if (!content) return '';
  
  // Convert line breaks to HTML
  let formatted = content.replace(/\n/g, '<br>');
  
  // Convert bullet points (• or - or *) to proper HTML lists
  // Handle different bullet styles
  formatted = formatted.replace(/(?:^|<br>)(\s*)(?:•|[-*])\s+(.+?)(?=<br>|$)/gm, '<br>$1• $2');
  
  // Convert multiple consecutive bullet points into proper lists
  const lines = formatted.split('<br>');
  const processedLines: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBulletPoint = /^\s*•\s+/.test(line);
    
    if (isBulletPoint) {
      if (!inList) {
        processedLines.push('<ul style="margin: 8px 0; padding-left: 20px;">');
        inList = true;
      }
      const listItem = line.replace(/^\s*•\s+/, '').trim();
      processedLines.push(`<li style="margin: 4px 0;">${listItem}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close any remaining list
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('<br>');
}

/**
 * Formats announcement content for plain text display
 * Preserves line breaks and bullet points in a readable format
 */
export function formatAnnouncementContentForText(content: string): string {
  if (!content) return '';
  
  // Preserve line breaks and bullet points as-is for text
  return content;
}

/**
 * Formats announcement content for React component display
 * Returns both HTML and text versions for different use cases
 */
export function formatAnnouncementContent(content: string): FormattedContent {
  return {
    html: formatAnnouncementContentForHTML(content),
    text: formatAnnouncementContentForText(content)
  };
}

/**
 * Formats announcement content for CSS-in-JS display
 * Converts to CSS-friendly format for React components
 */
export function formatAnnouncementContentForCSS(content: string): string {
  if (!content) return '';
  
  // For CSS display, we'll use white-space: pre-wrap to preserve formatting
  // and handle bullet points with CSS pseudo-elements
  return content;
}





