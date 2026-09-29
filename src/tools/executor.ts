/**
 * Tool Executor
 * Executes tools based on Agent Loop commands
 */

import chalk from 'chalk';
import { ToolRegistry } from './registry';
import { ToolExecutionResult } from '../types';

export class ToolExecutor {
  private registry: ToolRegistry;

  constructor() {
    this.registry = new ToolRegistry();
  }

  /**
   * Execute a tool
   */
  async execute(toolName: string, args: Record<string, any>): Promise<string> {
    try {
      // Display execution status with cyberpunk style
      console.log(chalk.magenta(`⚡ EXECUTING TOOL: `) + chalk.yellow(toolName));

      // Get tool from registry
      const tool = this.registry.getTool(toolName);
      
      if (!tool) {
        return `Error: Tool '${toolName}' not found`;
      }

      // Execute tool handler
      const result = await tool.handler(args);
      return result;
    } catch (error: any) {
      return `Error executing tool '${toolName}': ${error.message}`;
    }
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
