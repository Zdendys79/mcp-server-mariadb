#!/bin/bash
# MCP MariaDB Wrapper - loads credentials from environment

# Load credentials from .bashrc or custom file
if [ -f "$HOME/.config/mariadb-mcp.env" ]; then
    source "$HOME/.config/mariadb-mcp.env"
fi

# Export variables for MCP server (if not already exported)
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_USER="${DB_USER:-$MARIADB_USER}"
export DB_PASS="${DB_PASS:-$MARIADB_PASSWORD}"
export DB_NAME="${DB_NAME:-$MARIADB_DATABASE}"

# Start MCP server
exec node "$(dirname "$0")/dist/index.js"
