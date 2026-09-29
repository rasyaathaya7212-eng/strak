# 📦 Panduan Instalasi Strak

## Prasyarat

Pastikan Anda sudah menginstall:
- **Node.js** versi 18 atau lebih baru
- **npm** (biasanya sudah terinstall dengan Node.js)
- **Git** (untuk clone repository)

### Cek Versi Node.js

```bash
node --version
# Harus menampilkan v18.x.x atau lebih tinggi
```

## Metode Instalasi

### Metode 1: Dari Source (Recommended untuk Development)

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/strak.git
cd strak
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Setup Konfigurasi

Buat atau edit file `config.json` di root project:

```json
{
  "apiKey": "your-api-key-here",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

**⚠️ PENTING**: File `config.json` berisi API key Anda. Jangan commit file ini ke Git!

#### 4. Build Project

```bash
npm run build
```

#### 5. Link Secara Global

```bash
npm link
```

Sekarang Anda bisa menjalankan `strak` dari mana saja di terminal!

#### 6. Test Instalasi

```bash
strak
```

Jika muncul logo dan prompt hijau, instalasi berhasil! 🎉

---

### Metode 2: Instalasi Global (Coming Soon)

Setelah package dipublish ke npm:

```bash
npm install -g strak
```

---

## Konfigurasi untuk Provider Berbeda

### OpenAI (GPT-4, GPT-3.5)

```json
{
  "apiKey": "sk-proj-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

Dapatkan API key dari: https://platform.openai.com/api-keys

---

### Anthropic Claude

```json
{
  "apiKey": "sk-ant-...",
  "baseUrl": "https://api.anthropic.com/v1",
  "model": "claude-3-opus-20240229"
}
```

Dapatkan API key dari: https://console.anthropic.com/

---

### Ollama (Local/Self-Hosted)

#### Install Ollama terlebih dahulu:

**MacOS/Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

**Windows:**
Download dari: https://ollama.ai/download

#### Pull model:
```bash
ollama pull llama2
# atau
ollama pull mistral
```

#### Konfigurasi Strak:
```json
{
  "apiKey": "ollama",
  "baseUrl": "http://localhost:11434/v1",
  "model": "llama2"
}
```

---

### OpenRouter (Multi-Provider)

```json
{
  "apiKey": "sk-or-...",
  "baseUrl": "https://openrouter.ai/api/v1",
  "model": "anthropic/claude-3-opus"
}
```

---

## Troubleshooting

### Error: "npm link tidak dikenali"

**Solusi**: Tambahkan npm global path ke PATH Anda:

**Windows:**
```bash
# Cek lokasi npm global
npm config get prefix

# Tambahkan C:\Users\YourName\AppData\Roaming\npm ke PATH
```

**MacOS/Linux:**
```bash
# Biasanya sudah ada di /usr/local/bin
# Jika tidak, tambahkan ke .bashrc atau .zshrc:
export PATH="$PATH:$(npm config get prefix)/bin"
```

---

### Error: "Config belum lengkap"

**Penyebab**: File `config.json` belum diisi atau tidak valid.

**Solusi**:
1. Pastikan file `config.json` ada di root project
2. Isi semua field: `apiKey`, `baseUrl`, `model`
3. Pastikan format JSON valid (gunakan JSON validator jika perlu)

---

### Error: "Cannot find module"

**Penyebab**: Dependencies belum terinstall atau build belum dilakukan.

**Solusi**:
```bash
npm install
npm run build
npm link
```

---

### Error: "LLM API Error: 401"

**Penyebab**: API key tidak valid atau sudah expired.

**Solusi**:
1. Cek API key di `config.json`
2. Generate API key baru dari dashboard provider Anda
3. Pastikan API key memiliki permission yang cukup

---

### Error: "LLM API Request Error: No response received"

**Penyebab**: `baseUrl` salah atau network issue.

**Solusi**:
1. Cek koneksi internet
2. Pastikan `baseUrl` benar
3. Jika menggunakan Ollama local, pastikan Ollama server berjalan:
   ```bash
   ollama serve
   ```

---

## Uninstall

Jika ingin menghapus Strak:

```bash
# Unlink dari global
npm unlink -g strak

# Atau jika install dari directory
cd strak
npm unlink
```

---

## Update

Untuk update ke versi terbaru:

```bash
cd strak
git pull origin main
npm install
npm run build
```

---

## Development Mode

Untuk development dengan auto-reload:

```bash
npm run dev
```

Atau dengan watch mode:

```bash
npm run watch
# Di terminal lain:
npm run dev
```

---

## Bantuan Lebih Lanjut

- **Issue**: https://github.com/yourusername/strak/issues
- **Documentation**: Lihat README.md
- **Contributing**: Lihat CONTRIBUTING.md

---

Selamat menggunakan Strak! 🚀
