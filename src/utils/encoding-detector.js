/**
 * Utilities for detecting and handling text encodings in CSV files
 */

/**
 * Common text encodings supported by the browser
 */
export const SUPPORTED_ENCODINGS = [
    { value: 'UTF-8', label: 'UTF-8 (Standard)' },
    { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin-1)' },
    { value: 'windows-1252', label: 'Windows-1252 (Western European)' },
    { value: 'ISO-8859-15', label: 'ISO-8859-15 (Latin-9)' },
    { value: 'macintosh', label: 'Mac Roman' },
    { value: 'windows-1251', label: 'Windows-1251 (Cyrillic)' },
    { value: 'ISO-8859-2', label: 'ISO-8859-2 (Central European)' },
    { value: 'ISO-8859-5', label: 'ISO-8859-5 (Cyrillic)' },
  ];
  
  /**
   * Check for the presence of a BOM (Byte Order Mark)
   * @param {ArrayBuffer} buffer - The file buffer
   * @returns {string|null} Detected encoding from BOM or null if no BOM
   */
  export function detectBOM(buffer) {
    const uint8Array = new Uint8Array(buffer.slice(0, 4));
    
    // UTF-8 BOM (EF BB BF)
    if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
      return 'UTF-8';
    }
    
    // UTF-16 LE BOM (FF FE)
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
      return 'UTF-16LE';
    }
    
    // UTF-16 BE BOM (FE FF)
    if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
      return 'UTF-16BE';
    }
    
    // UTF-32 LE BOM (FF FE 00 00)
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE && uint8Array[2] === 0x00 && uint8Array[3] === 0x00) {
      return 'UTF-32LE';
    }
    
    // UTF-32 BE BOM (00 00 FE FF)
    if (uint8Array[0] === 0x00 && uint8Array[1] === 0x00 && uint8Array[2] === 0xFE && uint8Array[3] === 0xFF) {
      return 'UTF-32BE';
    }
    
    // No BOM detected
    return null;
  }
  
  /**
   * Detect encoding based on content analysis
   * This is a basic implementation and may not be 100% accurate
   * @param {ArrayBuffer} buffer - The file buffer
   * @returns {string} Best-guess encoding
   */
  export function detectEncoding(buffer) {
    // First, check for BOM
    const bomEncoding = detectBOM(buffer);
    if (bomEncoding) {
      return bomEncoding;
    }
    
    // If no BOM, try to detect based on content patterns
    const uint8Array = new Uint8Array(buffer);
    
    // Check for UTF-8 patterns
    let isUtf8 = true;
    let hasHighAscii = false;
    
    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i];
      
      // Check for invalid UTF-8 sequences
      if (byte > 127) {
        hasHighAscii = true;
        
        // Check if this is a valid UTF-8 multi-byte sequence
        if (byte >= 0xC0 && byte <= 0xDF) {
          // 2-byte sequence
          if (i + 1 >= uint8Array.length || (uint8Array[i + 1] & 0xC0) !== 0x80) {
            isUtf8 = false;
            break;
          }
          i += 1;
        } else if (byte >= 0xE0 && byte <= 0xEF) {
          // 3-byte sequence
          if (i + 2 >= uint8Array.length || 
              (uint8Array[i + 1] & 0xC0) !== 0x80 || 
              (uint8Array[i + 2] & 0xC0) !== 0x80) {
            isUtf8 = false;
            break;
          }
          i += 2;
        } else if (byte >= 0xF0 && byte <= 0xF7) {
          // 4-byte sequence
          if (i + 3 >= uint8Array.length || 
              (uint8Array[i + 1] & 0xC0) !== 0x80 || 
              (uint8Array[i + 2] & 0xC0) !== 0x80 || 
              (uint8Array[i + 3] & 0xC0) !== 0x80) {
            isUtf8 = false;
            break;
          }
          i += 3;
        } else {
          // Invalid UTF-8 start byte
          isUtf8 = false;
          break;
        }
      }
    }
    
    if (isUtf8 && hasHighAscii) {
      return 'UTF-8';
    }
    
    // If it's not clearly UTF-8 with multi-byte chars, default to Windows-1252
    // which is a superset of ISO-8859-1 and common for Western languages
    return 'windows-1252';
  }
  
  /**
   * Read a file with a specific encoding
   * @param {File|Blob|ArrayBuffer} file - The file or buffer to read
   * @param {string} encoding - The encoding to use
   * @returns {Promise<string>} The file content as a string
   */
  export async function readWithEncoding(file, encoding = 'UTF-8') {
    // If it's already an ArrayBuffer, use it directly
    if (file instanceof ArrayBuffer) {
      return new TextDecoder(encoding).decode(file);
    }
    
    // If it's a File or Blob, read it as ArrayBuffer first
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const buffer = e.target.result;
        const text = new TextDecoder(encoding).decode(buffer);
        resolve(text);
      };
      
      reader.onerror = (e) => {
        reject(new Error(`Error reading file: ${e.target.error}`));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }