/**
 * Category: Integrasi & Eksternal (15 tools)
 */

import { Tool } from '../../types/index.js';

export const integrationTools: Tool[] = [
  { name: 'mcp_tool', description: 'Panggil tool dari MCP server', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool mcp_tool belum diimplementasikan' },
  { name: 'mcp_list_resources', description: 'List resource MCP', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool mcp_list_resources belum diimplementasikan' },
  { name: 'mcp_read_resource', description: 'Baca resource MCP', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool mcp_read_resource belum diimplementasikan' },
  { name: 'ha_call_service', description: 'Kontrol Home Assistant', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool ha_call_service belum diimplementasikan' },
  { name: 'ha_get_state', description: 'Baca state entity', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool ha_get_state belum diimplementasikan' },
  { name: 'ha_list_entities', description: 'List entity', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool ha_list_entities belum diimplementasikan' },
  { name: 'ha_list_services', description: 'List service', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool ha_list_services belum diimplementasikan' },
  { name: 'feishu_doc_read', description: 'Baca dokumen Feishu', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool feishu_doc_read belum diimplementasikan' },
  { name: 'feishu_drive_add_comment', description: 'Tambah komentar Feishu', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool feishu_drive_add_comment belum diimplementasikan' },
  { name: 'notion_read', description: 'Baca halaman Notion', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool notion_read belum diimplementasikan' },
  { name: 'notion_write', description: 'Tulis ke Notion', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool notion_write belum diimplementasikan' },
  { name: 'github_issue', description: 'Manage GitHub issue', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool github_issue belum diimplementasikan' },
  { name: 'github_pr', description: 'Manage PR', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool github_pr belum diimplementasikan' },
  { name: 'jira_issue', description: 'Manage Jira issue', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool jira_issue belum diimplementasikan' },
  { name: 'database_query', description: 'Query database SQL', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool database_query belum diimplementasikan' }
];
