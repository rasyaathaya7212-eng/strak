/**
 * Category: File & Filesystem (25 tools)
 * Sumber: Hermes, Claude Code, OpenClaw, Kustom
 */

import { Tool } from '../../types/index.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import crypto from 'crypto';

export const filesystemTools: Tool[] = [
  // Hermes - Read file with line numbers
  {
    name: 'read_file',
    description: 'Baca file dengan nomor baris, dukungan paginasi, deteksi UTF-16',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path file yang akan dibaca' },
        start_line: { type: 'number', description: 'Baris awal (optional)' },
        end_line: { type: 'number', description: 'Baris akhir (optional)' }
      },
      required: ['path']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.path || typeof args.path !== 'string' || args.path.trim() === '') {
        return 'Error: Parameter "path" is required and must be a non-empty string. Example: {"path": "README.md"}';
      }
      
      try {
        const content = await fs.readFile(args.path, 'utf-8');
        const lines = content.split('\n');
        
        if (args.start_line || args.end_line) {
          const start = args.start_line || 1;
          const end = args.end_line || lines.length;
          const selected = lines.slice(start - 1, end);
          return selected.map((line, idx) => `${start + idx}: ${line}`).join('\n');
        }
        
        return lines.map((line, idx) => `${idx + 1}: ${line}`).join('\n');
      } catch (error: any) {
        return `Error membaca file: ${error.message}`;
      }
    }
  },

  // Hermes - Write file
  {
    name: 'write_file',
    description: 'Tulis/overwrite file, buat direktori induk otomatis',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path file tujuan' },
        content: { type: 'string', description: 'Konten yang akan ditulis' }
      },
      required: ['path', 'content']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.path || typeof args.path !== 'string' || args.path.trim() === '') {
        return 'Error: Parameter "path" is required and must be a non-empty string. Example: {"path": "file.txt", "content": "Hello"}';
      }
      if (!args.content || typeof args.content !== 'string') {
        return 'Error: Parameter "content" is required and must be a string. Example: {"path": "file.txt", "content": "Hello"}';
      }
      
      try {
        await fs.ensureDir(path.dirname(args.path));
        await fs.writeFile(args.path, args.content, 'utf-8');
        return `File berhasil ditulis: ${args.path}`;
      } catch (error: any) {
        return `Error menulis file: ${error.message}`;
      }
    }
  },

  // Claude Code - Read
  {
    name: 'read',
    description: 'Baca file (versi Claude Code)',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path file' }
      },
      required: ['path']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.path || typeof args.path !== 'string' || args.path.trim() === '') {
        return 'Error: Parameter "path" is required and must be a non-empty string. Example: {"path": "README.md"}';
      }
      
      try {
        return await fs.readFile(args.path, 'utf-8');
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    }
  },

  // Claude Code - Write
  {
    name: 'write',
    description: 'Buat/timpa file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['path', 'content']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.path || typeof args.path !== 'string' || args.path.trim() === '') {
        return 'Error: Parameter "path" is required and must be a non-empty string. Example: {"path": "file.txt", "content": "Hello"}';
      }
      if (!args.content || typeof args.content !== 'string') {
        return 'Error: Parameter "content" is required and must be a string. Example: {"path": "file.txt", "content": "Hello"}';
      }
      
      try {
        await fs.writeFile(args.path, args.content, 'utf-8');
        return `File created: ${args.path}`;
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    }
  },

  // Claude Code - List directory
  {
    name: 'ls',
    description: 'List direktori',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path direktori' }
      },
      required: ['path']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.path || typeof args.path !== 'string' || args.path.trim() === '') {
        return 'Error: Parameter "path" is required and must be a non-empty string. Example: {"path": "./src"}';
      }
      
      try {
        const files = await fs.readdir(args.path);
        return files.join('\n');
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    }
  },

  // Stub tools (20 remaining)
  { name: 'patch', description: 'Find-and-replace dengan fuzzy matching', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool patch belum diimplementasikan' },
  { name: 'search_files', description: 'Pencarian konten regex + file by glob', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool search_files belum diimplementasikan' },
  { name: 'edit', description: 'Exact string replacement', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool edit belum diimplementasikan' },
  { name: 'apply_patch', description: 'Multi-hunk patch', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool apply_patch belum diimplementasikan' },
  { name: 'glob', description: 'Cari file by pattern', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool glob belum diimplementasikan' },
  { name: 'move_file', description: 'Pindahkan/rename file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool move_file belum diimplementasikan' },
  { name: 'copy_file', description: 'Copy file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool copy_file belum diimplementasikan' },
  { name: 'delete_file', description: 'Hapus file dengan konfirmasi', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool delete_file belum diimplementasikan' },
  { name: 'file_info', description: 'Metadata file (size, mtime, permissions)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool file_info belum diimplementasikan' },
  { name: 'mkdir', description: 'Buat direktori', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool mkdir belum diimplementasikan' },
  { name: 'rmdir', description: 'Hapus direktori kosong', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool rmdir belum diimplementasikan' },
  { name: 'symlink', description: 'Buat symbolic link', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool symlink belum diimplementasikan' },
  { name: 'chmod', description: 'Ubah permission file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool chmod belum diimplementasikan' },
  { name: 'file_hash', description: 'Hitung SHA-256/MD5', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool file_hash belum diimplementasikan' },
  { name: 'diff_files', description: 'Bandingkan dua file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool diff_files belum diimplementasikan' },
  { name: 'merge_files', description: 'Merge dua file dengan strategi', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool merge_files belum diimplementasikan' },
  { name: 'split_file', description: 'Split file by baris/ukuran', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool split_file belum diimplementasikan' },
  { name: 'concat_files', description: 'Gabung file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool concat_files belum diimplementasikan' },
  { name: 'tail_file', description: 'Baca N baris terakhir', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool tail_file belum diimplementasikan' },
  { name: 'head_file', description: 'Baca N baris pertama', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool head_file belum diimplementasikan' }
];
