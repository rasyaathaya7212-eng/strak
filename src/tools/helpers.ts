/**
 * Helper functions for tool creation
 */

import { Tool } from '../types';
import { z } from 'zod';

/**
 * Create a stub tool (not implemented yet)
 */
export function createStubTool(name: string, description: string, category: string): Tool {
  return {
    name,
    description,
    category,
    parameters: z.object({}),
    handler: async () => {
      return `Tool [${name}] belum diimplementasikan`;
    }
  };
}

/**
 * Create multiple stub tools
 */
export function createStubTools(toolNames: string[], category: string): Tool[] {
  return toolNames.map(name => 
    createStubTool(name, `${name} tool`, category)
  );
}
