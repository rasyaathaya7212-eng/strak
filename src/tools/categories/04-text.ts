/**
 * Category: Teks & Konten (15 tools)
 */

import { Tool } from '../../types/index.js';

export const textTools: Tool[] = [
  { name: 'grep', description: 'Cari pola di file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool grep belum diimplementasikan' },
  { name: 'sed', description: 'Stream editor', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool sed belum diimplementasikan' },
  { name: 'awk', description: 'Pemrosesan teks kolumnar', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool awk belum diimplementasikan' },
  { name: 'sort_lines', description: 'Sort baris file', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool sort_lines belum diimplementasikan' },
  { name: 'unique_lines', description: 'Hapus duplikat baris', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool unique_lines belum diimplementasikan' },
  { name: 'count_lines', description: 'Hitung baris/kata/karakter', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool count_lines belum diimplementasikan' },
  { name: 'replace_text', description: 'Replace sederhana', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool replace_text belum diimplementasikan' },
  { name: 'insert_text', description: 'Insert di baris tertentu', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool insert_text belum diimplementasikan' },
  { name: 'delete_lines', description: 'Hapus range baris', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool delete_lines belum diimplementasikan' },
  { name: 'extract_lines', description: 'Ekstrak range baris', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool extract_lines belum diimplementasikan' },
  { name: 'join_lines', description: 'Join baris dengan separator', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool join_lines belum diimplementasikan' },
  { name: 'wrap_text', description: 'Word wrap', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool wrap_text belum diimplementasikan' },
  { name: 'markdown_toc', description: 'Generate TOC dari Markdown', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool markdown_toc belum diimplementasikan' },
  { name: 'yaml_validate', description: 'Validasi YAML', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool yaml_validate belum diimplementasikan' },
  { name: 'json_validate', description: 'Validasi JSON', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool json_validate belum diimplementasikan' }
];
