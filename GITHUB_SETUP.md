# 🚀 Setup STRAK CLI dari GitHub

Panduan lengkap untuk menginstall dan menggunakan STRAK CLI dari repository GitHub.

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/USERNAME/strak-cli.git
cd strak-cli
```

> **Note:** Ganti `USERNAME` dengan username GitHub Anda

### 2. Install Dependencies

```bash
npm install
```

Ini akan menginstall semua package yang dibutuhkan:
- `axios` - HTTP client
- `chalk` - Terminal colors
- `inquirer` - Interactive CLI
- `fs-extra` - File system utilities
- `zod` - Schema validation
- `uuid` - ID generation

### 3. Build Project

```bash
npm run build
```

Perintah ini akan:
- Compile TypeScript ke JavaScript
- Generate file di folder `dist/`
- Siap untuk digunakan

### 4. Link CLI Secara Global

```bash
npm link
```

Setelah perintah ini, Anda bisa menjalankan `strak` dari **folder manapun** di sistem Anda!

---

## ⚙️ Konfigurasi

### Cara 1: Setup di Project Root (Recommended)

1. Edit file `config.json` di folder project:

```json
{
  "apiKey": "YOUR_API_KEY",
  "baseUrl": "https://dattio.my.id/v1",
  "model": "deepseek-v4-pro"
}
```

2. Setiap kali Anda menjalankan `strak` di folder baru, config akan **otomatis disalin** ke folder tersebut!

### Cara 2: Setup Manual per Folder

Buat file `config.json` di folder kerja Anda:

```json
{
  "apiKey": "sk-xxxxxxxx",
  "baseUrl": "https://your-api-endpoint.com/v1",
  "model": "your-model-name"
}
```

---

## 🎯 Cara Menggunakan

### Jalankan STRAK

```bash
strak
```

### Fitur-Fitur

#### 1. **Normal Chat**
```
┃ ▶ Jelaskan apa itu AI agent
```

#### 2. **Tool Suggestion dengan `/`**
Ketik `/` untuk melihat daftar tools dan pilih salah satu:

```
┃ ▶ /web
```

- Akan muncul list tool yang mengandung "web"
- Pilih dengan arrow keys ↑↓
- Enter untuk konfirmasi
- AI akan menggunakan tool tersebut sebagai **saran** (bukan paksa)

#### 3. **Automated Tasks**
```
┃ ▶ Cari harga emas hari ini dan simpan ke file
```

STRAK akan:
1. Gunakan tool `web_search` untuk cari info
2. Gunakan tool `write_file` untuk simpan hasil

#### 4. **Exit**
```
┃ ▶ exit
```

---

## 🛠️ Tools Available (200 Tools)

STRAK dilengkapi dengan 200+ tools dalam 14 kategori:

| Kategori | Jumlah Tools | Contoh |
|----------|-------------|---------|
| **Filesystem** | 25 | `read_file`, `write_file`, `ls` |
| **Terminal** | 18 | `terminal`, `bash`, `exec` |
| **Web & Search** | 22 | `web_search`, `web_fetch` |
| **Text Processing** | 15 | `grep`, `sed`, `awk` |
| **Agent & Delegation** | 12 | `delegate_task`, `agent` |
| **Memory & Context** | 10 | `memory_save`, `memory_recall` |
| **Git** | 12 | `git_status`, `git_commit` |
| **Media** | 12 | `image_generate`, `pdf_read` |
| **Automation** | 10 | `cronjob`, `webhook_send` |
| **Communication** | 10 | `email_send`, `slack_send` |
| **Data** | 12 | `json_parse`, `csv_read` |
| **Integration** | 15 | `github_issue`, `notion_read` |
| **Skills** | 10 | `plugin_list`, `canvas_present` |
| **Device** | 17 | `zip_create`, `disk_usage` |

### Implemented Tools (Fully Working)

- ✅ `read_file` - Baca file dengan nomor baris
- ✅ `write_file` - Tulis/overwrite file
- ✅ `read` - Baca file (Claude Code style)
- ✅ `write` - Buat/timpa file
- ✅ `ls` - List directory
- ✅ `terminal` - Jalankan command shell
- ✅ `bash` - Execute bash command
- ✅ `web_search` - Search web (DuckDuckGo)
- ✅ `web_fetch` - Fetch content from URL
- ✅ `memory_save` - Simpan ke memory
- ✅ `memory_recall` - Baca dari memory

**Note:** Tools lain masih stub, akan diimplementasikan secara bertahap.

---

## 🔧 Development

### Structure Project

```
strak-cli/
├── src/
│   ├── cli/           # CLI interface & UI
│   ├── core/          # Agent loop, LLM router
│   ├── gateway/       # Request router
│   ├── providers/     # LLM provider (custom)
│   ├── tools/         # 200 tools in 14 categories
│   ├── types/         # TypeScript types
│   └── utils/         # Config utilities
├── dist/              # Compiled JavaScript
├── config.json        # Configuration file
├── package.json       # NPM dependencies
└── tsconfig.json      # TypeScript config
```

### Commands

```bash
# Development mode
npm run dev

# Build
npm run build

# Clean build
npm run clean
npm run rebuild

# Link globally
npm link

# Unlink
npm unlink -g strak
```

---

## 📝 Contoh Penggunaan

### Example 1: Research & Save
```
┃ ▶ Cari berita terbaru tentang AI, rangkum 5 poin penting, dan simpan ke ai-news.txt
```

### Example 2: File Operations
```
┃ ▶ Baca file data.json, ekstrak field "users", dan buat file baru users.json
```

### Example 3: Web Scraping
```
┃ ▶ /web_search
> Cari harga Bitcoin saat ini
```

### Example 4: Memory
```
┃ ▶ Simpan informasi: project deadline adalah 31 Desember 2026
```

---

## 🐛 Troubleshooting

### Error: "Config belum lengkap"

**Solusi:**
1. Pastikan `config.json` ada di folder project atau folder kerja
2. Isi semua field: `apiKey`, `baseUrl`, `model`

### Error: "Command not found: strak"

**Solusi:**
```bash
cd strak-cli
npm link
```

### Error: "LLM API Error"

**Solusi:**
1. Cek API key valid
2. Cek baseUrl benar (harus ada `/v1` di akhir)
3. Cek koneksi internet

### Tool tidak berfungsi

**Solusi:**
- Banyak tools masih stub (placeholder)
- Cek file `src/tools/categories/*.ts` untuk status implementasi
- Tools implemented: file operations, terminal, web search, memory

---

## 🤝 Contributing

Ingin menambahkan tool baru atau fix bug?

1. Fork repository
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m "Add: fitur baru"`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## 📄 License

MIT License - lihat file `LICENSE` untuk detail.

---

## 🙏 Credits

**STRAK CLI** menggabungkan arsitektur dari:
- **Claude Code** - Tool structure
- **OpenClaw** - Agent orchestration
- **Hermes** - Advanced capabilities

Built with ❤️ using TypeScript, Node.js, and AI.

---

## 📞 Support

Ada pertanyaan atau masalah? 
- Create an issue di GitHub
- Email: your-email@example.com (ganti dengan email Anda)

---

**Happy Coding with STRAK! 🚀**
