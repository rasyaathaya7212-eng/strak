# 📤 Cara Upload Strak ke GitHub

Panduan step-by-step untuk upload project Strak ke GitHub.

## Prasyarat

1. **Akun GitHub**: Daftar di https://github.com jika belum punya
2. **Git terinstall**: Download dari https://git-scm.com/
3. **Git configured**: Setup name dan email

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Step 1: Buat Repository di GitHub

1. Login ke GitHub: https://github.com
2. Klik tombol **"New"** atau **"+"** → **"New repository"**
3. Isi form:
   - **Repository name**: `strak`
   - **Description**: `AI Agent CLI with Chimera Architecture - 2000+ Tools`
   - **Visibility**: 
     - ✅ **Public** (jika ingin open source)
     - ⬜ **Private** (jika ingin private)
   - ⬜ **Jangan** centang "Add README" (kita sudah punya)
   - ⬜ **Jangan** centang "Add .gitignore" (kita sudah punya)
   - ⬜ **Jangan** centang "Choose a license" (kita sudah punya MIT)
4. Klik **"Create repository"**

---

## Step 2: Inisialisasi Git di Project

Buka terminal di folder project Strak:

```bash
cd /path/to/strak

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Strak CLI with Chimera Architecture"
```

---

## Step 3: Pastikan config.json Tidak Ter-upload

**⚠️ SANGAT PENTING**: Jangan upload `config.json` karena berisi API key!

Cek file `.gitignore` sudah ada dan berisi:

```
config.json
.strak-memory.json
```

Test dengan:

```bash
git status
```

Pastikan `config.json` TIDAK muncul di list file yang akan di-commit.

---

## Step 4: Connect ke GitHub dan Push

Setelah create repository di GitHub, akan muncul instruksi. Ikuti bagian "push an existing repository":

```bash
# Add remote
git remote add origin https://github.com/yourusername/strak.git

# Rename branch to main (jika masih master)
git branch -M main

# Push to GitHub
git push -u origin main
```

Jika diminta username/password:
- **Username**: username GitHub Anda
- **Password**: **JANGAN** pakai password biasa, gunakan **Personal Access Token**

---

## Step 5: Setup Personal Access Token (Jika Perlu)

Jika push gagal karena autentikasi:

1. Buka: https://github.com/settings/tokens
2. Klik **"Generate new token"** → **"Generate new token (classic)"**
3. Isi form:
   - **Note**: `Strak CLI Push Token`
   - **Expiration**: Pilih durasi (90 days recommended)
   - **Scopes**: Centang **`repo`** (full control)
4. Klik **"Generate token"**
5. **COPY TOKEN SEKARANG** (tidak bisa dilihat lagi!)
6. Gunakan token sebagai password saat push:
   ```bash
   Username: yourusername
   Password: ghp_xxxxxxxxxxxxxxxxxxxx (paste token)
   ```

---

## Step 6: Verify Upload Berhasil

1. Buka: `https://github.com/yourusername/strak`
2. Pastikan semua file sudah ada
3. Pastikan `config.json` **TIDAK** ada di repository
4. Cek README tampil dengan baik

---

## Step 7: Tambahkan Topics/Tags

Untuk discoverability, tambahkan topics:

1. Di halaman repository, klik **gear icon** di sebelah "About"
2. Tambahkan topics:
   - `ai`
   - `agent`
   - `cli`
   - `typescript`
   - `llm`
   - `automation`
   - `tools`
   - `openai`
   - `claude`
3. Klik **"Save changes"**

---

## Step 8: Setup GitHub Pages untuk Documentation (Opsional)

Untuk membuat website documentation:

1. Buat folder `docs/`
2. Copy documentation ke sana
3. Push ke GitHub
4. Settings → Pages → Source: `main` branch `/docs` folder
5. Save

---

## Git Workflow untuk Update Selanjutnya

Setelah initial upload, untuk update:

```bash
# 1. Check status
git status

# 2. Add changes
git add .
# atau specific file:
git add src/tools/categories/01-web-search.ts

# 3. Commit with message
git commit -m "feat: implement web_search_google tool"

# 4. Push to GitHub
git push
```

### Commit Message Convention

Gunakan conventional commits:

```bash
# Feature baru
git commit -m "feat: add PostgreSQL database tools"

# Bug fix
git commit -m "fix: resolve memory leak in agent loop"

# Documentation
git commit -m "docs: update installation guide"

# Refactor
git commit -m "refactor: improve tool registry performance"

# Performance
git commit -m "perf: optimize LLM token usage"

# Testing
git commit -m "test: add unit tests for file operations"
```

---

## Branching Strategy (Untuk Tim)

### Main Branch
- `main`: Stable, production-ready code

### Development
```bash
# Create feature branch
git checkout -b feature/add-docker-tools

# Work on feature...
git add .
git commit -m "feat: implement Docker tools"

# Push branch
git push -u origin feature/add-docker-tools

# Create Pull Request di GitHub
# Merge setelah review
```

### Hotfix
```bash
git checkout -b hotfix/fix-config-validation
# Fix issue...
git commit -m "fix: validate config before starting CLI"
git push -u origin hotfix/fix-config-validation
```

---

## Repository Settings Best Practices

### 1. Branch Protection

Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require conversation resolution before merging

### 2. Issues Templates

Buat `.github/ISSUE_TEMPLATE/`:
- `bug_report.md`
- `feature_request.md`
- `tool_implementation.md`

### 3. Pull Request Template

Buat `.github/PULL_REQUEST_TEMPLATE.md`

---

## Troubleshooting

### Error: "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/yourusername/strak.git
```

### Error: "failed to push some refs"

```bash
# Pull terlebih dahulu
git pull origin main --rebase

# Resolve conflicts jika ada
# Kemudian push lagi
git push
```

### Accidentally Committed config.json

**⚠️ BAHAYA**: API key Anda terexpose!

```bash
# Remove from git but keep local file
git rm --cached config.json

# Commit removal
git commit -m "fix: remove config.json from tracking"

# Push
git push

# IMMEDIATE: Revoke API key di provider dashboard!
# Generate API key baru
```

---

## Checklist Sebelum Push

- [ ] `config.json` ada di `.gitignore`
- [ ] Tidak ada API keys hardcoded di code
- [ ] README.md sudah lengkap
- [ ] Build berhasil (`npm run build`)
- [ ] License file ada (MIT)
- [ ] `.gitignore` sudah proper
- [ ] Commit message descriptive

---

## Resources

- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf
- **GitHub Guides**: https://guides.github.com/
- **Conventional Commits**: https://www.conventionalcommits.org/

---

**Happy Pushing! 🚀**

Setelah upload, jangan lupa share repository link Anda:
- Twitter/X dengan hashtag #AIAgent #CLI
- Reddit r/programming, r/opensource
- Dev.to atau Medium untuk write-up
