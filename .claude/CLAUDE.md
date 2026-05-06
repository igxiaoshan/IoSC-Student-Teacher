# CLAUDE.md - Multi-Model Collaboration Guide

## Multi-Model Workflow

This project supports multi-model collaboration for development tasks.

## Available Models

| Model | Tool | Purpose |
|-------|------|---------|
| Gemini Flash | `gemini-flash` | Code generation, review, analysis |
| Grok | MCP (grok-search) | Web search + AI reasoning |
| Ace | MCP (ace-tool) | Codebase semantic search |

## Workflow

### 1. Context Retrieval (Ace-Tool)
```javascript
mcp__ace-tool__search_context({
  project_root_path: "D:/core/code/IoSC-Student-Teacher-main",
  query: "查询内容"
})
```

### 2. Multi-Model Analysis
```
Backend Logic → Gemini (Route B)
Frontend/UI → Gemini (Route A)
Web Search → Grok-Search
```

### 3. Implementation
```
Implement based on analysis
```

### 4. Audit
```
Review with Gemini
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/workflow/code-review` | POST | Code review |
| `/api/workflow/develop` | POST | Feature development |
| `/api/workflow/debug` | POST | Debugging |
| `/api/workflow/design-api` | POST | API design |
| `/api/workflow/design-schema` | POST | Schema design |
| `/api/workflow/generate-tests` | POST | Test generation |

## Quick Commands

```bash
# Code review via API
curl -X POST http://localhost:5000/api/workflow/code-review \
  -H "Content-Type: application/json" \
  -d '{"context": "代码上下文", "issue": "问题描述"}'

# Feature development
curl -X POST http://localhost:5000/api/workflow/develop \
  -H "Content-Type: application/json" \
  -d '{"requirement": "功能需求"}'
```

## MCP Permissions

Required MCP tools in `.claude/settings.local.json`:
- `mcp__ace-tool__search_context`
- `mcp__grok-search__web_search`
- `mcp__grok-search__web_fetch`
- `mcp__grok-search__get_config_info`
