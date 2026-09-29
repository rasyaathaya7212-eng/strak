/**
 * Category: Agen & Delegasi (12 tools)
 */

import { Tool } from '../../types/index.js';

export const agentTools: Tool[] = [
  { name: 'delegate_task', description: 'Spawn subagent dengan konteks terisolasi', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool delegate_task belum diimplementasikan' },
  { name: 'agent', description: 'Jalankan sub-agen', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool agent belum diimplementasikan' },
  { name: 'agents_list', description: 'List agen yang tersedia', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool agents_list belum diimplementasikan' },
  { name: 'agents_wait', description: 'Tunggu hasil sub-agen', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool agents_wait belum diimplementasikan' },
  { name: 'sessions_list', description: 'List sesi', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool sessions_list belum diimplementasikan' },
  { name: 'sessions_get', description: 'Dapatkan detail sesi', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool sessions_get belum diimplementasikan' },
  { name: 'session_status', description: 'Status sesi saat ini', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool session_status belum diimplementasikan' },
  { name: 'send_message', description: 'Kirim pesan antar-agen/user', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool send_message belum diimplementasikan' },
  { name: 'team_create', description: 'Buat tim agen', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool team_create belum diimplementasikan' },
  { name: 'team_delete', description: 'Hapus tim', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool team_delete belum diimplementasikan' },
  { name: 'task_create', description: 'Buat task', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool task_create belum diimplementasikan' },
  { name: 'task_list', description: 'List task', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool task_list belum diimplementasikan' }
];
