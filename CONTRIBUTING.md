# Contributing to Strak

Terima kasih atas minat Anda untuk berkontribusi pada Strak! 🎉

## 🚀 Cara Memulai

1. Fork repository ini
2. Clone fork Anda:
   ```bash
   git clone https://github.com/username/strak.git
   cd strak
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Buat branch untuk fitur Anda:
   ```bash
   git checkout -b feature/nama-fitur-anda
   ```

## 📝 Panduan Implementasi Tool

### Menambah Tool Baru

Untuk mengimplementasikan tool yang masih dalam bentuk stub:

1. **Identifikasi Tool**
   - Buka file kategori yang sesuai di `src/tools/categories/`
   - Cari tool yang ingin Anda implementasikan

2. **Implementasi Tool**
   ```typescript
   import { Tool } from '../../types';
   import { z } from 'zod';

   const myNewTool: Tool = {
     name: 'tool_name',
     description: 'Deskripsi lengkap tool',
     category: 'category-name',
     parameters: z.object({
       param1: z.string().describe('Deskripsi parameter'),
       param2: z.number().optional().describe('Parameter opsional')
     }),
     handler: async (args) => {
       try {
         // Implementasi logika tool di sini
         const result = doSomething(args.param1);
         return `Success: ${result}`;
       } catch (error: any) {
         return `Error: ${error.message}`;
       }
     }
   };
   ```

3. **Tambahkan ke Export**
   ```typescript
   export const tools: Tool[] = [
     myNewTool,
     ...existingTools
   ];
   ```

### Best Practices

1. **Error Handling**: Selalu tangkap error dan return pesan yang jelas
2. **Parameter Validation**: Gunakan Zod untuk validasi parameter
3. **Descriptive Messages**: Berikan deskripsi yang jelas untuk tool dan parameter
4. **Return Format**: Return string yang informatif

### Contoh Implementasi Lengkap

```typescript
// src/tools/categories/01-web-search.ts

import { Tool } from '../../types';
import { z } from 'zod';
import axios from 'axios';

const webSearchGoogleTool: Tool = {
  name: 'web_search_google',
  description: 'Search Google for information',
  category: 'web-search',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().describe('Number of results (default: 10)')
  }),
  handler: async (args) => {
    try {
      // Implementasi search
      const results = await searchGoogle(args.query, args.limit || 10);
      return `Found ${results.length} results:\n${JSON.stringify(results, null, 2)}`;
    } catch (error: any) {
      return `Error searching Google: ${error.message}`;
    }
  }
};
```

## 🧪 Testing

Sebelum submit PR, test tool Anda:

1. Build project:
   ```bash
   npm run build
   ```

2. Test secara manual:
   ```bash
   npm link
   strak
   ```

3. Coba gunakan tool Anda di CLI

## 📋 Checklist Pull Request

- [ ] Kode sudah di-test secara manual
- [ ] Mengikuti style guide (TypeScript + Zod)
- [ ] Error handling sudah proper
- [ ] Dokumentasi/komentar sudah ditambahkan jika perlu
- [ ] Tidak ada hardcoded API keys atau secrets
- [ ] Build berhasil tanpa error

## 🎯 Area yang Membutuhkan Kontribusi

### High Priority
- Implementasi tool web search (Google, Bing, DuckDuckGo)
- Database tools (PostgreSQL, MySQL, MongoDB, Redis)
- Git operations (commit, push, pull, merge)
- Package managers (npm, pip, cargo)

### Medium Priority
- Image processing tools
- Audio/Video processing
- Data analysis tools
- Cloud provider integrations

### Low Priority
- Social media integrations
- Entertainment tools
- Design tools

## 💡 Tips

1. **Mulai dari yang Sederhana**: Implementasikan tool yang Anda pahami terlebih dahulu
2. **Gunakan Library**: Manfaatkan npm packages yang sudah ada
3. **Async/Await**: Semua handler harus async
4. **Type Safety**: Manfaatkan TypeScript untuk type safety

## 🔍 Review Process

1. Submit PR dengan deskripsi yang jelas
2. Maintainer akan review dalam 1-3 hari
3. Implementasikan feedback jika ada
4. Setelah approved, PR akan di-merge

## 📞 Butuh Bantuan?

- Buka issue untuk diskusi
- Tag dengan label `question` atau `help wanted`

Terima kasih telah berkontribusi! 🙏
