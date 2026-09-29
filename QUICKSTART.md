# ⚡ Quick Start Guide

Get Strak up and running in 5 minutes!

## 📋 Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check npm
npm --version

# Check Git
git --version
```

All good? Let's go! 🚀

---

## 🎯 3-Step Installation

### Step 1: Get the Code

```bash
git clone https://github.com/yourusername/strak.git
cd strak
```

### Step 2: Install & Build

```bash
npm install && npm run build
```

### Step 3: Configure API

Create `config.json`:

```json
{
  "apiKey": "your-api-key-here",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

**Need an API key?**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Ollama: Just use "ollama" as apiKey (free, local!)

---

## 🚀 Launch Strak

### Make it global:
```bash
npm link
```

### Run anywhere:
```bash
strak
```

You should see:

```
 ▄     ▄
▄▄▄    ███
█ ▀ ▀ █  
█  ▄  █  
 ▀▀▀▀▀   

strak v1.0.0                     gpt-4 · API Usage Billing
                    /your/current/directory

> _
```

---

## 💬 Your First Commands

### 1. Read a file
```
> Baca file README.md dan ringkas isinya
```

### 2. Create a file
```
> Buat file hello.txt dengan isi "Hello, Strak!"
```

### 3. List directory
```
> List semua file di direktori ini
```

### 4. Run a command
```
> Jalankan command "npm --version"
```

### 5. Save to memory
```
> Simpan ke memory: "Project ini adalah CLI AI Agent bernama Strak"
```

### 6. Recall memory
```
> Recall memory tentang project ini
```

### 7. Fetch web content
```
> Fetch konten dari https://example.com
```

---

## 🎓 Understanding Strak Behavior

### Agent Loop Pattern

Strak works like this:

```
You ask → LLM thinks → LLM uses tools → LLM responds
                ↑_______________|
                  (loop until done)
```

**Example conversation:**

```
You: "Create a file called data.txt with today's date"

Strak: [Thinking...] I'll use file_write tool
      ⚙️  Menjalankan tool: file_write
      [Done] Created data.txt with today's date: 2024-01-15
```

---

## 🛠️ Available Tools

### ✅ Fully Working (7 tools)
1. `file_read` - Read files
2. `file_write` - Write files  
3. `dir_list` - List directories
4. `bash_exec` - Run commands
5. `memory_save` - Save info
6. `memory_recall` - Recall info
7. `web_fetch` - Fetch URLs

### 📦 Available but Stub (1993 tools)
- Will return: "Tool [name] belum diimplementasikan"
- Great opportunity to contribute! 😉

---

## 💡 Pro Tips

### 1. Chain Commands
```
> Buat folder 'test', buat file 'test.txt' di dalamnya dengan isi "Testing", 
  kemudian baca isinya kembali
```

### 2. Complex Tasks
```
> Clone repository dari github.com/user/repo, install dependencies, 
  dan jalankan tests
```

### 3. Memory Usage
```
> Simpan ke memory preferensi saya: suka bahasa TypeScript, 
  coding style: 2 spaces, prefer functional programming

> Nanti ketika buat code, tolong ikuti preferensi saya
```

### 4. Multiple Providers

Switch providers by editing `config.json`:

**OpenAI GPT-4:**
```json
{
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

**Claude:**
```json
{
  "apiKey": "sk-ant-...",
  "baseUrl": "https://api.anthropic.com/v1",
  "model": "claude-3-opus-20240229"
}
```

**Ollama (Free!):**
```json
{
  "apiKey": "ollama",
  "baseUrl": "http://localhost:11434/v1",
  "model": "llama2"
}
```

---

## 🐛 Common Issues

### "Config belum lengkap"
→ Fill all fields in `config.json`

### "LLM API Error: 401"
→ Check your API key

### "Cannot find module"
→ Run `npm install && npm run build`

### "strak: command not found"
→ Run `npm link` again

---

## 🎯 Next Steps

1. ✅ You've installed Strak
2. ✅ You've run your first commands
3. **Now what?**

### For Users:
- Read full docs: [README.md](README.md)
- Explore all 44 tool categories
- Join discussions: GitHub Discussions

### For Developers:
- Read architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contribute tools: [CONTRIBUTING.md](CONTRIBUTING.md)
- Check open issues: GitHub Issues

---

## 🆘 Need Help?

- **Documentation**: Check README.md
- **Installation Issues**: Check INSTALLATION.md  
- **Bug Report**: Open an issue on GitHub
- **Questions**: Start a discussion on GitHub

---

## 🎉 You're Ready!

Strak is now at your command. Build amazing things! 

**Exit Strak**: Type `exit` or `quit`

---

**Quick Reference Card**

```bash
# Install
npm install && npm run build && npm link

# Run
strak

# Update
git pull && npm install && npm run build

# Uninstall
npm unlink -g strak
```

**Happy Building! 🚀**
