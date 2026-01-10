# MCP Server for MariaDB/MySQL

A Model Context Protocol (MCP) server that provides database access to MariaDB and MySQL databases. This server enables Claude Code and other MCP clients to interact with your databases through a secure, standardized interface.

## Features

- **Database Operations**: Execute SQL queries, list tables, and inspect table structures
- **Multiple Database Support**: Switch between databases on the same connection
- **Secure Connection**: Support for both local and remote database connections
- **MCP Standard Compliance**: Built with official `@modelcontextprotocol/sdk`
- **TypeScript**: Fully typed for better development experience

## Installation

### From source

```bash
git clone https://github.com/Zdendys79/mcp-server-mariadb.git
cd mcp-server-mariadb
npm install
npm run build
```

## Configuration

### Claude Code Configuration

Add this to your Claude Code configuration file (`.claude.json` or MCP config):

```json
{
  "mcpServers": {
    "mariadb": {
      "command": "node",
      "args": ["/path/to/mcp-server-mariadb/dist/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USER": "your_database_user",
        "DB_PASS": "your_database_password",
        "DB_NAME": "your_database_name"
      }
    }
  }
}
```

### Multiple Database Connections

You can configure multiple MCP server instances to connect to different databases simultaneously. This is useful when working with both local and remote databases, or multiple database servers.

**Example: Local database + SSH-tunneled remote database**

```json
{
  "mcpServers": {
    "mariadb-local": {
      "command": "node",
      "args": ["/home/user/mcp-servers/mariadb/dist/index.js"],
      "env": {
        "DB_HOST": "127.0.0.1",
        "DB_PORT": "3306",
        "DB_USER": "local_user",
        "DB_PASS": "local_password",
        "DB_NAME": "local_database"
      }
    },
    "mariadb-remote": {
      "command": "node",
      "args": ["/home/user/mcp-servers/mariadb/dist/index.js"],
      "env": {
        "DB_HOST": "127.0.0.1",
        "DB_PORT": "3336",
        "DB_USER": "remote_user",
        "DB_PASS": "remote_password",
        "DB_NAME": "remote_database"
      }
    }
  }
}
```

**Note:** When using SSH tunnels, set up the tunnel first:
```bash
ssh -L 3336:localhost:3306 user@remote-server -N -f
```

Then configure the MCP server to connect to `127.0.0.1:3336`.

### Environment Variables

- `DB_HOST` - Database host (default: `127.0.0.1`)
- `DB_PORT` - Database port (default: `3306`)
- `DB_USER` - Database username (required)
- `DB_PASS` - Database password (optional, defaults to empty string)
- `DB_NAME` - Database name (optional)
  - **If set (non-empty):** Database is automatically selected on startup - no need to call `switch_database`
  - **If empty or not set:** You must use the `switch_database` tool before executing queries

## Available Tools

### `list_databases`

Lists all available databases on the server.

```
No parameters required
```

### `switch_database`

Switches to a different database. **Must be called before executing queries.**

```json
{
  "database": "your_database_name"
}
```

### `get_current_database`

Returns the currently selected database name.

```
No parameters required
```

### `list_tables`

Lists all tables in the currently selected database.

```
No parameters required
```

**Note:** Requires a database to be selected (either via `DB_NAME` env var or `switch_database` tool).

### `describe_table`

Shows the structure of a specific table.

```json
{
  "table": "table_name"
}
```

**Note:** Requires a database to be selected (either via `DB_NAME` env var or `switch_database` tool).

### `execute_sql`

Executes a SQL query on the currently selected database.

```json
{
  "query": "SELECT * FROM users LIMIT 10"
}
```

**Note:** Requires a database to be selected (either via `DB_NAME` env var or `switch_database` tool).

## Usage Example

Once configured, you can use Claude Code to interact with your database:

```
You: Show me all tables in the 'production' database

Claude: [Uses switch_database tool with database="production"]
        [Uses list_tables tool]
        Here are the tables in your production database:
        - users
        - orders
        - products
        ...

You: What's the structure of the users table?

Claude: [Uses describe_table tool with table="users"]
        The users table has the following columns:
        - id (INT, PRIMARY KEY)
        - username (VARCHAR(255))
        - email (VARCHAR(255))
        ...
```

## Security Considerations

### Database Credentials

- **Never commit credentials**: Use environment variables or secure configuration management
- **Use read-only users**: Consider creating a dedicated database user with limited permissions
- **Network security**: Use SSH tunnels or VPNs for remote database connections

### Example: SSH Tunnel Setup

For secure remote access, set up an SSH tunnel:

```bash
ssh -L 3306:localhost:3306 user@remote-server
```

Then configure the MCP server to connect to `localhost:3306`.

### Recommended Database User Permissions

Create a dedicated user with minimal permissions:

```sql
CREATE USER 'mcp_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT ON your_database.* TO 'mcp_user'@'localhost';
GRANT SHOW DATABASES ON *.* TO 'mcp_user'@'localhost';
FLUSH PRIVILEGES;
```

Adjust permissions based on your needs (add `INSERT`, `UPDATE`, `DELETE` if required).

## Development

### Building

```bash
npm run build
```

### Running locally

```bash
npm start
```

### Project Structure

```
mcp-server-mariadb/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── examples/
│   └── legacy/           # Legacy bash implementation
├── .mcp.json.template    # Configuration template
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Connection Issues

**Error: `ER_ACCESS_DENIED_ERROR`**
- Check your `DB_USER` and `DB_PASS` environment variables
- Verify the user has permission to connect from your host

**Error: `ECONNREFUSED`**
- Check if MariaDB/MySQL is running
- Verify `DB_HOST` and `DB_PORT` are correct
- Check firewall rules

### "No database selected" Error

You must call the `switch_database` tool before using `list_tables`, `describe_table`, or `execute_sql`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [mysql2](https://github.com/sidorares/node-mysql2) for database connectivity

## Support

- **Issues**: https://github.com/Zdendys79/mcp-server-mariadb/issues
- **Discussions**: https://github.com/Zdendys79/mcp-server-mariadb/discussions

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.
