/**
 * Category: Media & Gambar (12 tools)
 */

import { Tool } from '../../types/index.js';

export const mediaTools: Tool[] = [
  { name: 'image_generate', description: 'Generate gambar dari teks', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_generate belum diimplementasikan' },
  { name: 'image_analyze', description: 'Analisis gambar', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_analyze belum diimplementasikan' },
  { name: 'vision_analyze', description: 'Analisis gambar dengan pertanyaan', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool vision_analyze belum diimplementasikan' },
  { name: 'tts', description: 'Text-to-speech', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool tts belum diimplementasikan' },
  { name: 'stt', description: 'Speech-to-text', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool stt belum diimplementasikan' },
  { name: 'image_resize', description: 'Resize gambar', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_resize belum diimplementasikan' },
  { name: 'image_crop', description: 'Crop gambar', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_crop belum diimplementasikan' },
  { name: 'image_convert', description: 'Konversi format gambar', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_convert belum diimplementasikan' },
  { name: 'image_watermark', description: 'Tambah watermark', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_watermark belum diimplementasikan' },
  { name: 'image_metadata', description: 'Baca EXIF/metadata', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool image_metadata belum diimplementasikan' },
  { name: 'pdf_read', description: 'Baca teks dari PDF', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool pdf_read belum diimplementasikan' },
  { name: 'pdf_merge', description: 'Merge PDF', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool pdf_merge belum diimplementasikan' }
];
