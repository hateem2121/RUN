# 🎯 MCP Server Setup Guide - Model Context Protocol

## What are MCP Servers?

MCP (Model Context Protocol) is Anthropic's open-source framework (Nov 2024) that standardizes how AI assistants connect to external tools, databases, and services. Think of MCP servers as plugins for your AI coding assistant.

---

## 🔥 Essential Free MCP Servers for Your Stack

### 1. **PostgreSQL MCP Server** ⭐⭐⭐

**Why**: Direct database access for your Neon PostgreSQL database

```bash
# Installation
npm install -g @modelcontextprotocol/server-postgres

# Usage (in AI assistant config)
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "args": ["postgresql://your-neon-connection-string"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

**Capabilities**:
- Query your database directly from AI chat
- Schema inspection
- Data analysis
- Migration assistance

---

### 2. **Filesystem MCP Server** ⭐⭐⭐

**Why**: Enhanced file operations beyond standard tools

```bash
# Installation
npm install -g @modelcontextprotocol/server-filesystem

# Usage
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/Users/hateemjamshaid/Downloads/RUN-Remix"]
    }
  }
}
```

**Capabilities**:
- Advanced file search
- Bulk file operations
- Directory tree analysis
- File monitoring

---

### 3. **Git MCP Server** ⭐⭐

**Why**: Git operations through AI conversation

```bash
# Installation
npm install -g @modelcontextprotocol/server-git

# Usage
{
  "mcpServers": {
    "git": {
      "command": "mcp-server-git",
      "args": ["/Users/hateemjamshaid/Downloads/RUN-Remix"]
    }
  }
}
```

**Capabilities**:
- Commit history analysis
- Branch management
- Diff viewing
- Merge conflict resolution assistance

---

### 4. **GitHub MCP Server** ⭐⭐

**Why**: GitHub API integration for issues, PRs, releases

```bash
# Installation
npm install -g @modelcontextprotocol/server-github

# Usage (requires GitHub token)
{
  "mcpServers": {
    "github": {
      "command": "mcp-server-github",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**Capabilities**:
- Create/manage issues
- Review pull requests
- Repository insights
- Release management

---

### 5. **Brave Search MCP Server** ⭐

**Why**: Web search capabilities for documentation lookup

```bash
# Installation
npm install -g @modelcontextprotocol/server-brave-search

# Usage (requires Brave API key - free tier available)
{
  "mcpServers": {
    "brave-search": {
      "command": "mcp-server-brave-search",
      "env": {
        "BRAVE_API_KEY": "your_api_key"
      }
    }
  }
}
```

**Capabilities**:
- Search documentation
- Find similar code examples
- Research best practices

---

### 6. **Neon MCP Server** ⭐⭐⭐

**Why**: Specialized management for Neon Postgres (branching, projects, API operations)

```bash
# Usage (requires Neon API Key)
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-neon"],
      "env": {
        "NEON_API_KEY": "your_neon_api_key"
      }
    }
  }
}
```

**Capabilities**:
- Create/delete branches
- Manage projects
- Run migrations via branching workflow

---

### 7. **Google Cloud MCP Server** ⭐⭐

**Why**: Manage GCP resources via gcloud CLI

```bash
# Usage (requires gcloud CLI authenticated)
{
  "mcpServers": {
    "gcloud": {
      "command": "npx",
      "args": ["-y", "@google-cloud/gcloud-mcp"]
    }
  }
}
```

**Capabilities**:
- Inspect Cloud Storage buckets
- Check Cloud Run services
- Query BigQuery datasets


## 🚀 Installation Steps

### Step 1: Install MCP Servers Globally

```bash
# Install all essential servers
npm install -g @modelcontextprotocol/server-postgres \
               @modelcontextprotocol/server-filesystem \
               @modelcontextprotocol/server-git \
               @modelcontextprotocol/server-github
```

### Step 2: Configure Your AI Assistant

The configuration location depends on your AI assistant:

#### For Claude Desktop (Anthropic)
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "args": ["$DATABASE_URL"]
    },
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/Users/hateemjamshaid/Downloads/RUN-Remix"]
    },
    "git": {
      "command": "mcp-server-git",
      "args": ["/Users/hateemjamshaid/Downloads/RUN-Remix"]
    }
  }
}
```

#### For Other AI Assistants
Check your assistant's documentation for MCP configuration location.

### Step 3: Restart Your AI Assistant

After configuration, restart your AI assistant to load the MCP servers.

---

## 💡 Additional Useful MCP Servers

### For Your Tech Stack:

- **`@modelcontextprotocol/server-memory`** - Persistent AI memory across conversations
- **`@modelcontextprotocol/server-fetch`** - HTTP requests for API testing
- **`@modelcontextprotocol/server-sequential-thinking`** - Enhanced reasoning for complex problems
- **`@modelcontextprotocol/server-puppeteer`** - Browser automation (for testing your UI)

### For Cloud Development:

- **Google Cloud MCP** (if available) - GCS, Cloud Run management
- **AWS MCP** (community) - S3, Lambda operations

---

## 🎯 Practical Use Cases for Your Project

### Database Migrations with PostgreSQL MCP
```
You: "Show me the schema for the products table"
AI: [Uses PostgreSQL MCP to query information_schema]

You: "What's the data distribution in the media_library table?"
AI: [Runs SELECT COUNT(*) GROUP BY queries]
```

### Code Analysis with Filesystem MCP
```
You: "Find all files that import from @shared/schema"
AI: [Uses filesystem MCP for advanced search]

You: "What's the total size of our 3D model files?"
AI: [Calculates size of .gltf files]
```

### Git History with Git MCP
```
You: "When was the cache optimization implemented?"
AI: [Searches commit history for relevant changes]

You: "Show me all changes to storage.ts in the last month"
AI: [Uses git log with file-specific filtering]
```

---

## 📊 MCP vs Standard Tools

| Capability | Without MCP | With MCP |
|------------|-------------|----------|
| Database queries | Manual SQL execution | "Show me the schema" |
| File search | grep, find commands | Natural language search |
| Git history | git log parsing | Conversational history analysis |
| Code analysis | Manual inspection | "Find all uses of X" |

---

## 🔒 Security Considerations

1. **Database Access**: MCP servers have full read/write access to configured databases
   - Use read-only connection strings when possible
   - Don't share MCP configs with sensitive credentials

2. **File System**: Filesystem MCP can access any files in specified directories
   - Limit to project directory only
   - Don't grant access to home directory

3. **GitHub Token**: Use minimal scope tokens
   - Recommended scopes: `repo`, `read:org`
   - Regularly rotate tokens

---

## ❓ Troubleshooting

### MCP Server Not Responding
```bash
# Test if server is installed
which mcp-server-postgres

# Manually test the server
mcp-server-postgres "postgresql://test"
```

### Configuration Not Loading
- Check JSON syntax in config file
- Ensure absolute paths are used
- Restart AI assistant completely

### Permission Errors
```bash
# Fix npm global install permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

## 🎓 Learning Resources

- **Official MCP Docs**: https://modelcontextprotocol.io
- **Server List**: https://github.com/modelcontextprotocol/servers
- **Community Servers**: https://github.com/topics/mcp-server

---

## ✅ Recommended Setup for RUN-Remix

Based on your project, install these 3 essential MCP servers:

1. ✅ **PostgreSQL** - For database operations
2. ✅ **Filesystem** - For advanced code search
3. ✅ **Git** - For commit history analysis

**Installation command**:
```bash
npm install -g @modelcontextprotocol/server-postgres \
               @modelcontextprotocol/server-filesystem \
               @modelcontextprotocol/server-git \
               @modelcontextprotocol/server-neon \
               @google-cloud/gcloud-mcp
```

Then configure them in your AI assistant pointing to:
- **Postgres**: Your Neon database URL (from `.env`)
- **Filesystem**: `/Users/hateemjamshaid/Downloads/RUN-Remix`
- **Git**: `/Users/hateemjamshaid/Downloads/RUN-Remix`

---

Ready to enhance your AI-assisted development! 🚀
