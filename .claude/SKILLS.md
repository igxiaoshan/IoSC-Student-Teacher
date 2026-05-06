# Multi-Model Collaboration Skills

## Overview

This project uses a multi-model collaboration workflow for development tasks.

## Available Tools

| Tool | Purpose | Command |
|------|---------|---------|
| `gemini-flash` | Code generation, analysis | `D:/core/app/dev/nodejs/gemini-flash.bat -p "prompt"` |
| `grok-search` | Web search + AI reasoning | MCP: `mcp__grok-search__web_search` |
| `ace-tool` | Codebase semantic search | MCP: `mcp__ace-tool__search_context` |

## Workflow Commands

### Code Review
```javascript
const workflow = require('./backend/services/multiModelWorkflow');
await workflow.codeReview(context, issue);
```

### Feature Development
```javascript
await workflow.developFeature(requirement, context);
```

### Debug
```javascript
await workflow.debug(issue, errorLog);
```

### API Design
```javascript
await workflow.designAPI(resource, operations);
```

### Schema Design
```javascript
await workflow.designSchema(entity, fields);
```

## MCP Tools

### Ace-Tool (Codebase Search)
```
mcp__ace-tool__search_context({
  project_root_path: "D:/core/code/IoSC-Student-Teacher-main",
  query: "自然语言查询"
})
```

### Grok-Search (Web Search)
```
mcp__grok-search__web_search({ query: "搜索内容" })
mcp__grok-search__web_fetch({ url: "URL" })
```

## Usage Examples

### Phase 1: Context Retrieval
```
Use ace-tool to retrieve relevant code context
```

### Phase 2: Multi-Model Analysis
```
Route A (Frontend): Gemini for UI/UX
Route B (Backend): Gemini for logic
```

### Phase 3: Implementation
```
Based on analysis, implement code
```

### Phase 4: Audit
```
Review code with both models
```
