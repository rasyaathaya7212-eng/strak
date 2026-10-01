/**
 * Category: MCP (Model Context Protocol) Tools
 * Runtime tools untuk MCP server management dan execution
 */

import { Tool } from '../../types/index.js';

// MCP tools akan di-inject secara dynamic oleh MCP Manager
// This is a placeholder for the category

export const mcpTools: Tool[] = [
  {
    name: 'mcp_list_servers',
    description: 'List semua MCP servers yang terhubung',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return 'Tool mcp_list_servers akan dihandle oleh MCP Manager';
    }
  },
  {
    name: 'mcp_list_tools',
    description: 'List semua tools dari MCP servers',
    parameters: {
      type: 'object',
      properties: {
        server_id: { type: 'string', description: 'Server ID (optional)' }
      }
    },
    handler: async () => {
      return 'Tool mcp_list_tools akan dihandle oleh MCP Manager';
    }
  },
  {
    name: 'mcp_call_tool',
    description: 'Call tool dari MCP server',
    parameters: {
      type: 'object',
      properties: {
        server_id: { type: 'string', description: 'Server ID' },
        tool_name: { type: 'string', description: 'Tool name' },
        arguments: { type: 'object', description: 'Tool arguments' }
      },
      required: ['server_id', 'tool_name']
    },
    handler: async () => {
      return 'Tool mcp_call_tool akan dihandle oleh MCP Manager';
    }
  }
];
