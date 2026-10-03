/**
 * Category: Web & Pencarian (22 tools)
 * Sumber: Claude Code, OpenClaw, Hermes, Kustom
 */

import { Tool } from '../../types/index.js';
import axios from 'axios';

export const webTools: Tool[] = [
  // Implemented: web_search (LangSearch API)
  {
    name: 'web_search',
    description: 'Cari di web menggunakan LangSearch API - fast, accurate, free',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query pencarian' },
        max_results: { type: 'number', description: 'Maksimal hasil (default: 5, max: 50)' },
        include_text: { type: 'boolean', description: 'Include full webpage text (default: false)' }
      },
      required: ['query']
    },
    handler: async (args: any) => {
      try {
        // Validate required parameter
        if (!args || !args.query || typeof args.query !== 'string' || args.query.trim() === '') {
          return 'Error: Parameter "query" is required and must be a non-empty string. Example: {"query": "Bitcoin price today"}';
        }

        const maxResults = Math.min(args.max_results || 5, 50);
        const includeText = args.include_text || false;

        // LangSearch API configuration
        const LANGSEARCH_API_KEY = 'sk-fcf23ae7dc0c4f1e93be500c1b8e1889';
        const LANGSEARCH_ENDPOINT = 'https://api.langsearch.com/v1/web-search';

        const requestBody: any = {
          query: args.query.trim(),
          count: maxResults
        };

        // Add text content if requested
        if (includeText) {
          requestBody.contents = {
            text: {
              max_characters: 3000
            }
          };
        }

        const response = await axios.post(LANGSEARCH_ENDPOINT, requestBody, {
          headers: {
            'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        // Check response code
        if (String(response.data.code) !== '200') {
          return `Error dari LangSearch API: ${response.data.message || 'Unknown error'}`;
        }

        const results = response.data.data?.webPages?.value || [];

        if (results.length === 0) {
          return `Tidak ada hasil untuk: ${args.query}`;
        }

        // Format results
        let output = `[SEARCH] Hasil pencarian "${args.query}" (${results.length} hasil):\n\n`;
        
        results.forEach((page: any, index: number) => {
          output += `${index + 1}. **${page.name || 'No title'}**\n`;
          
          if (includeText && page.text) {
            // Show full text (truncated)
            output += `   ${page.text.substring(0, 500)}${page.text.length > 500 ? '...' : ''}\n`;
          } else if (page.snippet) {
            // Show snippet
            output += `   ${page.snippet}\n`;
          }
          
          output += `   🔗 ${page.url}\n`;
          
          if (page.datePublished) {
            output += `   [DATE] ${page.datePublished}\n`;
          }
          
          output += `\n`;
        });

        return output;
      } catch (error: any) {
        // Fallback error message
        if (error.response) {
          return `Error LangSearch API (${error.response.status}): ${error.response.data?.message || error.message}`;
        }
        return `Error mencari: ${error.message}`;
      }
    }
  },

  // Implemented: web_fetch
  {
    name: 'web_fetch',
    description: 'Ambil konten halaman web',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL yang akan diambil' }
      },
      required: ['url']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.url || typeof args.url !== 'string' || args.url.trim() === '') {
        return 'Error: Parameter "url" is required and must be a non-empty string. Example: {"url": "https://example.com"}';
      }
      
      // Basic URL validation
      try {
        new URL(args.url);
      } catch (urlError) {
        return `Error: Invalid URL format. Must start with http:// or https://. Example: {"url": "https://example.com"}`;
      }
      
      try {
        const response = await axios.get(args.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Strak/1.0)'
          },
          maxRedirects: 5
        });

        const content = response.data;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const truncated = contentStr.substring(0, 5000);

        return `Konten dari ${args.url}:\n\n${truncated}${contentStr.length > 5000 ? '\n\n[Konten dipotong...]' : ''}`;
      } catch (error: any) {
        return `Error mengambil ${args.url}: ${error.message}`;
      }
    }
  },

  // Stub tools (20 remaining)
  { name: 'web_search_news', description: 'Cari berita terkini', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool web_search_news belum diimplementasikan' },
  { name: 'x_search', description: 'Cari postingan X/Twitter', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool x_search belum diimplementasikan' },
  { name: 'web_extract', description: 'Ekstrak teks bersih dari URL', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool web_extract belum diimplementasikan' },
  { name: 'browser_navigate', description: 'Buka URL di browser', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_navigate belum diimplementasikan' },
  { name: 'browser_snapshot', description: 'Snapshot accessibility tree', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_snapshot belum diimplementasikan' },
  { name: 'browser_click', description: 'Klik elemen', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_click belum diimplementasikan' },
  { name: 'browser_type', description: 'Ketik ke input', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_type belum diimplementasikan' },
  { name: 'browser_scroll', description: 'Scroll halaman', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_scroll belum diimplementasikan' },
  { name: 'browser_vision', description: 'Analisis halaman dengan model visi', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_vision belum diimplementasikan' },
  { name: 'browser_console', description: 'Baca log konsol', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_console belum diimplementasikan' },
  { name: 'browser_screenshot', description: 'Screenshot halaman', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_screenshot belum diimplementasikan' },
  { name: 'browser_back', description: 'Navigasi mundur', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_back belum diimplementasikan' },
  { name: 'browser_press', description: 'Tekan tombol keyboard', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_press belum diimplementasikan' },
  { name: 'browser_close', description: 'Tutup browser', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_close belum diimplementasikan' },
  { name: 'browser_get_images', description: 'Ekstrak gambar dari halaman', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool browser_get_images belum diimplementasikan' },
  { name: 'url_metadata', description: 'Ambil metadata URL', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool url_metadata belum diimplementasikan' },
  { name: 'url_status', description: 'Cek HTTP status', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool url_status belum diimplementasikan' },
  { name: 'url_download', description: 'Download file dari URL', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool url_download belum diimplementasikan' },
  { name: 'rss_read', description: 'Baca feed RSS/Atom', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool rss_read belum diimplementasikan' },
  { name: 'sitemap_parse', description: 'Parse sitemap.xml', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool sitemap_parse belum diimplementasikan' }
];
