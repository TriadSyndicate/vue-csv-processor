/**
 * CSV parsing utility with support for various encodings and edge cases
 */

/**
 * Parse CSV content into an array of objects
 * @param {string|ArrayBuffer} content - The CSV content to parse
 * @param {Object} options - Parsing options
 * @param {boolean} options.hasHeaders - Whether the first row contains headers (default: true)
 * @param {string} options.delimiter - Field delimiter (default: auto-detect)
 * @param {boolean} options.trimFields - Whether to trim whitespace from fields (default: true)
 * @param {string} options.encoding - Text encoding to use (default: 'UTF-8')
 * @param {boolean} options.skipEmptyLines - Whether to skip empty lines (default: true)
 * @returns {Object} Object containing { data, headers, errors }
 */
export function parseCSV(content, options = {}) {
    const {
      hasHeaders = true,
      delimiter = '',
      trimFields = true,
      encoding = 'UTF-8',
      skipEmptyLines = true,
    } = options;
  
    // Convert ArrayBuffer to string if needed
    let csvText;
    if (content instanceof ArrayBuffer) {
      csvText = new TextDecoder(encoding).decode(content);
    } else {
      csvText = content;
    }
  
    // Handle BOM (Byte Order Mark)
    // UTF-8 BOM appears as the character sequence EF BB BF
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.slice(1);
    }
  
    // Split by lines but handle quoted fields
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText.charAt(i);
      const nextChar = i < csvText.length - 1 ? csvText.charAt(i + 1) : '';
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes (double quotes)
          currentField += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if ((char === delimiter || (delimiter === '' && char === ',')) && !inQuotes) {
        // End of field - use specified delimiter or default comma
        if (trimFields) {
          currentLine.push(currentField.trim());
        } else {
          currentLine.push(currentField);
        }
        currentField = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        // End of line
        if (char === '\r') i++; // Skip \n in \r\n
        
        // Add the last field of the line
        if (trimFields) {
          currentLine.push(currentField.trim());
        } else {
          currentLine.push(currentField);
        }
        
        // Add line if it's not empty or if we're not skipping empty lines
        if (!skipEmptyLines || currentLine.some(field => field.length > 0)) {
          lines.push(currentLine);
        }
        
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Handle the last line if needed
    if (currentField.length > 0 || currentLine.length > 0) {
      if (trimFields) {
        currentLine.push(currentField.trim());
      } else {
        currentLine.push(currentField);
      }
      
      if (!skipEmptyLines || currentLine.some(field => field.length > 0)) {
        lines.push(currentLine);
      }
    }
    
    // Handle empty input
    if (lines.length === 0) {
      return { data: [], headers: [], errors: ['Empty CSV content'] };
    }
    
    let headers = [];
    let data = [];
    let errors = [];
    
    // Extract headers if present
    if (hasHeaders && lines.length > 0) {
      headers = lines[0];
      lines.shift();
    } else if (!hasHeaders && lines.length > 0) {
      // Generate numeric headers if not present
      headers = lines[0].map((_, index) => `Column ${index + 1}`);
    }
    
    // Convert each line to an object
    data = lines.map((line, lineIndex) => {
      const row = {};
      
      // Check if line has the same number of fields as headers
      if (line.length !== headers.length) {
        errors.push(`Line ${lineIndex + 1} has ${line.length} fields, expected ${headers.length}`);
        
        // Adjust line length to match headers
        if (line.length < headers.length) {
          line = [...line, ...Array(headers.length - line.length).fill('')];
        } else {
          line = line.slice(0, headers.length);
        }
      }
      
      // Map fields to headers
      headers.forEach((header, index) => {
        if (index < line.length) {
          row[header] = line[index];
        } else {
          row[header] = '';
        }
      });
      
      return row;
    });
    
    return { data, headers, errors };
  }
  
  /**
   * Auto-detect the delimiter used in a CSV string
   * @param {string} csvContent - First few lines of CSV content
   * @returns {string} Detected delimiter (comma, semicolon, tab)
   */
  export function detectDelimiter(csvContent) {
    // Take the first few lines for analysis
    const sampleLines = csvContent.split(/\r?\n/).slice(0, 5).join('\n');
    
    // Count potential delimiters
    const counts = {
      ',': (sampleLines.match(/,/g) || []).length,
      ';': (sampleLines.match(/;/g) || []).length,
      '\t': (sampleLines.match(/\t/g) || []).length,
      '|': (sampleLines.match(/\|/g) || []).length,
    };
    
    // Find the most common delimiter
    let maxCount = 0;
    let detectedDelimiter = ','; // Default to comma
    
    Object.entries(counts).forEach(([delimiter, count]) => {
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    });
    
    return detectedDelimiter;
  }
  
  /**
   * Convert parsed CSV data to different formats
   * @param {Array} data - Array of objects from parseCSV
   * @param {string} format - Output format ('json', 'array', etc.)
   * @returns {any} Formatted data
   */
  export function formatCSVData(data, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data);
      case 'array':
        return data;
      default:
        return data;
    }
  }