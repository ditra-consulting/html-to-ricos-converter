/**
 * HTML to Ricos Converter
 * Converts HTML content to Wix Ricos format with proper styling and spacing
 */

const sanitizeHtml = require('sanitize-html');
const { v4: uuidv4 } = require('uuid');
const { JSDOM } = require('jsdom');

// Set up a global DOM environment for Node.js
global.DOMParser = new JSDOM().window.DOMParser;

/**
 * Helper function to generate a node ID
 * @returns {string} A short random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Helper function to create a spacing paragraph
 * @returns {Object} A Ricos paragraph node for spacing
 */
function createSpacingParagraph() {
  return {
    type: 'PARAGRAPH',
    id: generateId(),
    nodes: [{
      type: 'TEXT',
      id: '',
      textData: {
        text: ' '
      }
    }]
  };
}

/**
 * Process style attribute of an HTML element
 * @param {HTMLElement} element - The element to process
 * @returns {Object|null} Parsed style data or null if no style
 */
function processNodeStyle(element) {
  const style = element.getAttribute('style');
  if (!style) return null;
  
  const styleData = {};
  
  // Parse margin and padding
  if (style.includes('margin')) {
    styleData.margin = true;
  }
  
  if (style.includes('padding')) {
    styleData.padding = true;
  }
  
  // Parse text alignment
  if (style.includes('text-align')) {
    if (style.includes('text-align: center')) {
      styleData.textAlignment = 'CENTER';
    } else if (style.includes('text-align: right')) {
      styleData.textAlignment = 'RIGHT';
    } else if (style.includes('text-align: justify')) {
      styleData.textAlignment = 'JUSTIFY';
    } else {
      styleData.textAlignment = 'LEFT';
    }
  }
  
  // Parse color
  const colorMatch = style.match(/color\s*:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|[a-zA-Z]+)\s*(!important)?/);
  if (colorMatch) {
    styleData.color = colorMatch[1];
  }
  
  // Parse font size
  const fontSizeMatch = style.match(/font-size\s*:\s*(\d+)(px|pt|em|rem)?\s*(!important)?/);
  if (fontSizeMatch) {
    styleData.fontSize = parseInt(fontSizeMatch[1]);
  }
  
  // Parse font weight
  const fontWeightMatch = style.match(/font-weight\s*:\s*(\d+|bold|normal)\s*(!important)?/);
  if (fontWeightMatch) {
    if (fontWeightMatch[1] === 'bold') {
      styleData.fontWeight = 700;
    } else if (fontWeightMatch[1] === 'normal') {
      styleData.fontWeight = 400;
    } else {
      styleData.fontWeight = parseInt(fontWeightMatch[1]);
    }
  }
  
  return styleData;
}

/**
 * Process class attribute of an HTML element
 * @param {HTMLElement} element - The element to process
 * @returns {Object|null} Parsed class data or null if no class
 */
function processNodeClass(element) {
  const className = element.getAttribute('class');
  if (!className) return null;
  
  const classData = {};
  
  // Check for common class indicators
  if (className.includes('highlight') || className.includes('important')) {
    classData.highlight = true;
  }
  
  if (className.includes('center') || className.includes('text-center')) {
    classData.textAlignment = 'CENTER';
  }
  
  if (className.includes('right') || className.includes('text-right')) {
    classData.textAlignment = 'RIGHT';
  }
  
  if (className.includes('justify') || className.includes('text-justify')) {
    classData.textAlignment = 'JUSTIFY';
  }
  
  // Section classes for spacing
  if (className.includes('section') || className.includes('container')) {
    classData.isSection = true;
  }
  
  return classData;
}

/**
 * Process text and inline elements
 * @param {HTMLElement} element - The element to process
 * @returns {Array} Array of Ricos nodes
 */
function processTextAndInlineElements(element) {
  const tempNodes = [];
  const childNodes = element.childNodes;
  
  // Get style for the parent element
  const parentStyle = processNodeStyle(element);
  
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    
    if (child.nodeType === 3) { // Node.TEXT_NODE
      const text = child.textContent;
      if (text && text.trim()) {
        const textNode = {
          type: 'TEXT',
          id: '',
          textData: {
            text: text
          }
        };
        
        // Apply parent style if available
        if (parentStyle && (parentStyle.color || parentStyle.fontWeight)) {
          textNode.textData.decorations = [];
          
          // Add color decoration if available
          if (parentStyle.color) {
            textNode.textData.decorations.push({
              type: 'COLOR',
              colorData: {
                color: parentStyle.color
              }
            });
          }
          
          // Add bold decoration if font weight is bold
          if (parentStyle.fontWeight && parentStyle.fontWeight >= 600) {
            textNode.textData.decorations.push({
              type: 'BOLD',
              fontWeightValue: parentStyle.fontWeight
            });
          }
        }
        
        tempNodes.push(textNode);
      }
    } else if (child.nodeType === 1) { // Node.ELEMENT_NODE
      const childElement = child;
      const tagName = childElement.tagName.toLowerCase();
      
      // Handle inline elements
      switch (tagName) {
        case 'strong':
        case 'b':
          tempNodes.push({
            type: 'TEXT',
            id: '',
            textData: {
              text: childElement.textContent || '',
              decorations: [{
                type: 'BOLD',
                fontWeightValue: 700
              }]
            }
          });
          break;
          
        case 'em':
        case 'i':
          tempNodes.push({
            type: 'TEXT',
            id: '',
            textData: {
              text: childElement.textContent || '',
              decorations: [{
                type: 'ITALIC'
              }]
            }
          });
          break;
          
        case 'u':
          tempNodes.push({
            type: 'TEXT',
            id: '',
            textData: {
              text: childElement.textContent || '',
              decorations: [{
                type: 'UNDERLINE'
              }]
            }
          });
          break;
          
        case 'a':
          tempNodes.push({
            type: 'TEXT',
            id: '',
            textData: {
              text: childElement.textContent || '',
              decorations: [
                {
                  type: 'LINK',
                  linkData: {
                    link: {
                      url: childElement.getAttribute('href') || '',
                      target: childElement.getAttribute('target') === '_blank' ? 'BLANK' : 'SELF',
                      rel: {
                        noreferrer: true
                      }
                    }
                  }
                },
                {
                  type: 'UNDERLINE'
                }
              ]
            }
          });
          break;
          
        case 'span':
          // Process span content and pass it up
          tempNodes.push(...processTextAndInlineElements(childElement));
          break;
          
        case 'br':
          // Add a line break by pushing a paragraph break
          tempNodes.push({
            type: 'TEXT',
            id: '',
            textData: {
              text: '\n'
            }
          });
          break;
          
        case 'img':
          // Handle inline images
          const imgWidth = childElement.hasAttribute('width') ? parseInt(childElement.getAttribute('width') || '0') : 500;
          const imgHeight = childElement.hasAttribute('height') ? parseInt(childElement.getAttribute('height') || '0') : 300;
          
          tempNodes.push({
            type: 'IMAGE',
            id: generateId(),
            imageData: {
              containerData: {
                width: {
                  size: 'CONTENT'
                },
                alignment: 'CENTER',
                textWrap: true
              },
              image: {
                src: {
                  url: childElement.getAttribute('src') || ''
                },
                width: imgWidth,
                height: imgHeight
              }
            }
          });
          break;
          
        default:
          // Check if this is a block element that needs special handling
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'pre', 'ul', 'ol', 'li'].includes(tagName)) {
            // Process these elements normally through the main converter
            tempNodes.push(...handleBlockElement(childElement));
          } else {
            // Process other inline elements recursively
            tempNodes.push(...processTextAndInlineElements(childElement));
          }
          break;
      }
    }
  }
  
  return tempNodes;
}

/**
 * Handle table element
 * @param {HTMLElement} element - The table element to process
 * @returns {Object} A Ricos table node
 */
function handleTable(element) {
  // Get all rows from table
  const rows = element.querySelectorAll('tr');
  if (!rows || rows.length === 0) {
    return createSpacingParagraph(); // Return empty paragraph if no rows
  }
  
  const tableRows = [];
  const rowsHeight = [];
  let maxCols = 0;
  
  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowCells = [];
    const isHeaderRow = row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead';
    
    // Get cells from row (th or td)
    let cells = row.querySelectorAll('th, td');
    if (!cells || cells.length === 0) {
      continue; // Skip empty rows
    }
    
    // Track max columns for column width calculation
    maxCols = Math.max(maxCols, cells.length);
    
    // Track row height
    rowsHeight.push(50); // Default height for rows
    
    // Process each cell
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const isHeader = cell.tagName.toLowerCase() === 'th' || isHeaderRow;
      
      // Create cell node
      const cellNode = {
        type: 'TABLE_CELL',
        id: generateId()
      };
      
      // Get cell content
      const cellContentNodes = processTextAndInlineElements(cell);
      
      // Create paragraph for cell content
      const cellParagraph = {
        type: 'PARAGRAPH',
        id: generateId(),
        paragraphData: {
          textStyle: {
            textAlignment: 'CENTER' // Center text in table cells
          }
        }
      };
      
      if (cellContentNodes.length > 0) {
        cellParagraph.nodes = cellContentNodes;
      } else {
        // Text node for cell content if no other content
        const textNode = {
          type: 'TEXT',
          id: '',
          textData: {
            text: cell.textContent || ''
          }
        };
        
        // Add bold decoration for headers
        if (isHeader) {
          textNode.textData.decorations = [{
            type: 'BOLD',
            fontWeightValue: 700
          }];
        }
        
        cellParagraph.nodes = [textNode];
      }
      
      // Check for colspan
      const colspan = cell.getAttribute('colspan');
      if (colspan) {
        cellNode.cellData = {
          colspan: parseInt(colspan)
        };
      }
      
      cellNode.nodes = [cellParagraph];
      rowCells.push(cellNode);
    }
    
    // Create row node with cells
    const rowNode = {
      type: 'TABLE_ROW',
      id: generateId(),
      nodes: rowCells
    };
    
    tableRows.push(rowNode);
  }
  
  // Create column widths with better proportions
  const colsWidthRatio = [];
  const colsMinWidth = [];
  
  for (let i = 0; i < maxCols; i++) {
    colsWidthRatio.push(150); // Increased for better spacing
    colsMinWidth.push(140);   // Increased for better spacing
  }
  
  // Complete table node with better styling
  return {
    type: 'TABLE',
    id: generateId(),
    nodes: tableRows,
    tableData: {
      dimensions: {
        colsWidthRatio,
        rowsHeight,
        colsMinWidth
      },
      borderColor: '#CFCFCF',  // Add light border color
      cellStyle: {
        borderWidth: 1,
        borderStyle: 'solid'
      }
    }
  };
}

/**
 * Handle block elements inside other elements
 * @param {HTMLElement} element - The element to process
 * @returns {Array} Array of Ricos nodes
 */
function handleBlockElement(element) {
  const blockNodes = [];
  const tagName = element.tagName.toLowerCase();
  
  switch (tagName) {
    case 'p':
      const pStyle = processNodeStyle(element);
      const paragraphNode = {
        type: 'PARAGRAPH',
        id: generateId(),
        nodes: processTextAndInlineElements(element)
      };
      
      // Add paragraph spacing data if style exists
      if (pStyle) {
        paragraphNode.paragraphData = {
          textStyle: {
            textAlignment: pStyle.textAlignment || 'AUTO'
          }
        };
        
        // Add indentation to create spacing effect
        if (pStyle.margin || pStyle.padding) {
          paragraphNode.paragraphData.indentation = 1;
        }
      }
      
      blockNodes.push(paragraphNode);
      break;
      
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      // Add spacing before h2 and h3 elements
      if (tagName === 'h2' || tagName === 'h3') {
        blockNodes.push(createSpacingParagraph());
      }
      
      const headingLevel = parseInt(tagName.charAt(1));
      const headingStyle = processNodeStyle(element);
      const headingNode = {
        type: 'HEADING',
        id: generateId(),
        nodes: processTextAndInlineElements(element),
        headingData: {
          level: Math.min(headingLevel, 6), // Ensure level is 1-6
          textStyle: {
            textAlignment: headingStyle?.textAlignment || 'AUTO'
          }
        }
      };
      
      blockNodes.push(headingNode);
      
      // Add empty paragraph after headings for spacing
      blockNodes.push(createSpacingParagraph());
      
      // Add extra spacing for h2 elements (main section headers)
      if (tagName === 'h2') {
        blockNodes.push(createSpacingParagraph());
      }
      break;
      
    case 'ul':
      blockNodes.push({
        type: 'BULLETED_LIST',
        id: generateId(),
        nodes: convertNodeToRicos(element)
      });
      // Add spacing after lists
      blockNodes.push(createSpacingParagraph());
      break;
      
    case 'ol':
      blockNodes.push({
        type: 'ORDERED_LIST',
        id: generateId(),
        nodes: convertNodeToRicos(element)
      });
      // Add spacing after lists
      blockNodes.push(createSpacingParagraph());
      break;
      
    case 'li':
      blockNodes.push({
        type: 'LIST_ITEM',
        id: generateId(),
        nodes: processTextAndInlineElements(element)
      });
      break;
      
    case 'blockquote':
      // Convert blockquote to a special paragraph
      blockNodes.push({
        type: 'BLOCKQUOTE',
        id: generateId(),
        nodes: processTextAndInlineElements(element)
      });
      // Add spacing after blockquote
      blockNodes.push(createSpacingParagraph());
      break;
      
    case 'pre':
    case 'code':
      // Convert pre/code to a code block
      blockNodes.push({
        type: 'CODE_BLOCK',
        id: generateId(),
        nodes: [{
          type: 'TEXT',
          id: '',
          textData: {
            text: element.textContent || ''
          }
        }]
      });
      // Add spacing after code blocks
      blockNodes.push(createSpacingParagraph());
      break;
      
    case 'div':
      // Get class information
      const divClass = processNodeClass(element);
      
      // Process div children - either convert to paragraphs or process block elements
      const hasBlockChildren = Array.from(element.children).some(child => 
        ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'pre', 'ul', 'ol', 'table'].includes(
          child.tagName.toLowerCase()
        )
      );
      
      // Add spacing before sections
      if (divClass && divClass.isSection) {
        blockNodes.push(createSpacingParagraph());
        blockNodes.push(createSpacingParagraph());
      }
      
      if (hasBlockChildren) {
        // If div contains block elements, process each child
        for (let i = 0; i < element.childNodes.length; i++) {
          const childNode = element.childNodes[i];
          if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
            const childElement = childNode;
            blockNodes.push(...convertNodeToRicos(childElement));
          } else if (childNode.nodeType === 3) { // Node.TEXT_NODE
            const text = childNode.textContent?.trim();
            if (text) {
              // Wrap text nodes in paragraphs
              blockNodes.push({
                type: 'PARAGRAPH',
                id: generateId(),
                nodes: [{
                  type: 'TEXT',
                  id: '',
                  textData: {
                    text
                  }
                }]
              });
            }
          }
        }
      } else {
        // If div only contains text or inline elements, convert to paragraph
        const paragraphNode = {
          type: 'PARAGRAPH',
          id: generateId(),
          nodes: processTextAndInlineElements(element)
        };
        
        // Apply class-based styling
        if (divClass && divClass.textAlignment) {
          paragraphNode.paragraphData = {
            textStyle: {
              textAlignment: divClass.textAlignment
            }
          };
        }
        
        blockNodes.push(paragraphNode);
      }
      
      // Add spacing after sections
      if (divClass && divClass.isSection) {
        blockNodes.push(createSpacingParagraph());
        blockNodes.push(createSpacingParagraph());
      }
      break;
      
    default:
      // For any other block element, convert to paragraph
      blockNodes.push({
        type: 'PARAGRAPH',
        id: generateId(),
        nodes: processTextAndInlineElements(element)
      });
      break;
  }
  
  return blockNodes;
}

/**
 * Main function to convert nodes recursively
 * @param {Node} node - The DOM node to convert
 * @returns {Array} Array of Ricos nodes
 */
function convertNodeToRicos(node) {
  const nodes = [];

  if (!node || !node.childNodes) {
    return nodes;
  }

  // Track previous element type for spacing
  let previousWasText = false;
  let previousWasHeading = false;
  
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];

    if (child.nodeType === 3) { // Node.TEXT_NODE
      // For text content outside block elements
      const text = child.textContent;
      if (text && text.trim()) {
        nodes.push({
          type: 'TEXT',
          id: '',
          textData: {
            text: text
          }
        });
        previousWasText = true;
        previousWasHeading = false;
      }
    } else if (child.nodeType === 1) { // Node.ELEMENT_NODE
      const element = child;
      const tagName = element.tagName.toLowerCase();

      switch (tagName) {
        case 'p':
          nodes.push(...handleBlockElement(element));
          previousWasText = true;
          previousWasHeading = false;
          break;

        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          // Add spacing before headings (except the first one)
          if (nodes.length > 0 && !previousWasHeading) {
            nodes.push(createSpacingParagraph());
          }
          
          const headingLevel = parseInt(tagName.charAt(1));
          const headingStyle = processNodeStyle(element);
          const headingNode = {
            type: 'HEADING',
            id: generateId(),
            nodes: processTextAndInlineElements(element),
            headingData: {
              level: Math.min(headingLevel, 6), // Ensure level is 1-6
              textStyle: {
                textAlignment: headingStyle?.textAlignment || 'AUTO'
              }
            }
          };
          
          nodes.push(headingNode);
          
          // Add empty paragraph after headings for spacing
          nodes.push(createSpacingParagraph());
          previousWasText = false;
          previousWasHeading = true;
          break;

        case 'div':
          // Handle div contents as block elements
          const divContent = convertNodeToRicos(element);
          nodes.push(...divContent);
          break;

        case 'table':
          // Process table content
          const tableNode = handleTable(element);
          nodes.push(tableNode);
          // Add spacing after table
          nodes.push(createSpacingParagraph());
          break;
          
        case 'thead':
        case 'tbody':
        case 'tfoot':
          // Skip these container elements and process their children
          nodes.push(...convertNodeToRicos(element));
          break;
          
        case 'tr':
          // Process table row - we will handle these within handleTable
          // This is here for cases where a table row might be outside a table
          nodes.push(...convertNodeToRicos(element));
          break;
          
        case 'th':
        case 'td':
          // Process table cell - we will handle these within handleTable
          // This is here for cases where a table cell might be outside a row
          nodes.push(...processTextAndInlineElements(element));
          break;

        // Handle inline elements
        case 'strong':
        case 'em':
        case 'a':
        case 'b':
        case 'i':
        case 'u':
        case 'span':
          // These are now handled inside processTextAndInlineElements
          nodes.push(...processTextAndInlineElements(element));
          break;

        case 'img':
          const imgWidth = element.hasAttribute('width') ? parseInt(element.getAttribute('width') || '0') : 500;
          const imgHeight = element.hasAttribute('height') ? parseInt(element.getAttribute('height') || '0') : 300;
          
          nodes.push({
            type: 'IMAGE',
            id: generateId(),
            imageData: {
              containerData: {
                width: {
                  size: 'CONTENT'
                },
                alignment: 'CENTER',
                textWrap: true
              },
              image: {
                src: {
                  url: element.getAttribute('src') || ''
                },
                width: imgWidth,
                height: imgHeight
              }
            }
          });
          break;

        case 'ul':
          nodes.push({
            type: 'BULLETED_LIST',
            id: generateId(),
            nodes: convertNodeToRicos(element)
          });
          break;

        case 'ol':
          nodes.push({
            type: 'ORDERED_LIST',
            id: generateId(),
            nodes: convertNodeToRicos(element)
          });
          break;

        case 'li':
          nodes.push({
            type: 'LIST_ITEM',
            id: generateId(),
            nodes: processTextAndInlineElements(element)
          });
          break;
          
        case 'blockquote':
          nodes.push({
            type: 'BLOCKQUOTE',
            id: generateId(),
            nodes: processTextAndInlineElements(element)
          });
          break;
          
        case 'pre':
        case 'code':
          nodes.push({
            type: 'CODE_BLOCK',
            id: generateId(),
            nodes: [{
              type: 'TEXT',
              id: '',
              textData: {
                text: element.textContent || ''
              }
            }]
          });
          break;
          
        case 'hr':
          nodes.push({
            type: 'DIVIDER',
            id: generateId()
          });
          break;

        case 'br':
          // Add a proper paragraph break instead of just a text node with newline
          nodes.push({
            type: 'PARAGRAPH',
            id: generateId(),
            nodes: [{
              type: 'TEXT',
              id: '',
              textData: {
                text: ' '
              }
            }]
          });
          break;
          
        default:
          // For any unhandled elements, try to handle as block element or fall back to text
          nodes.push(...handleBlockElement(element));
          break;
      }
    }
  }

  // Add double spacing between major block elements
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 1) { // Node.ELEMENT_NODE
      const element = child;
      const tagName = element.tagName.toLowerCase();
      
      // Add double spacing between major sections
      if (tagName === 'div' && element.getAttribute('class') && 
          (element.getAttribute('class').includes('section') || 
           element.getAttribute('class').includes('container'))) {
        nodes.push(createSpacingParagraph());
        nodes.push(createSpacingParagraph());
      }
    }
  }

  return nodes;
}

/**
 * Main function to convert HTML to Ricos format
 * @param {string} html - The HTML string to convert
 * @returns {Object} A Ricos document object
 */
function htmlToRicos(html) {
  // Sanitize input HTML with more allowed tags and styles
  const cleanHtml = sanitizeHtml(html, {
    allowedTags: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'strong', 'em', 'b', 'i', 'u', 'a', 'img', 
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'tbody', 'thead',
      'div', 'span', 'br', 'hr', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'title', 'style', 'class'],
      'img': ['src', 'alt', 'width', 'height', 'style', 'class'],
      'td': ['colspan', 'rowspan', 'style', 'class'],
      'th': ['colspan', 'rowspan', 'style', 'class'],
      'div': ['class', 'id', 'style'],
      'span': ['class', 'id', 'style'],
      'p': ['class', 'style'],
      'h1': ['class', 'style'],
      'h2': ['class', 'style'],
      'h3': ['class', 'style'],
      'h4': ['class', 'style'],
      'h5': ['class', 'style'],
      'h6': ['class', 'style'],
      'ul': ['class', 'style'],
      'ol': ['class', 'style'],
      'li': ['class', 'style'],
      'blockquote': ['class', 'style'],
      'pre': ['class', 'style'],
      'code': ['class', 'style'],
      '*': ['style', 'class', 'id']
    }
  });

  // Create a temporary document to parse the HTML
  const dom = new JSDOM(cleanHtml);
  const doc = dom.window.document;
  
  // Process the document body with spacing
  const nodes = convertNodeToRicos(doc.body);
  
  // Improve spacing around headings and sections
  const enhancedNodes = [];
  let previousType = null;
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isSpacing = node.type === 'PARAGRAPH' && 
                     node.nodes && 
                     node.nodes.length === 1 && 
                     node.nodes[0].type === 'TEXT' && 
                     node.nodes[0].textData && 
                     node.nodes[0].textData.text === ' ';
    
    // Skip consecutive spacing paragraphs
    if (isSpacing && previousType === 'SPACING') {
      continue;
    }
    
    // Handle special cases for heading spacing
    if (node.type === 'HEADING') {
      // Always add spacing before headings, unless at the very beginning
      if (i > 0 && previousType !== 'SPACING') {
        enhancedNodes.push(createSpacingParagraph());
      }
      enhancedNodes.push(node);
      
      // Check if next node is not already a spacing
      const nextNode = i + 1 < nodes.length ? nodes[i + 1] : null;
      if (!nextNode || 
          !(nextNode.type === 'PARAGRAPH' && 
           nextNode.nodes && 
           nextNode.nodes.length === 1 && 
           nextNode.nodes[0].type === 'TEXT' && 
           nextNode.nodes[0].textData && 
           nextNode.nodes[0].textData.text === ' ')) {
        enhancedNodes.push(createSpacingParagraph());
      }
      
      previousType = 'HEADING';
    } else if (isSpacing) {
      enhancedNodes.push(node);
      previousType = 'SPACING';
    } else {
      enhancedNodes.push(node);
      previousType = node.type;
    }
  }
  
  // Clean up nodes - remove leading and trailing spacing paragraphs
  const cleanedNodes = [];
  
  // Remove leading spacing paragraphs
  let startIndex = 0;
  while (startIndex < enhancedNodes.length && 
         enhancedNodes[startIndex].type === 'PARAGRAPH' && 
         enhancedNodes[startIndex].nodes && 
         enhancedNodes[startIndex].nodes.length === 1 && 
         enhancedNodes[startIndex].nodes[0].type === 'TEXT' && 
         enhancedNodes[startIndex].nodes[0].textData && 
         enhancedNodes[startIndex].nodes[0].textData.text === ' ') {
    startIndex++;
  }
  
  // Remove trailing spacing paragraphs
  let endIndex = enhancedNodes.length - 1;
  while (endIndex >= 0 && 
         enhancedNodes[endIndex].type === 'PARAGRAPH' && 
         enhancedNodes[endIndex].nodes && 
         enhancedNodes[endIndex].nodes.length === 1 && 
         enhancedNodes[endIndex].nodes[0].type === 'TEXT' && 
         enhancedNodes[endIndex].nodes[0].textData && 
         enhancedNodes[endIndex].nodes[0].textData.text === ' ') {
    endIndex--;
  }
  
  // Copy the cleaned nodes
  for (let i = startIndex; i <= endIndex; i++) {
    cleanedNodes.push(enhancedNodes[i]);
  }
  
  // Create the Ricos document with the cleaned structure
  return {
    nodes: cleanedNodes
  };
}

module.exports = {
  htmlToRicos
}; 