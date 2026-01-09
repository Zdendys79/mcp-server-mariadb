#!/bin/bash
# MCP Server wrapper for MariaDB
# Provides stdio interface for Claude Code

set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-your_user}"
DB_PASS="${DB_PASS:-your_password}"
DB_NAME="${DB_NAME:-your_database}"

# Function to execute SQL and return JSON
execute_sql() {
    local query="$1"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        --batch --skip-column-names --raw \
        -e "$query" 2>&1
}

# MCP Protocol - read JSON from stdin, execute, return JSON
while IFS= read -r line; do
    # Parse JSON request (simple implementation)
    if echo "$line" | grep -q '"method"'; then
        method=$(echo "$line" | grep -o '"method":"[^"]*"' | cut -d'"' -f4)

        if [ "$method" = "tools/list" ]; then
            # Return available tools
            cat <<'EOF'
{
  "tools": [
    {
      "name": "execute_sql",
      "description": "Execute SQL query on MariaDB database",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "SQL query to execute"
          },
          "database": {
            "type": "string",
            "description": "Database name (optional)"
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "list_tables",
      "description": "List all tables in the current database",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "describe_table",
      "description": "Show structure of a table",
      "inputSchema": {
        "type": "object",
        "properties": {
          "table": {
            "type": "string",
            "description": "Table name"
          }
        },
        "required": ["table"]
      }
    }
  ]
}
EOF
        elif [ "$method" = "tools/call" ]; then
            # Extract tool name and arguments
            tool_name=$(echo "$line" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

            if [ "$tool_name" = "list_tables" ]; then
                result=$(execute_sql "SHOW TABLES;")
                echo "{\"content\":[{\"type\":\"text\",\"text\":\"$result\"}]}"

            elif [ "$tool_name" = "describe_table" ]; then
                table=$(echo "$line" | grep -o '"table":"[^"]*"' | cut -d'"' -f4)
                result=$(execute_sql "DESCRIBE $table;")
                echo "{\"content\":[{\"type\":\"text\",\"text\":\"$result\"}]}"

            elif [ "$tool_name" = "execute_sql" ]; then
                query=$(echo "$line" | sed -n 's/.*"query":"\([^"]*\)".*/\1/p')
                result=$(execute_sql "$query")
                echo "{\"content\":[{\"type\":\"text\",\"text\":\"$result\"}]}"
            fi
        fi
    fi
done
