/**
 * MCP Initializer
 * Initialize MCP servers and register their tools
 */

import { MCPManager } from './manager.js';
import { loadMCPConfig } from './config.js';
import { toolRegistry } from '../tools/registry.js';
import { Tool } from '../types/index.js';

export class MCPInitializer {
  private mcpManager: MCPManager;
  private initialized: boolean = false;

  constructor() {
    this.mcpManager = new MCPManager();
  }

  /**
   * Initialize all MCP servers from config
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const config = loadMCPConfig();
      const serverIds = Object.keys(config.mcpServers);

      if (serverIds.length === 0) {
        console.log('[INFO] No MCP servers configured');
        this.initialized = true;
        return;
      }

      console.log(`[MCP] Initializing ${serverIds.length} MCP server(s)...`);

      // Connect to all servers
      const connectionPromises = serverIds.map(async (serverId) => {
        const serverConfig = config.mcpServers[serverId];
        try {
          await this.mcpManager.connectServer(serverId, serverConfig);
          return true;
        } catch (error: any) {
          console.error(`[!] Failed to connect ${serverId}: ${error.message}`);
          return false;
        }
      });

      await Promise.all(connectionPromises);

      // Register all MCP tools
      this.registerMCPTools();

      // Show status
      const status = this.mcpManager.getStatus();
      const connectedCount = status.filter(s => s.connected).length;
      const totalTools = status.reduce((sum, s) => sum + s.toolCount, 0);

      console.log(`[OK] MCP: ${connectedCount}/${serverIds.length} servers connected, ${totalTools} tools available`);

      this.initialized = true;
    } catch (error: any) {
      console.error('❌ MCP initialization error:', error.message);
      this.initialized = true; // Continue anyway
    }
  }

  /**
   * Register MCP tools to tool registry
   */
  private registerMCPTools(): void {
    const mcpTools = this.mcpManager.getAllTools();

    mcpTools.forEach(({ serverId, tool: mcpTool }) => {
      // Convert MCP tool to STRAK tool format
      const strakTool: Tool = {
        name: mcpTool.name,
        description: `[MCP:${serverId}] ${mcpTool.description}`,
        parameters: mcpTool.inputSchema,
        handler: async (args: any) => {
          try {
            // Check auto-approval
            const autoApproved = this.mcpManager.isAutoApproved(serverId, mcpTool.name);
            if (!autoApproved) {
              console.log(`[!] Tool ${mcpTool.name} requires manual approval (not in autoApprove list)`);
            }

            // Call MCP tool
            const result = await this.mcpManager.callTool(serverId, mcpTool.name, args);

            // Format result
            if (result.content) {
              // MCP returns content array
              return result.content
                .map((c: any) => {
                  if (c.type === 'text') return c.text;
                  if (c.type === 'image') return `[Image: ${c.data}]`;
                  if (c.type === 'resource') return `[Resource: ${c.resource}]`;
                  return JSON.stringify(c);
                })
                .join('\n');
            }

            return JSON.stringify(result);
          } catch (error: any) {
            return `Error calling MCP tool ${mcpTool.name}: ${error.message}`;
          }
        },
        category: 'mcp'
      };

      toolRegistry.registerMCPTool(strakTool);
    });
  }

  /**
   * Get MCP manager instance
   */
  getManager(): MCPManager {
    return this.mcpManager;
  }

  /**
   * Cleanup: disconnect all servers
   */
  async cleanup(): Promise<void> {
    await this.mcpManager.disconnectAll();
    toolRegistry.clearMCPTools();
    this.initialized = false;
  }
}
