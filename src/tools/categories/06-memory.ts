/**
 * Category: Memori & Konteks (10 tools)
 */

import { Tool } from '../../types/index.js';
import * as fs from 'fs-extra';

export const memoryTools: Tool[] = [
  // Implemented: memory_save
  {
    name: 'memory_save',
    description: 'Simpan informasi penting ke MEMORY.md',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Kunci memori' },
        value: { type: 'string', description: 'Nilai yang disimpan' }
      },
      required: ['key', 'value']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.key || typeof args.key !== 'string' || args.key.trim() === '') {
        return 'Error: Parameter "key" is required and must be a non-empty string. Example: {"key": "username", "value": "john"}';
      }
      if (!args.value || typeof args.value !== 'string' || args.value.trim() === '') {
        return 'Error: Parameter "value" is required and must be a non-empty string. Example: {"key": "username", "value": "john"}';
      }
      
      try {
        const memoryPath = 'MEMORY.md';
        const content = await fs.readFile(memoryPath, 'utf-8').catch(() => '# Memory\n\n');
        const newEntry = `\n## ${args.key}\n${args.value}\n`;
        await fs.writeFile(memoryPath, content + newEntry, 'utf-8');
        return `Memori disimpan: ${args.key}`;
      } catch (error: any) {
        return `Error menyimpan memori: ${error.message}`;
      }
    }
  },

  // Implemented: memory_recall
  {
    name: 'memory_recall',
    description: 'Baca memori dari MEMORY.md',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Kunci memori (optional)' }
      }
    },
    handler: async (args: any) => {
      try {
        const memoryPath = 'MEMORY.md';
        const content = await fs.readFile(memoryPath, 'utf-8');
        
        // If key is provided and valid, search for it
        if (args && args.key && typeof args.key === 'string' && args.key.trim() !== '') {
          const regex = new RegExp(`## ${args.key}\\n([\\s\\S]*?)(?=\\n## |$)`);
          const match = content.match(regex);
          return match ? match[1].trim() : `Tidak ada memori dengan key: ${args.key}`;
        }
        
        // Return all content if no key provided
        return content;
      } catch (error: any) {
        return `Error membaca memori: ${error.message}`;
      }
    }
  },

  // Stub tools
  { name: 'memory', description: 'Baca/tulis memori persisten', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool memory belum diimplementasikan' },
  { name: 'memory_search', description: 'Pencarian semantik di memori', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool memory_search belum diimplementasikan' },
  { name: 'memory_get', description: 'Ambil informasi spesifik dari memori', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool memory_get belum diimplementasikan' },
  { name: 'session_search', description: 'Pencarian teks di percakapan lampau', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool session_search belum diimplementasikan' },
  { name: 'context_files', description: 'Muat file konteks', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool context_files belum diimplementasikan' },
  { name: 'context_inject', description: 'Inject file/URL ke konteks', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool context_inject belum diimplementasikan' },
  { name: 'checkpoint_create', description: 'Snapshot direktori kerja', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool checkpoint_create belum diimplementasikan' },
  { name: 'checkpoint_rollback', description: 'Rollback ke checkpoint', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool checkpoint_rollback belum diimplementasikan' }
];
