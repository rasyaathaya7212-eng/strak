/**
 * Tool Loader
 * Dynamically loads all tools from category files
 */

import { Tool } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load all tools from categories directory
 */
export function loadTools(): Tool[] {
  const tools: Tool[] = [];
  const categoriesDir = path.join(__dirname, 'categories');

  try {
    // Check if categories directory exists
    if (!fs.existsSync(categoriesDir)) {
      console.warn('Categories directory not found');
      return tools;
    }

    // Read all files in categories directory
    const files = fs.readdirSync(categoriesDir);

    for (const file of files) {
      // Skip .d.ts files, only load .js files
      if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
        try {
          const modulePath = path.join(categoriesDir, file);
          const module = require(modulePath);

          // Each module should export a 'tools' array
          if (module.tools && Array.isArray(module.tools)) {
            tools.push(...module.tools);
          }
        } catch (error) {
          console.error(`Error loading tool category file ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error loading tools:', error);
  }

  return tools;
}
