# 🔌 MCP (Model Context Protocol) Guide

STRAK CLI mendukung MCP servers yang kompatibel dengan Claude Code!

---

## 📋 Apa itu MCP?

**MCP (Model Context Protocol)** adalah protokol standar untuk AI agents berkomunikasi dengan external tools dan services. MCP servers menyediakan tools yang bisa dipanggil oleh AI.

### Keuntungan MCP:
- ✅ **Kompatibel** dengan Claude Code/Desktop
- ✅ **Plug & Play** - Install server, tools langsung available
- ✅ **Standardized** - Satu format untuk semua tools
- ✅ **Extensible** - Tambah server baru kapan saja

---

## 🚀 Quick Start

### 1. Enable MCP Server

Edit `.strak/mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "disabled": false,  // ← Change to false
      "autoApprove": ["read_file", "list_directory"]
    }
  }
}
```

### 2. Restart STRAK

```bash
strak
```

Output:
```
🔌 Initializing 1 MCP server(s)...
🔌 Connecting to MCP server: filesystem...
✅ Connected to MCP server: filesystem
✅ MCP: 1/1 servers connected, 5 tools available
✓ Loaded 203 built-in tools
✓ Loaded 208 tools  # 203 built-in + 5 MCP
```

### 3. Use MCP Tools

```
┃ ▶ baca file README.md dengan MCP
```

AI akan otomatis gunakan MCP tools yang tersedia!

---

## 📦 Popular MCP Servers

### 1. **Filesystem** (Local Files)
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
    "disabled": false,
    "autoApprove": ["read_file", "list_directory"]
  }
}
```

**Tools:**
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_directory` - List directory
- `create_directory` - Create directory
- `move_file` - Move/rename file

### 2. **Fetch** (HTTP Requests)
```json
{
  "fetch": {
    "command": "uvx",
    "args": ["mcp-server-fetch"],
    "disabled": false,
    "autoApprove": ["fetch"]
  }
}
```

**Requires:** `uv` package manager  
**Install:** `pip install uv`

**Tools:**
- `fetch` - Make HTTP GET/POST requests
- Fetch webpage content
- API calls

### 3. **Brave Search**
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "your-api-key-here"
    },
    "disabled": false,
    "autoApprove": ["brave_web_search"]
  }
}
```

**Get API Key:** https://brave.com/search/api/

**Tools:**
- `brave_web_search` - Web search dengan Brave

### 4. **GitHub**
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
    },
    "disabled": false,
    "autoApprove": []
  }
}
```

**Get Token:** GitHub → Settings → Developer settings → Personal access tokens

**Tools:**
- `create_or_update_file` - Commit file to repo
- `search_repositories` - Search GitHub repos
- `create_issue` - Create issue
- `create_pull_request` - Create PR
- `fork_repository` - Fork repo

### 5. **Google Drive**
```json
{
  "gdrive": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-gdrive"],
    "env": {
      "GDRIVE_CLIENT_ID": "your-client-id",
      "GDRIVE_CLIENT_SECRET": "your-client-secret"
    },
    "disabled": false
  }
}
```

**Tools:**
- `read_file` - Read file from Drive
- `write_file` - Write file to Drive
- `list_files` - List files

### 6. **Postgres**
```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."],
    "disabled": false,
    "autoApprove": []
  }
}
```

**Tools:**
- `query` - Execute SQL query
- `list_tables` - List database tables
- `describe_table` - Get table schema

---

## 🔒 Auto-Approve

MCP tools dapat di-approve otomatis untuk menghindari prompt berulang.

### Format:
```json
{
  "autoApprove": [
    "tool_name_1",
    "tool_name_2",
    "*"  // Approve all tools (dangerous!)
  ]
}
```

### Examples:

**Safe (Read-only):**
```json
"autoApprove": ["read_file", "list_directory", "fetch"]
```

**Moderate:**
```json
"autoApprove": ["read_file", "write_file", "list_directory"]
```

**Dangerous:**
```json
"autoApprove": ["*"]  // Auto-approve everything (not recommended!)
```

---

## 🛠️ Advanced Configuration

### Multiple Paths
```json
{
  "workspace": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
    "disabled": false
  },
  "home": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "~"],
    "disabled": false
  }
}
```

### Environment Variables
```json
{
  "custom-server": {
    "command": "python",
    "args": ["my_mcp_server.py"],
    "env": {
      "API_KEY": "secret",
      "DEBUG": "true",
      "TIMEOUT": "30"
    }
  }
}
```

### Custom Binary
```json
{
  "custom": {
    "command": "/usr/local/bin/my-mcp-server",
    "args": ["--port", "3000"],
    "disabled": false
  }
}
```

---

## 📊 Config File Locations

STRAK CLI checks config in this order:

1. `./.strak/mcp.json` (current directory)
2. `./mcp.json` (current directory)
3. `<project-root>/.strak/mcp.json` (STRAK project)
4. `~/.strak/mcp.json` (user home)

**Recommended:** Use `./.strak/mcp.json` in your project folder.

---

## 🐛 Troubleshooting

### Error: "command not found: npx"
**Solution:** Install Node.js  
```bash
# Windows: Download from nodejs.org
# Linux: sudo apt install nodejs npm
# Mac: brew install node
```

### Error: "command not found: uvx"
**Solution:** Install uv  
```bash
pip install uv
# or
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Server doesn't connect
**Check:**
1. `disabled: false` in config
2. Command exists (`which npx`, `which uvx`)
3. Args are correct
4. Env vars are set (if needed)

**Debug:**
Run command manually:
```bash
npx -y @modelcontextprotocol/server-filesystem .
```

### No tools showing up
**Check:**
1. Server connected successfully
2. Tools list returned (check logs)
3. No errors in stderr

**Verify:**
```bash
strak
# Should show: "✅ MCP: X/X servers connected, Y tools available"
```

### Tools not executing
**Check:**
1. Tool name correct
2. Arguments match inputSchema
3. Not in autoApprove (requires manual approval)

---

## 🔍 List Available MCP Tools

Use built-in command:
```
┃ ▶ list semua MCP tools yang available
```

Or via tool suggestion:
```
┃ ▶ /mcp_list_tools
```

---

## 📚 MCP Server Registry

Find more servers:
- **Official:** https://github.com/modelcontextprotocol/servers
- **Community:** https://github.com/topics/mcp-server
- **Awesome MCP:** https://github.com/punkpeye/awesome-mcp-servers

### Popular Third-Party Servers:
- **Slack** - Send messages to Slack
- **PostgreSQL** - Database operations
- **Google Drive** - Drive file operations
- **Puppeteer** - Browser automation
- **AWS** - AWS service integration
- **Notion** - Notion API
- **Airtable** - Airtable operations

---

## 🚀 Building Custom MCP Server

Want to create your own MCP server?

### Simple Python Example:
```python
from mcp.server.stdio import stdio_server
from mcp.server import Server
from mcp.types import Tool

server = Server("my-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="my_tool",
            description="My custom tool",
            inputSchema={
                "type": "object",
                "properties": {
                    "input": {"type": "string"}
                }
            }
        )
    ]

@server.call_tool()
async def call_tool(name, arguments):
    if name == "my_tool":
        return {"content": [{"type": "text", "text": f"Result: {arguments['input']}"}]}

if __name__ == "__main__":
    stdio_server(server)
```

Save as `my_server.py`, then add to `mcp.json`:
```json
{
  "my-server": {
    "command": "python",
    "args": ["my_server.py"],
    "disabled": false
  }
}
```

---

## 💡 Best Practices

1. **Start Small** - Enable one server at a time
2. **Use autoApprove wisely** - Only for safe, read-only tools
3. **Check logs** - Watch for connection/execution errors
4. **Test manually** - Run MCP server command directly first
5. **Secure credentials** - Don't commit API keys to git
6. **Document custom servers** - Add comments in mcp.json

---

## 🔗 Resources

- **MCP Specification:** https://modelcontextprotocol.io/
- **Official Servers:** https://github.com/modelcontextprotocol/servers
- **Claude Desktop Config:** https://modelcontextprotocol.io/docs/tools/claude-desktop
- **Building Servers:** https://modelcontextprotocol.io/docs/concepts/servers

---

**Happy MCP Integration! 🚀**
