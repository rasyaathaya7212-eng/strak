/**
 * MCP (Model Context Protocol) Types
 * Compatible with Claude Code MCP servers
 */

// MCP Server Configuration
export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  autoApprove?: string[];
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

// MCP Messages (JSON-RPC 2.0)
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

// MCP Tools
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// MCP Server Info
export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion?: string;
  capabilities?: {
    tools?: Record<string, any>;
    resources?: Record<string, any>;
    prompts?: Record<string, any>;
  };
}

// MCP Connection State
export interface MCPConnection {
  serverId: string;
  config: MCPServerConfig;
  process?: any;
  stdin?: any;
  stdout?: any;
  connected: boolean;
  serverInfo?: MCPServerInfo;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}
