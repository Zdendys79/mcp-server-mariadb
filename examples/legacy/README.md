# Legacy Bash Implementation

This directory contains the original bash-based prototype of the MCP server.

## ⚠️ Deprecated

This implementation is **deprecated** and kept only for historical reference. It has several limitations:

- **Security Issues**: No proper SQL escaping, vulnerable to SQL injection
- **Limited Features**: Basic MCP protocol implementation
- **No Error Handling**: Minimal error recovery
- **Maintenance**: No longer maintained or supported

## Use the TypeScript Version Instead

Please use the current TypeScript implementation in the main project directory (`src/index.ts`), which provides:

- ✅ Full MCP SDK compliance
- ✅ Proper SQL parameterization
- ✅ Error handling and connection pooling
- ✅ Type safety with TypeScript
- ✅ Active maintenance and support

## Historical Context

The bash script (`mcp-mariadb.sh`) was created as a quick prototype to test the MCP protocol with MariaDB. It served its purpose for initial development but was replaced with a production-ready TypeScript implementation.

If you're interested in how MCP works at a basic level, this script can serve as a learning resource, but **do not use it in production**.
