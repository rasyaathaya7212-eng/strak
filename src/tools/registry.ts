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
import { mcpTools } from './categories/15-mcp.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private mcpTools: Map<string, Tool> = new Map(); // Separate storage for MCP tools

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
      ...deviceTools,           // 17 tools
      ...mcpTools               // 3 management tools
    ];

    allTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });

    console.log(`[OK] Loaded ${this.tools.size} built-in tools`);
  }

  /**
   * Register MCP tool dynamically
   */
  registerMCPTool(tool: Tool): void {
    this.mcpTools.set(tool.name, tool);
    this.tools.set(tool.name, tool); // Also add to main registry
  }

  /**
   * Unregister MCP tool
   */
  unregisterMCPTool(toolName: string): void {
    this.mcpTools.delete(toolName);
    this.tools.delete(toolName);
  }

  /**
   * Clear all MCP tools
   */
  clearMCPTools(): void {
    for (const toolName of this.mcpTools.keys()) {
      this.tools.delete(toolName);
    }
    this.mcpTools.clear();
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools (including MCP)
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
   * Get MCP tools count
   */
  getMCPToolCount(): number {
    return this.mcpTools.size;
  }
  /**
   * Get tool definitions for LLM (Send category overview instead of all 203 tools)
   */
  getEssentialToolDefinitions(): any[] {
    const allTools = this.getAllTools();
    const mcpCount = this.mcpTools.size;
    const builtInCount = allTools.length - mcpCount;
    
    console.log(`[INFO] Sending 15 category overviews to AI (${builtInCount} tools available across categories + ${mcpCount} MCP)`);

    // Instead of sending 203 tools, send 15 category descriptions
    return [
      {
        type: 'function',
        function: {
          name: 'list_category_tools',
          description: 'List all available tools in a specific category. Use this to discover which tools exist before calling them.',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: [
                  '01-filesystem',
                  '02-terminal', 
                  '03-web-search',
                  '04-text',
                  '05-agent',
                  '06-memory',
                  '07-git',
                  '08-media',
                  '09-automation',
                  '10-communication',
                  '11-data',
                  '12-integration',
                  '13-skills',
                  '14-device',
                  '15-mcp'
                ],
                description: 'Category to list tools from. Categories: 01-filesystem (read/write files), 02-terminal (shell commands), 03-web-search (search & fetch web), 04-text (text processing), 05-agent (agent control), 06-memory (save/recall), 07-git (version control), 08-media (images/video), 09-automation (scheduling), 10-communication (email/messaging), 11-data (JSON/CSV/math), 12-integration (APIs), 13-skills (canvas/plugins), 14-device (system), 15-mcp (MCP servers)'
              }
            },
            required: ['category']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_tool_info',
          description: 'Get detailed information about a specific tool including its parameters and usage.',
          parameters: {
            type: 'object',
            properties: {
              tool_name: {
                type: 'string',
                description: 'Name of the tool to get info about (e.g., "web_search", "read_file", "terminal")'
              }
            },
            required: ['tool_name']
          }
        }
      },
      // Add commonly used tools directly for quick access
      ...this.getCommonTools()
    ];
  }
  
  /**
   * Get commonly used tools (to avoid extra lookups)
   */
  private getCommonTools(): any[] {
    const commonToolNames = [
      'read_file', 'write_file', 'read', 'write', 'ls',
      'terminal', 'bash',
      'web_search', 'web_fetch',
      'memory_save', 'memory_recall'
    ];
    
    return commonToolNames
      .map(name => this.tools.get(name))
      .filter(tool => tool !== undefined)
      .map(tool => ({
        type: 'function',
        function: {
          name: tool!.name,
          description: tool!.description,
          parameters: tool!.parameters
        }
      }));
  }
  
  /**
   * Get tools by category (for list_category_tools function)
   */
  getToolsByCategory(category: string): Tool[] {
    const allTools = this.getAllTools();
    
    // Map category to tool name prefixes or patterns
    const categoryMap: Record<string, string[]> = {
      '01-filesystem': ['read_', 'write_', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'file_', 'dir_'],
      '02-terminal': ['terminal', 'bash', 'exec', 'shell', 'cmd', 'powershell', 'ssh'],
      '03-web-search': ['web_', 'search', 'fetch', 'scrape', 'download', 'url_'],
      '04-text': ['text_', 'grep', 'sed', 'awk', 'regex', 'string_'],
      '05-agent': ['agent_', 'task_', 'delegate', 'spawn'],
      '06-memory': ['memory_', 'context_', 'checkpoint'],
      '07-git': ['git_'],
      '08-media': ['image_', 'video_', 'audio_', 'pdf_', 'screenshot'],
      '09-automation': ['schedule', 'cron', 'todo', 'webhook', 'batch'],
      '10-communication': ['email_', 'slack_', 'discord_', 'telegram_', 'sms_'],
      '11-data': ['json_', 'csv_', 'xml_', 'yaml_', 'calc_', 'date_', 'math_'],
      '12-integration': ['api_', 'http_', 'notion_', 'github_', 'jira_'],
      '13-skills': ['skill_', 'plugin_', 'canvas_'],
      '14-device': ['device_', 'screen_', 'archive_', 'zip_', 'tar_', 'checksum'],
      '15-mcp': ['mcp_']
    };
    
    const patterns = categoryMap[category] || [];
    
    return allTools.filter(tool => 
      patterns.some(pattern => tool.name.toLowerCase().includes(pattern.toLowerCase()))
    );
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
