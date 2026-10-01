/**
 * MCP Manager
 * Manages MCP server connections and communication
 */

import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { MCPServerConfig, MCPConnection, MCPRequest, MCPResponse, MCPTool } from '../types/mcp.js';

export class MCPManager {
  private connections: Map<string, MCPConnection> = new Map();
  private requestHandlers: Map<string, (response: MCPResponse) => void> = new Map();

  /**
   * Connect to MCP server
   */
  async connectServer(serverId: string, config: MCPServerConfig): Promise<void> {
    if (config.disabled) {
      console.log(`⚠️  MCP server "${serverId}" is disabled`);
      return;
    }

    try {
      console.log(`🔌 Connecting to MCP server: ${serverId}...`);

      // Spawn process
      const childProcess = spawn(config.command, config.args || [], {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Create connection object
      const connection: MCPConnection = {
        serverId,
        config,
        process: childProcess,
        stdin: childProcess.stdin,
        stdout: childProcess.stdout,
        connected: false,
        tools: [],
        resources: [],
        prompts: []
      };

      this.connections.set(serverId, connection);

      // Setup stdout reader
      const rl = readline.createInterface({
        input: childProcess.stdout,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        this.handleMessage(serverId, line);
      });

      // Setup error handler
      childProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`❌ MCP ${serverId} error:`, data.toString());
      });

      childProcess.on('exit', (code: number | null) => {
        console.log(`⚠️  MCP ${serverId} exited with code ${code}`);
        connection.connected = false;
      });

      // Initialize connection
      await this.initialize(serverId);

      console.log(`✅ Connected to MCP server: ${serverId}`);
    } catch (error: any) {
      console.error(`❌ Failed to connect to ${serverId}:`, error.message);
      throw error;
    }
  }

  /**
   * Initialize MCP connection (handshake)
   */
  private async initialize(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) throw new Error(`Connection ${serverId} not found`);

    // Send initialize request
    const response = await this.sendRequest(serverId, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: 'strak-cli',
        version: '1.0.0'
      }
    });

    connection.serverInfo = response.result;
    connection.connected = true;

    // Send initialized notification
    this.sendNotification(serverId, 'notifications/initialized');

    // List available tools
    await this.listTools(serverId);
  }

  /**
   * Send JSON-RPC request
   */
  private async sendRequest(serverId: string, method: string, params?: any): Promise<MCPResponse> {
    const connection = this.connections.get(serverId);
    if (!connection) throw new Error(`Connection ${serverId} not found`);

    const id = uuidv4();
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      // Store handler
      this.requestHandlers.set(id, resolve);

      // Send request
      connection.stdin?.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        this.requestHandlers.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);
    });
  }

  /**
   * Send JSON-RPC notification (no response expected)
   */
  private sendNotification(serverId: string, method: string, params?: any): void {
    const connection = this.connections.get(serverId);
    if (!connection) return;

    const notification = {
      jsonrpc: '2.0',
      method,
      params
    };

    connection.stdin?.write(JSON.stringify(notification) + '\n');
  }

  /**
   * Handle incoming message
   */
  private handleMessage(serverId: string, line: string): void {
    try {
      const message = JSON.parse(line);

      // Handle response
      if (message.id && this.requestHandlers.has(message.id)) {
        const handler = this.requestHandlers.get(message.id)!;
        this.requestHandlers.delete(message.id);
        handler(message);
      }

      // Handle notification
      if (!message.id && message.method) {
        // Handle server notifications if needed
        console.log(`📩 Notification from ${serverId}:`, message.method);
      }
    } catch (error) {
      // Ignore non-JSON lines (might be debug output)
    }
  }

  /**
   * List tools from server
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    const connection = this.connections.get(serverId);
    if (!connection) throw new Error(`Connection ${serverId} not found`);

    try {
      const response = await this.sendRequest(serverId, 'tools/list');
      connection.tools = response.result?.tools || [];
      return connection.tools;
    } catch (error) {
      console.error(`❌ Failed to list tools from ${serverId}:`, error);
      return [];
    }
  }

  /**
   * Call MCP tool
   */
  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection) throw new Error(`Connection ${serverId} not found`);

    try {
      const response = await this.sendRequest(serverId, 'tools/call', {
        name: toolName,
        arguments: args
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.result;
    } catch (error: any) {
      throw new Error(`MCP tool error (${serverId}/${toolName}): ${error.message}`);
    }
  }

  /**
   * Get all tools from all connected servers
   */
  getAllTools(): Array<{ serverId: string; tool: MCPTool }> {
    const allTools: Array<{ serverId: string; tool: MCPTool }> = [];

    for (const [serverId, connection] of this.connections) {
      if (connection.connected) {
        connection.tools.forEach(tool => {
          allTools.push({ serverId, tool });
        });
      }
    }

    return allTools;
  }

  /**
   * Get tool by name (searches all servers)
   */
  findTool(toolName: string): { serverId: string; tool: MCPTool } | null {
    for (const [serverId, connection] of this.connections) {
      if (connection.connected) {
        const tool = connection.tools.find(t => t.name === toolName);
        if (tool) {
          return { serverId, tool };
        }
      }
    }
    return null;
  }

  /**
   * Check if tool is auto-approved
   */
  isAutoApproved(serverId: string, toolName: string): boolean {
    const connection = this.connections.get(serverId);
    if (!connection) return false;

    const autoApprove = connection.config.autoApprove || [];
    return autoApprove.includes(toolName) || autoApprove.includes('*');
  }

  /**
   * Disconnect server
   */
  async disconnectServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) return;

    if (connection.process) {
      connection.process.kill();
    }

    this.connections.delete(serverId);
    console.log(`🔌 Disconnected from MCP server: ${serverId}`);
  }

  /**
   * Disconnect all servers
   */
  async disconnectAll(): Promise<void> {
    for (const serverId of this.connections.keys()) {
      await this.disconnectServer(serverId);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): Array<{ serverId: string; connected: boolean; toolCount: number }> {
    const status: Array<{ serverId: string; connected: boolean; toolCount: number }> = [];

    for (const [serverId, connection] of this.connections) {
      status.push({
        serverId,
        connected: connection.connected,
        toolCount: connection.tools.length
      });
    }

    return status;
  }
}
