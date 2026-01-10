#!/bin/bash
# MCP MariaDB Wrapper - LOCAL database (port 3306)

# Load credentials
if [ -f "$HOME/.config/mariadb-mcp.env" ]; then
    source "$HOME/.config/mariadb-mcp.env"
fi

# Set specific values for LOCAL instance
export DB_HOST="${MARIADB_LOCAL_HOST:-127.0.0.1}"
export DB_PORT="${MARIADB_LOCAL_PORT:-3306}"
export DB_USER="${MARIADB_LOCAL_USER:-claude}"
export DB_PASS="${MARIADB_LOCAL_PASS}"
export DB_NAME="${MARIADB_LOCAL_DB}"

# Start MCP server
exec node "$(dirname "$0")/dist/index.js"
