/**
 * Tool Registry
 * Central registry for all tools (200 tools across 14 categories)
 */

import { Tool } from '../types/index.js';
import { filesystemTools } from './categories/01-filesystem.js';
import { terminalTools } from './categories/02-terminal.js';
import { webTools } from './categories/03-web-search.js';
import { textTools } from './categories/04-text.js';
import { agentTools } from './categories/05-agent.js';
import { memoryTools } from './categories/06-memory.js';
import { gitTools } from './categories/07-git.js';
import { mediaTools } from './categories/08-media.js';
import { automationTools } from './categories/09-automation.js';
import { communicationTools } from './categories/10-communication.js';
import { dataTools } from './categories/11-data.js';
import { integrationTools } from './categories/12-integration.js';
import { skillsTools } from './categories/13-skills.js';
import { deviceTools } from './categories/14-device.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerTools();
  }

  /**
   * Register all tools from categories
   */
  private registerTools(): void {
    const allTools = [
      ...filesystemTools,      // 25 tools
      ...terminalTools,         // 18 tools
      ...webTools,              // 22 tools
      ...textTools,             // 15 tools
      ...agentTools,            // 12 tools
      ...memoryTools,           // 10 tools
      ...gitTools,              // 12 tools
      ...mediaTools,            // 12 tools
      ...automationTools,       // 10 tools
      ...communicationTools,    // 10 tools
      ...dataTools,             // 12 tools
      ...integrationTools,      // 15 tools
      ...skillsTools,           // 10 tools
      ...deviceTools            // 17 tools (includes 9 extras)
    ];

    allTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });

    console.log(`✓ Loaded ${this.tools.size} tools`);
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool names list
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
  /**
   * Get tool definitions for LLM (only essential/implemented tools)
   */
  getEssentialToolDefinitions(): any[] {
    // Return only essential implemented tools
    const essentialTools = this.getAllTools().filter(tool => 
      ['read_file', 'write_file', 'read', 'write', 'ls', 'terminal', 'bash', 
       'web_search', 'web_fetch', 'memory_save', 'memory_recall'].includes(tool.name)
    );

    return essentialTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
