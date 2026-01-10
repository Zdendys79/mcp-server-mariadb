# MCP Server MariaDB - Project Configuration

**Inherits from:** `/home/zdendys/CLAUDE.md`

---

## Project Overview

MCP (Model Context Protocol) server for MariaDB/MySQL databases. Enables Claude Code to interact with databases through a secure, standardized interface.

**GitHub Repository:** https://github.com/Zdendys79/mcp-server-mariadb

---

## Configuration Strategy

### Multi-Instance Setup (CRITICAL!)

This server supports **multiple simultaneous instances** to connect to different databases. This is the recommended approach when working with:
- Local database + remote database
- Multiple database servers
- Development + production environments

### Zdendys' Setup

**Environment:**
- **Local MySQL:** Port 3306 (native MySQL service)
- **Remote MySQL (base7):** Port 3336 (SSH tunnel to zdendys79.website)

**Global Configuration:** `~/.claude.json`

```json
{
  "mcpServers": {
    "mariadb-local": {
      "command": "node",
      "args": ["/home/zdendys/mcp-servers/mariadb/dist/index.js"],
      "env": {
        "DB_HOST": "127.0.0.1",
        "DB_PORT": "3306",
        "DB_USER": "claude",
        "DB_PASS": "***",
        "DB_NAME": "local_db"
      }
    },
    "mariadb-base7": {
      "command": "node",
      "args": ["/home/zdendys/mcp-servers/mariadb/dist/index.js"],
      "env": {
        "DB_HOST": "127.0.0.1",
        "DB_PORT": "3336",
        "DB_USER": "claude",
        "DB_PASS": "***",
        "DB_NAME": "dh_scribe"
      }
    }
  }
}
```

**SSH Tunnel Setup:**
```bash
# Tunnel maintained by systemd service or manual command:
ssh -L 3336:localhost:3306 zdendys@zdendys79.website -N -f
```

### Environment Variables

Priority: **Explicit env vars → Defaults**

- `DB_HOST` - Database host (default: `127.0.0.1`)
- `DB_PORT` - Database port (default: `3306`)
- `DB_USER` - Database username (default: `claude_mcp`)
- `DB_PASS` - Database password (default: empty)
- `DB_NAME` - **NEW!** Auto-select database on startup (optional)

### DB_NAME Behavior (IMPORTANT!)

**With `DB_NAME` set (non-empty):**
- Database is **automatically selected** on server startup
- Tools (`list_tables`, `describe_table`, `execute_sql`) work immediately
- **No need to call `switch_database`** unless you want to change to a different database
- `switch_database` can override this at any time to select different database

**With `DB_NAME` empty or not set:**
- No database selected initially
- **Must call `switch_database` once** before using database-specific tools
- After calling `switch_database`, that database remains active
- No need to call `switch_database` again unless changing to different database

**Priority:** `switch_database` tool > `DB_NAME` env variable
- `DB_NAME` sets the **initial** database
- `switch_database` **overrides** and changes active database
- New database remains active until next `switch_database` call

---

## Development Workflow

### Building

```bash
npm run build
```

**Auto-versioning:**
- Version set from git commit hash (short, 7 chars) - e.g., `d4346ce`
- Fallback: timestamp `YYYY-MM-DD-HH-MM-SS` if not in git repository
- See `scripts/update-version.sh`
- Version updated automatically on every build

### Testing Locally

```bash
# Start server (stdio mode for MCP)
npm start

# Or run directly
node dist/index.js
```

### Deployment

After changes:
1. Build: `npm run build`
2. Restart Claude Code (or reconnect MCP: `/mcp`)
3. Verify with: Check MCP tools availability

---

## Code Quality Standards

**From global CLAUDE.md:**
- Progress reporting: Tasks >30s MUST print every 60s (TIME-BASED!)
- Resume support: All long operations must support resume
- Database storage: Write intermediate results immediately
- Type safety: Full TypeScript typing
- Error handling: Graceful error messages
- Security: NO credentials in logs/console

**Project-specific:**
- Connection pooling: Max 10 connections
- Timeout: Configurable via `MCP_TIMEOUT` env var (default: 30000ms)
- SQL injection prevention: Use parameterized queries where possible

---

## Documentation Requirements

**Before committing:**
- [ ] README.md updated
- [ ] CHANGELOG.md version entry added
- [ ] This file (CLAUDE.md) reflects current state
- [ ] Example configurations tested

**Auto-update package.json version:**
- Handled by `prebuild` script
- Don't edit version manually!

---

## Security Notes

**Credentials Storage (IMPORTANT!):**

**✅ SAFE - Credentials in global config:**
- `~/.claude.json` is OUTSIDE project directory
- NOT versioned in git
- Only accessible to your user account
- **This is the RECOMMENDED approach for most users**

**⚠️ ADVANCED - Environment variables:**
- `~/.profile` or `~/.config/environment.d/*.conf`
- Useful for multi-tool credential sharing
- Requires wrapper scripts (see README Advanced Configuration)

**❌ NEVER - Project files:**
- DON'T store credentials in project directories
- DON'T commit credentials to git repositories
- DON'T hardcode credentials in source code

**Conversation safety:**
- NEVER output passwords/tokens in conversation
- NEVER log credentials to files or console
- Claude Code session recordings may be audited

**Database Permissions:**
- Create dedicated MCP user with minimal permissions
- Grant only necessary privileges (SELECT, INSERT, etc.)
- Avoid using root/admin accounts

**Example:**
```sql
CREATE USER 'claude'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE ON database.* TO 'claude'@'localhost';
FLUSH PRIVILEGES;
```

**SSH Tunnels:**
- Use SSH tunnels for remote database connections
- Keeps traffic encrypted
- Example: `ssh -L 3336:localhost:3306 user@remote-server -N -f`

---

## Common Issues

### "No database selected" Error

**Solution:**
- Add `DB_NAME` to env configuration, OR
- Call `switch_database` tool before queries

### Connection Refused (ECONNREFUSED)

**Check:**
1. MySQL/MariaDB is running: `systemctl status mysql`
2. Port is correct (3306 local, 3336 tunnel)
3. SSH tunnel is active (for remote): `ps aux | grep ssh`

### Permission Denied (ER_ACCESS_DENIED_ERROR)

**Check:**
1. Username/password correct
2. User has permission from host: `SHOW GRANTS FOR 'claude'@'localhost'`
3. Firewall rules allow connection

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

**Current Version:** Auto-generated from build timestamp

---

**Last Updated:** 2025-01-10
**Maintainer:** Zdendys (zdendys79.website)
