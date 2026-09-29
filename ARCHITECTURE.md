# 🏗️ Arsitektur Strak - Chimera Architecture

Dokumen ini menjelaskan arsitektur internal Strak secara detail.

## 🎯 Konsep Chimera Architecture

Strak menggabungkan tiga konsep arsitektur besar menjadi satu sistem yang kohesif:

1. **Claude Code**: Pattern untuk agent loop dan tool execution
2. **OpenClaw**: Orchestration dan routing layer
3. **Hermes**: Comprehensive capabilities dengan 2000+ tools

---

## 📐 Layer Architecture

### Layer 1: User Interfaces Layer

**Lokasi**: `src/cli/`

**Komponen**:
- `index.ts`: Entry point CLI, menangani input/output
- `ui.ts`: Rendering komponen UI (logo, header, prompt)

**Tanggung Jawab**:
- Menerima input dari user
- Menampilkan output dengan format yang user-friendly
- Validasi input dasar
- Routing ke Orchestration Layer

**Extensibility**:
- Chat platforms (Telegram, Discord) bisa ditambahkan di sini
- Web interface bisa diintegrasikan
- Desktop app wrapper (Electron) bisa dibangun

---

### Layer 2: Orchestration Layer (OpenClaw-inspired)

**Lokasi**: `src/gateway/`

**Komponen**:
- `router.ts`: Gateway yang route commands ke agent

**Tanggung Jawab**:
- Routing request ke session yang tepat
- Load balancing (untuk multiple sessions)
- Request queueing
- Session lifecycle management

**Flow**:
```
User Input → Gateway → Router → Session Manager → Agent Core
```

---

### Layer 3: Agent Core (Claude Code-inspired)

**Lokasi**: `src/core/`

**Komponen**:
- `agent-loop.ts`: Main loop untuk agent execution
- `session.ts`: Session dan context management
- `llm-router.ts`: Routing ke LLM provider
- `permissions.ts`: Permission system untuk tools

#### Agent Loop Detail

**Loop Flow**:
```typescript
while (not_done) {
  1. Prepare context (messages + tools)
  2. Call LLM
  3. Check if LLM wants to use tools
     - If no: Return response, exit loop
     - If yes: Execute tools
  4. Add tool results to context
  5. Loop back to step 1
}
```

**Max Iterations**: 10 (untuk prevent infinite loops)

**Context Management**:
- Semua messages (user, assistant, tool) disimpan dalam session
- Session persisten selama CLI berjalan
- Memory dapat disimpan ke disk untuk persistence

---

### Layer 4: Capabilities Layer (Hermes-inspired)

**Lokasi**: `src/tools/`

**Komponen**:
- `registry.ts`: Central registry untuk semua tools
- `executor.ts`: Eksekutor tool
- `loader.ts`: Dynamic loader untuk tool categories
- `helpers.ts`: Helper functions
- `categories/`: 44 file kategori tool

#### Tool Registry System

**Registration Flow**:
```
App Start → Loader reads categories/ → Registry registers all tools
```

**Tool Definition**:
```typescript
interface Tool {
  name: string;           // Unique identifier
  description: string;    // LLM-readable description
  parameters: ZodSchema;  // Parameter validation
  handler: Function;      // Implementation
  category: string;       // Grouping
}
```

**Categories Organization** (44 total):
- 1-10: Core utilities (web, network, shell, files)
- 11-20: Development tools (git, build, test, containers)
- 21-30: Media & Content (image, video, audio, writing)
- 31-40: Business & AI (finance, research, security, AI)
- 41-44: System & Meta (automation, utilities, admin, control)

---

### Layer 5: LLM Provider Layer

**Lokasi**: `src/providers/`

**Komponen**:
- `custom.ts`: Universal provider supporting any OpenAI-compatible API

#### Custom Provider Design

**Philosophy**: One provider to rule them all

**Supported APIs**:
- OpenAI (native)
- Anthropic (via OpenAI-compatible endpoint)
- Ollama (local, OpenAI-compatible)
- OpenRouter (multi-provider)
- Any custom API with OpenAI format

**Request Format**:
```typescript
POST {baseUrl}/chat/completions
Headers:
  Authorization: Bearer {apiKey}
  Content-Type: application/json
Body:
  model: string
  messages: Message[]
  tools?: ToolDefinition[]
  temperature?: number
  max_tokens?: number
```

---

## 🔄 Data Flow Diagram

### Complete Request Flow

```
┌──────────────┐
│   User       │
│   Input      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   CLI TUI    │ Validate & Format
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Gateway    │ Route to Session
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Agent      │ 
│   Loop       │◄──────┐
└──────┬───────┘       │
       │               │
       ▼               │
┌──────────────┐       │
│ LLM Router   │       │
│ + Provider   │       │
└──────┬───────┘       │
       │               │
       ▼               │
┌──────────────┐       │
│  LLM API     │       │
│  Response    │       │
└──────┬───────┘       │
       │               │
       ▼               │
  ┌─────────┐          │
  │Tool Call?│          │
  └────┬────┘          │
       │               │
    Yes│  No           │
       │   │           │
       ▼   ▼           │
  ┌────────┐  ┌────────┴────┐
  │ Tool   │  │   Return    │
  │Executor│  │   Response  │
  └────┬───┘  └─────────────┘
       │
       │
       └──────────────┘ Loop back
```

---

## 🧠 Memory System

**Storage**: JSON file `.strak-memory.json`

**Operations**:
- `memory_save`: Write to memory
- `memory_recall`: Read from memory
- Auto-persistence to disk

**Use Cases**:
- User preferences
- Project context
- Conversation history metadata
- Custom data storage

---

## 🔐 Security Considerations

### API Key Management
- ✅ Config file not tracked in git
- ✅ No hardcoded keys
- ✅ Environment variable support (planned)

### Tool Execution
- ✅ Permission system (basic)
- ⚠️ Shell execution sandboxing (planned)
- ⚠️ File operation boundaries (planned)

### LLM Safety
- ⚠️ Prompt injection protection (planned)
- ⚠️ Output filtering (planned)

---

## 🚀 Performance Considerations

### Token Management
- Only essential tools sent to LLM (7 tools)
- Full 2000 tools available in registry
- Reduce context size for cost optimization

### Caching
- Tool registry loaded once at startup
- Session management in-memory
- Memory persistence async

### Scalability
- Stateless agent core (can be horizontalized)
- Session manager can use Redis (planned)
- Tool execution can be distributed (planned)

---

## 🔮 Future Architecture Enhancements

### Planned Features

1. **Multi-Session Support**
   - Concurrent sessions
   - Session switching
   - Session persistence

2. **Plugin System**
   - Dynamic tool loading
   - Third-party tool packages
   - Tool marketplace

3. **Distributed Execution**
   - Remote tool execution
   - Cloud function integration
   - Worker pools

4. **Advanced Memory**
   - Vector search
   - Semantic memory
   - Long-term storage

5. **Web Interface**
   - Browser-based UI
   - Real-time collaboration
   - Dashboard

---

## 📊 Metrics & Monitoring (Planned)

- Tool usage statistics
- LLM token consumption
- Response times
- Error rates
- Cost tracking

---

## 🧪 Testing Strategy

### Unit Tests (Planned)
- Tool handlers
- Utilities
- Validators

### Integration Tests (Planned)
- Agent loop
- Tool execution
- LLM interaction

### E2E Tests (Planned)
- CLI workflows
- Multi-turn conversations

---

## 📚 Further Reading

- [README.md](README.md) - User guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [INSTALLATION.md](INSTALLATION.md) - Setup guide

---

**Designed with ❤️ for extensibility and maintainability**
