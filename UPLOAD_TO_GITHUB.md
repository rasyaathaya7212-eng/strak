# 📤 Cara Upload STRAK CLI ke GitHub

Panduan step-by-step untuk upload project STRAK CLI ke GitHub.

---

## 📋 Prerequisites

✅ Pastikan sudah punya:
- Akun GitHub ([daftar di sini](https://github.com/signup))
- Git installed di komputer ([download di sini](https://git-scm.com/downloads))
- Project STRAK CLI sudah di-build (`npm run build`)

---

## 🎯 Langkah 1: Persiapan Project

### 1.1 Build Project

```bash
cd "C:\Users\ASUS\Downloads\STRAK CLI"
npm run build
```

### 1.2 Cek File yang Akan di-Upload

```bash
# List semua file
ls

# Pastikan ada:
# - src/ (source code)
# - dist/ (compiled code)
# - package.json
# - README.md
# - LICENSE
# - .gitignore
# - config.json (optional, bisa dihapus jika berisi API key)
```

### 1.3 Hapus File Sensitif (PENTING!)

**Jika `config.json` berisi API key asli Anda:**

```bash
# Backup config Anda
cp config.json config.json.backup

# Edit config.json, ganti dengan template
```

Edit `config.json`:
```json
{
  "apiKey": "YOUR_API_KEY_HERE",
  "baseUrl": "https://your-api-endpoint.com/v1",
  "model": "your-model-name"
}
```

**ATAU** tambahkan ke `.gitignore`:
```bash
echo "config.json" >> .gitignore
```

---

## 🎯 Langkah 2: Inisialisasi Git

### 2.1 Buka Terminal di Folder Project

```bash
cd "C:\Users\ASUS\Downloads\STRAK CLI"
```

### 2.2 Initialize Git Repository

```bash
git init
```

Output:
```
Initialized empty Git repository in C:/Users/ASUS/Downloads/STRAK CLI/.git/
```

### 2.3 Konfigurasi Git (Jika Belum)

```bash
# Set username
git config --global user.name "Your Name"

# Set email (pakai email GitHub Anda)
git config --global user.email "your-email@example.com"
```

---

## 🎯 Langkah 3: Buat Repository di GitHub

### 3.1 Login ke GitHub

Buka [github.com](https://github.com) dan login

### 3.2 Buat Repository Baru

1. Klik tombol **"+"** di pojok kanan atas
2. Pilih **"New repository"**
3. Isi form:
   - **Repository name:** `strak-cli` (atau nama lain)
   - **Description:** `🤖 AI Agent CLI with 200+ Tools`
   - **Visibility:** Public (atau Private jika ingin private)
   - **❌ JANGAN** centang "Initialize with README" (karena kita sudah punya)
4. Klik **"Create repository"**

### 3.3 Salin URL Repository

GitHub akan menampilkan URL seperti:
```
https://github.com/USERNAME/strak-cli.git
```

Salin URL ini!

---

## 🎯 Langkah 4: Upload Project ke GitHub

### 4.1 Add All Files

```bash
git add .
```

### 4.2 Commit Files

```bash
git commit -m "Initial commit: STRAK CLI with 200+ tools"
```

Output:
```
[master (root-commit) abc1234] Initial commit: STRAK CLI with 200+ tools
 XX files changed, XXXX insertions(+)
 create mode 100644 package.json
 create mode 100644 README.md
 ...
```

### 4.3 Set Remote Repository

```bash
# Ganti USERNAME dan REPOSITORY_NAME dengan milik Anda
git remote add origin https://github.com/USERNAME/strak-cli.git
```

**Contoh:**
```bash
git remote add origin https://github.com/johndoe/strak-cli.git
```

### 4.4 Push ke GitHub

```bash
# Push ke branch main
git branch -M main
git push -u origin main
```

**Jika diminta login:**
- Username: username GitHub Anda
- Password: **Personal Access Token** (bukan password biasa)

#### Cara Buat Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" → "Generate new token (classic)"
3. Note: "STRAK CLI Upload"
4. Expiration: pilih durasi
5. Select scopes: centang **"repo"**
6. "Generate token"
7. **SALIN TOKEN** (hanya muncul sekali!)
8. Paste sebagai password saat git push

---

## 🎯 Langkah 5: Verifikasi Upload

### 5.1 Cek di GitHub

Buka browser:
```
https://github.com/USERNAME/strak-cli
```

Pastikan semua file sudah ter-upload:
- ✅ README.md tampil dengan baik
- ✅ Folder `src/` ada
- ✅ File `package.json` ada
- ✅ File `.gitignore` ada

### 5.2 Test Clone (Optional)

Test apakah orang lain bisa clone:

```bash
# Di folder lain
cd ..
git clone https://github.com/USERNAME/strak-cli.git test-clone
cd test-clone
npm install
npm run build
npm link
strak
```

---

## 🎯 Langkah 6: Update README dengan Info Correct

### 6.1 Edit README.md

Ganti placeholder di `README.md`:

```markdown
# Cari dan ganti:
USERNAME → your-github-username
your-email@example.com → your@email.com
[Your Name] → Nama Anda
```

### 6.2 Commit & Push Update

```bash
git add README.md
git commit -m "Update README with correct info"
git push
```

---

## 🎯 Bonus: Membuat Releases

### 7.1 Tag Version

```bash
git tag -a v1.0.0 -m "Release v1.0.0: Initial release with 200 tools"
git push origin v1.0.0
```

### 7.2 Create Release di GitHub

1. GitHub → Repository → "Releases" (di sidebar kanan)
2. "Create a new release"
3. "Choose a tag" → pilih `v1.0.0`
4. Release title: `v1.0.0 - Initial Release`
5. Description:
```markdown
## 🎉 STRAK CLI v1.0.0

First stable release!

### ✨ Features
- 🤖 AI Agent with tool calling
- 🛠️ 200+ tools across 14 categories
- 🎨 Cyberpunk UI
- 🔍 Tool suggestion with `/`
- ⚡ Auto-config copy
- 💾 Memory system

### 📦 Installation
See [GITHUB_SETUP.md](GITHUB_SETUP.md)
```
6. Klik **"Publish release"**

---

## 📚 Langkah 7: Dokumentasi Tambahan (Optional)

### 7.1 Add Topics

Di halaman repository GitHub:
1. Klik "⚙️" (Settings icon) di samping "About"
2. Add topics:
   ```
   ai, cli, agent, typescript, nodejs, automation, tools
   ```

### 7.2 Add Logo

Upload `logo.png` ke repository root, lalu di README.md:
```markdown
![STRAK Logo](logo.png)
```

### 7.3 Enable GitHub Pages (Optional)

Untuk dokumentasi website:
1. Settings → Pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Save

---

## 🔄 Update Project di Masa Depan

Setelah upload pertama kali, untuk update selanjutnya:

```bash
# 1. Make changes
# ... edit files ...

# 2. Add changes
git add .

# 3. Commit
git commit -m "Update: deskripsi perubahan"

# 4. Push
git push
```

### Update dengan Version Baru

```bash
# Update version di package.json
npm version patch  # 1.0.0 → 1.0.1
# atau
npm version minor  # 1.0.0 → 1.1.0
# atau
npm version major  # 1.0.0 → 2.0.0

# Commit & Push
git push
git push --tags

# Buat release baru di GitHub
```

---

## 🎯 Checklist Final

Sebelum share ke public, pastikan:

- [ ] ✅ README.md informatif dan menarik
- [ ] ✅ Tidak ada API key atau secret di repository
- [ ] ✅ `.gitignore` sudah benar
- [ ] ✅ `package.json` lengkap dengan dependencies
- [ ] ✅ `LICENSE` file ada
- [ ] ✅ Documentation lengkap (GITHUB_SETUP.md, etc)
- [ ] ✅ Build berhasil (`npm run build`)
- [ ] ✅ Test install works (`npm link` → `strak`)
- [ ] ✅ Link di README sudah benar (ganti USERNAME)

---

## 🚀 Share Project Anda!

Setelah upload, share link repository Anda:

```
https://github.com/USERNAME/strak-cli
```

Post di:
- 💬 Twitter/X
- 💼 LinkedIn
- 🎮 Discord communities
- 🤖 AI/Dev forums
- 📱 Reddit (r/nodejs, r/typescript, r/programming)

Example post:
```
🚀 Launching STRAK CLI - AI Agent with 200+ Tools!

An intelligent CLI agent powered by AI that can:
✅ Search the web
✅ Manage files
✅ Execute commands
✅ Remember context
✅ And 200+ more automation tools!

Check it out: https://github.com/USERNAME/strak-cli

#AI #CLI #Automation #OpenSource
```

---

## 🆘 Troubleshooting

### Error: "fatal: remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/strak-cli.git
```

### Error: "! [rejected] main -> main (non-fast-forward)"

```bash
# WARNING: ini akan overwrite history
git push -f origin main
```

### Error: Authentication Failed

- Pastikan username benar
- Password harus **Personal Access Token**, bukan password GitHub
- Token harus punya scope "repo"

### File Terlalu Besar

Jika ada error file > 100MB:
```bash
# Add ke .gitignore
echo "nama-file-besar" >> .gitignore

# Remove from git
git rm --cached nama-file-besar

# Commit & push
git commit -m "Remove large file"
git push
```

---

## 🎉 Selesai!

Project STRAK CLI Anda sekarang sudah online di GitHub!

**Next steps:**
1. ⭐ Star repository Anda sendiri
2. 📝 Update README dengan screenshot
3. 📹 Buat demo video
4. 🐛 Monitor issues dari users
5. 🔄 Regular updates & improvements

---

**Happy Coding! 🚀**
