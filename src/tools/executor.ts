/**
 * Tool Executor
 * Executes tools based on Agent Loop commands
 */

import chalk from 'chalk';
import { ToolRegistry } from './registry';
import { ToolExecutionResult } from '../types';

export class ToolExecutor {
  private registry: ToolRegistry;
  private ui: any; // Will be injected

  constructor() {
    this.registry = new ToolRegistry();
  }

  /**
   * Set UI instance for better display
   */
  setUI(ui: any): void {
    this.ui = ui;
  }

  /**
   * Execute a tool
   */
  async execute(toolName: string, args: Record<string, any>): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Handle meta tools (list_category_tools, get_tool_info)
      if (toolName === 'list_category_tools') {
        return this.handleListCategoryTools(args.category);
      }
      
      if (toolName === 'get_tool_info') {
        return this.handleGetToolInfo(args.tool_name);
      }
      
      // Display execution start with new UI
      if (this.ui) {
        this.ui.toolExecutionStart(toolName, args);
      } else {
        console.log(chalk.magenta(`[EXEC] EXECUTING TOOL: `) + chalk.yellow(toolName));
      }

      // Get tool from registry
      const tool = this.registry.getTool(toolName);
      
      if (!tool) {
        const errorMsg = `Tool '${toolName}' not found`;
        if (this.ui) {
          this.ui.toolExecutionEnd(toolName, false, errorMsg);
        }
        return `Error: ${errorMsg}`;
      }

      // Execute tool handler
      const result = await tool.handler(args);
      const duration = Date.now() - startTime;
      
      // Display execution end
      if (this.ui) {
        this.ui.toolExecutionEnd(toolName, true, result, duration);
      }
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMsg = `Error executing tool '${toolName}': ${error.message}`;
      
      if (this.ui) {
        this.ui.toolExecutionEnd(toolName, false, errorMsg, duration);
      }
      
      return errorMsg;
    }
  }
  
  /**
   * Handle list_category_tools meta tool
   */
  private handleListCategoryTools(category: string): string {
    const tools = this.registry.getToolsByCategory(category);
    
    if (tools.length === 0) {
      return `No tools found in category: ${category}`;
    }
    
    let result = `\n=== Tools in ${category} (${tools.length} tools) ===\n\n`;
    
    tools.forEach((tool, idx) => {
      result += `${idx + 1}. ${tool.name}\n`;
      result += `   ${tool.description}\n\n`;
    });
    
    return result;
  }
  
  /**
   * Handle get_tool_info meta tool
   */
  private handleGetToolInfo(toolName: string): string {
    const tool = this.registry.getTool(toolName);
    
    if (!tool) {
      return `Tool '${toolName}' not found. Use list_category_tools to browse available tools.`;
    }
    
    let result = `\n=== Tool: ${tool.name} ===\n\n`;
    result += `Description: ${tool.description}\n\n`;
    result += `Parameters:\n`;
    result += JSON.stringify(tool.parameters, null, 2);
    result += `\n`;
    
    return result;
  }

  /**
   * Get tool registry
   */
  getRegistry(): ToolRegistry {
    return this.registry;
  }

  /**
   * List available tools
   */
  listTools(): string[] {
    return this.registry.getAllTools().map(t => t.name);
  }
}
