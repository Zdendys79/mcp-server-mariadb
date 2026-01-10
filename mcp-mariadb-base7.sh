#!/bin/bash
# MCP MariaDB Wrapper - BASE7 remote database (SSH tunnel on port 3336)

# Load credentials
if [ -f "$HOME/.config/mariadb-mcp.env" ]; then
    source "$HOME/.config/mariadb-mcp.env"
fi

# Set specific values for BASE7 instance
export DB_HOST="${MARIADB_BASE7_HOST:-127.0.0.1}"
export DB_PORT="${MARIADB_BASE7_PORT:-3336}"
export DB_USER="${MARIADB_BASE7_USER:-claude}"
export DB_PASS="${MARIADB_BASE7_PASS}"
export DB_NAME="${MARIADB_BASE7_DB}"

# Start MCP server
exec node "$(dirname "$0")/dist/index.js"
