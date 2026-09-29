# 🚀 START HERE - First Time Setup

Selamat datang di Strak! Ikuti langkah-langkah di bawah ini untuk memulai.

---

## 📋 Langkah 1: Verifikasi Prerequisites

Buka terminal dan jalankan:

```bash
node --version
```

**Expected Output**: `v18.0.0` atau lebih tinggi

Jika belum install atau versi lebih lama:
- Download Node.js dari: https://nodejs.org/
- Install, lalu restart terminal

---

## 📦 Langkah 2: Install Dependencies

Di folder project ini, jalankan:

```bash
npm install
```

**Expected Output**: 
```
added XX packages in Xs
```

Jika error, coba:
```bash
npm install --legacy-peer-deps
```

---

## ⚙️ Langkah 3: Konfigurasi API

### Pilih LLM Provider Anda:

#### Option A: OpenAI (Recommended untuk pemula)

1. Buka: https://platform.openai.com/api-keys
2. Login/Sign up
3. Klik "Create new secret key"
4. Copy API key (mulai dengan `sk-proj-...`)

Edit `config.json`:
```json
{
  "apiKey": "sk-proj-PASTE_YOUR_KEY_HERE",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

**Biaya**: ~$0.03 per 1K tokens input, ~$0.06 per 1K tokens output

---

#### Option B: Ollama (FREE, Local)

1. Install Ollama:
   - **MacOS/Linux**: `curl https://ollama.ai/install.sh | sh`
   - **Windows**: Download dari https://ollama.ai/download

2. Pull model:
   ```bash
   ollama pull llama2
   ```

3. Start Ollama (di terminal terpisah):
   ```bash
   ollama serve
   ```

4. Edit `config.json`:
   ```json
   {
     "apiKey": "ollama",
     "baseUrl": "http://localhost:11434/v1",
     "model": "llama2"
   }
   ```

**Biaya**: FREE! Tapi butuh resource lokal.

---

#### Option C: Anthropic Claude

1. Buka: https://console.anthropic.com/
2. Get API key
3. Edit `config.json`:
   ```json
   {
     "apiKey": "sk-ant-YOUR_KEY_HERE",
     "baseUrl": "https://api.anthropic.com/v1",
     "model": "claude-3-opus-20240229"
   }
   ```

---

## 🔨 Langkah 4: Build Project

```bash
npm run build
```

**Expected Output**:
```
Successfully compiled XX files
```

Akan muncul folder `dist/`

---

## 🔗 Langkah 5: Link Globally

```bash
npm link
```

**Expected Output**:
```
added 1 package
```

Atau di Windows mungkin butuh admin:
```bash
# Run PowerShell as Administrator
npm link
```

---

## 🎉 Langkah 6: RUN STRAK!

```bash
strak
```

**Expected Output**:

```
 ▄     ▄
▄▄▄    ███
█ ▀ ▀ █  
█  ▄  █  
 ▀▀▀▀▀   

strak v1.0.0                     gpt-4 · API Usage Billing
                    C:\Your\Current\Directory

> _
```

Jika muncul seperti ini, **BERHASIL!** 🎉

---

## 💡 Langkah 7: Test Commands

Coba command berikut satu per satu:

### Test 1: File Read
```
> Baca file README.md dan beritahu saya tentang apa project ini
```

### Test 2: File Write
```
> Buat file hello.txt dengan isi "Hello from Strak!"
```

### Test 3: Directory List
```
> List semua file di direktori ini
```

### Test 4: Command Execution
```
> Jalankan command "node --version"
```

### Test 5: Memory
```
> Simpan ke memory: "Saya suka coding dengan TypeScript"
```

### Test 6: Memory Recall
```
> Recall memory tentang preferensi saya
```

### Test 7: Web Fetch
```
> Fetch konten dari https://example.com
```

---

## 🐛 Troubleshooting

### Error: "Config belum lengkap"

**Problem**: File `config.json` belum diisi atau tidak valid

**Solution**:
1. Buka `config.json`
2. Pastikan semua field terisi:
   - `apiKey` ← API key dari provider
   - `baseUrl` ← URL endpoint
   - `model` ← Nama model
3. Pastikan format JSON valid (no trailing commas!)

---

### Error: "strak: command not found"

**Problem**: npm link belum berhasil atau path tidak di-set

**Solution**:

**Windows**:
```bash
# Check npm global path
npm config get prefix

# Should show: C:\Users\YourName\AppData\Roaming\npm
# Make sure this is in your PATH

# Try relink
npm unlink -g strak
npm link
```

**Mac/Linux**:
```bash
# Try with sudo
sudo npm link
```

---

### Error: "LLM API Error: 401"

**Problem**: API key tidak valid

**Solution**:
1. Cek API key di dashboard provider
2. Generate new API key
3. Update `config.json`
4. Restart strak

---

### Error: "Cannot find module"

**Problem**: Build belum dilakukan atau dependencies belum terinstall

**Solution**:
```bash
rm -rf node_modules dist
npm install
npm run build
npm link
```

---

### Error: "ECONNREFUSED" (Ollama)

**Problem**: Ollama server tidak berjalan

**Solution**:
```bash
# Start Ollama di terminal terpisah
ollama serve

# Tunggu sampai ready, lalu jalankan strak di terminal lain
```

---

## 🎓 What's Next?

### For Users:
1. ✅ Strak sudah berjalan
2. 📖 Baca [QUICKSTART.md](QUICKSTART.md) untuk tips penggunaan
3. 📚 Baca [README.md](README.md) untuk dokumentasi lengkap
4. 🎯 Eksplor 2000 tools yang tersedia

### For Developers:
1. ✅ Setup development environment
2. 📖 Baca [ARCHITECTURE.md](ARCHITECTURE.md) untuk memahami arsitektur
3. 🔧 Baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk contribute
4. 💻 Implementasikan tools yang masih stub!

---

## 📚 Documentation Index

Quick reference untuk semua dokumentasi:

- **START_HERE.md** ← You are here!
- **QUICKSTART.md** - 5-minute quick guide
- **README.md** - Main documentation
- **INSTALLATION.md** - Detailed installation
- **ARCHITECTURE.md** - Technical architecture
- **CONTRIBUTING.md** - How to contribute
- **GITHUB_UPLOAD.md** - Upload to GitHub guide
- **PROJECT_SUMMARY.md** - Complete project summary

---

## 🆘 Still Having Issues?

1. **Re-read this guide** - 90% of issues are covered here
2. **Check INSTALLATION.md** - More detailed troubleshooting
3. **Google the error message** - Often has quick solutions
4. **Ask for help**: Open an issue on GitHub

---

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Config.json filled with valid API key
- [ ] Project built (`npm run build`)
- [ ] Globally linked (`npm link`)
- [ ] Strak runs and shows green logo
- [ ] Tested at least one command successfully

All checked? **You're ready to go!** 🚀

---

## 🎉 Welcome to Strak!

You now have a powerful AI Agent CLI with 2000 tools at your fingertips.

**Pro Tips**:
- Type `exit` or `quit` to leave Strak
- Press Ctrl+C to force quit
- Check memory file: `.strak-memory.json`
- Build folder: `dist/` (can be deleted, regenerated with `npm run build`)

**Have fun building with Strak!** ✨

---

**Next Step**: → [QUICKSTART.md](QUICKSTART.md)
