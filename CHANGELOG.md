# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-20

### Added
- Initial release of MCP Server for MariaDB/MySQL
- Full MCP (Model Context Protocol) compliance using `@modelcontextprotocol/sdk`
- Database operation tools:
  - `list_databases` - List all available databases
  - `switch_database` - Switch to a different database
  - `get_current_database` - Get currently selected database
  - `list_tables` - List tables in current database
  - `describe_table` - Show table structure
  - `execute_sql` - Execute SQL queries
- TypeScript implementation with full type safety
- Connection pooling for better performance
- Support for both MariaDB and MySQL databases
- Comprehensive documentation with security best practices
- Configuration template (`.mcp.json.template`)
- MIT License

### Security
- Database name must be explicitly selected using `switch_database` tool
- Connection credentials via environment variables
- No default database connection (prevents accidental data access)

## [Unreleased]

### Planned Features
- Query result pagination
- Transaction support
- Prepared statements
- Connection health checks
- Multi-database session management
- Query timeout configuration
- Result format options (JSON, CSV, etc.)

---

[1.0.0]: https://github.com/Zdendys79/mcp-server-mariadb/releases/tag/v1.0.0
