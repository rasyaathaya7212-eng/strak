/**
 * Category: Web & Pencarian (22 tools)
 * Sumber: Claude Code, OpenClaw, Hermes, Kustom
 */

import { Tool } from '../../types/index.js';
import axios from 'axios';

export const webTools: Tool[] = [
  // Implemented: web_search (DuckDuckGo)
  {
    name: 'web_search',
    description: 'Cari di web (multi-engine, fallback) menggunakan DuckDuckGo',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query pencarian' },
        max_results: { type: 'number', description: 'Maksimal hasil (default: 5)' }
      },
      required: ['query']
    },
    handler: async (args: any) => {
      try {
        const query = encodeURIComponent(args.query);
        const maxResults = args.max_results || 5;

        const response = await axios.get(`https://html.duckduckgo.com/html/?q=${query}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const html = response.data;
        const results = [];
        const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
        const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;

        let match;
        let count = 0;
        const urls = [];
        const titles = [];

        while ((match = resultRegex.exec(html)) !== null && count < maxResults) {
          const url = match[1];
          const title = match[2].replace(/<[^>]*>/g, '').trim();
          if (url && title && !url.includes('duckduckgo.com')) {
            urls.push(url);
            titles.push(title);
            count++;
          }
        }

        const snippets = [];
        count = 0;
        while ((match = snippetRegex.exec(html)) !== null && count < maxResults) {
          const snippet = match[1].replace(/<[^>]*>/g, '').trim();
          if (snippet) {
            snippets.push(snippet);
            count++;
          }
        }

        for (let i = 0; i < Math.min(urls.length, maxResults); i++) {
          results.push({
            title: titles[i] || 'No title',
            url: urls[i],
            snippet: snippets[i] || 'No snippet'
          });
        }

        if (results.length === 0) {
          return `Tidak ada hasil untuk: ${args.query}`;
        }

        return `Hasil pencarian "${args.query}":\n\n${results.map((r, i) => 
          `${i + 1}. ${r.title}\n   ${r.snippet}\n   URL: ${r.url}\n`
        ).join('\n')}`;
      } catch (error: any) {
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
