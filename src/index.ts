#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const VERSION = packageJson.version || "unknown";

// ============================================================================
// Configuration Constants
// ============================================================================

// Database connection settings
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = parseInt(process.env.DB_PORT || "3306");
const DB_USER = process.env.DB_USER || "claude_mcp";
const DB_PASS = process.env.DB_PASS || "";
const DB_NAME = process.env.DB_NAME || null;

// Connection pool settings
const POOL_CONNECTION_LIMIT = parseInt(process.env.POOL_CONNECTION_LIMIT || "10");
const POOL_QUEUE_LIMIT = parseInt(process.env.POOL_QUEUE_LIMIT || "0");
const POOL_WAIT_FOR_CONNECTIONS = process.env.POOL_WAIT_FOR_CONNECTIONS !== "false";

// Output formatting
const JSON_INDENT = 2;

// Error messages
const ERROR_MESSAGES = {
  NO_DATABASE: "Error: No database selected. Use switch_database tool first.",
  DATABASE_SWITCHED: (db: string) => `Successfully switched to database: ${db}`,
  CURRENT_DATABASE: (db: string) => `Current database: ${db}`,
  NO_DATABASE_INFO: "No database selected. Use switch_database tool first.",
  UNKNOWN_TOOL: (name: string) => `Unknown tool: ${name}`,
  ERROR: (msg: string) => `Error: ${msg}`,
  SERVER_RUNNING: "MariaDB MCP server running on stdio",
  FATAL_ERROR: "Fatal error:",
} as const;

// Current database (can be set via DB_NAME env var, or via switch_database tool)
let currentDatabase: string | null = DB_NAME;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format data as JSON string for output
 */
function formatJSON(data: any): string {
  return JSON.stringify(data, null, JSON_INDENT);
}

// ============================================================================
// Database Connection Pool
// ============================================================================

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  waitForConnections: POOL_WAIT_FOR_CONNECTIONS,
  connectionLimit: POOL_CONNECTION_LIMIT,
  queueLimit: POOL_QUEUE_LIMIT,
});

// Create MCP server
const server = new Server(
  {
    name: "mariadb-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "execute_sql",
        description: "Execute a SQL query on the MariaDB database",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL query to execute (SELECT, INSERT, UPDATE, DELETE, etc.)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the current database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "describe_table",
        description: "Show the structure of a table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Name of the table to describe",
            },
          },
          required: ["table"],
        },
      },
      {
        name: "list_databases",
        description: "List all available databases",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "switch_database",
        description: "Switch to a different database. Must be called before executing queries.",
        inputSchema: {
          type: "object",
          properties: {
            database: {
              type: "string",
              description: "Name of the database to switch to",
            },
          },
          required: ["database"],
        },
      },
      {
        name: "get_current_database",
        description: "Get the name of the currently selected database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let connection;
    let result;

    switch (name) {
      case "execute_sql": {
        if (!currentDatabase) {
          return {
            content: [
              {
                type: "text",
                text: ERROR_MESSAGES.NO_DATABASE,
              },
            ],
            isError: true,
          };
        }

        const query = (args as { query: string }).query;
        connection = await pool.getConnection();

        try {
          await connection.query(`USE ${currentDatabase}`);
          const [rows] = await connection.query(query);
          connection.release();

          return {
            content: [
              {
                type: "text",
                text: formatJSON(rows),
              },
            ],
          };
        } catch (error) {
          connection.release();
          throw error;
        }
      }

      case "list_tables": {
        if (!currentDatabase) {
          return {
            content: [
              {
                type: "text",
                text: ERROR_MESSAGES.NO_DATABASE,
              },
            ],
            isError: true,
          };
        }

        connection = await pool.getConnection();

        try {
          await connection.query(`USE ${currentDatabase}`);
          const [rows] = await connection.query("SHOW TABLES");
          connection.release();

          return {
            content: [
              {
                type: "text",
                text: formatJSON(rows),
              },
            ],
          };
        } catch (error) {
          connection.release();
          throw error;
        }
      }

      case "describe_table": {
        if (!currentDatabase) {
          return {
            content: [
              {
                type: "text",
                text: ERROR_MESSAGES.NO_DATABASE,
              },
            ],
            isError: true,
          };
        }

        const table = (args as { table: string }).table;
        connection = await pool.getConnection();

        try {
          await connection.query(`USE ${currentDatabase}`);
          const [rows] = await connection.query(`DESCRIBE ${table}`);
          connection.release();

          return {
            content: [
              {
                type: "text",
                text: formatJSON(rows),
              },
            ],
          };
        } catch (error) {
          connection.release();
          throw error;
        }
      }

      case "list_databases": {
        connection = await pool.getConnection();

        try {
          const [rows] = await connection.query("SHOW DATABASES");
          connection.release();

          return {
            content: [
              {
                type: "text",
                text: formatJSON(rows),
              },
            ],
          };
        } catch (error) {
          connection.release();
          throw error;
        }
      }

      case "switch_database": {
        const database = (args as { database: string }).database;
        connection = await pool.getConnection();

        try {
          // Test if database exists and is accessible
          await connection.query(`USE ${database}`);
          connection.release();

          // Set current database
          currentDatabase = database;

          return {
            content: [
              {
                type: "text",
                text: ERROR_MESSAGES.DATABASE_SWITCHED(database),
              },
            ],
          };
        } catch (error) {
          connection.release();
          throw error;
        }
      }

      case "get_current_database": {
        return {
          content: [
            {
              type: "text",
              text: currentDatabase
                ? ERROR_MESSAGES.CURRENT_DATABASE(currentDatabase)
                : ERROR_MESSAGES.NO_DATABASE_INFO,
            },
          ],
        };
      }

      default:
        throw new Error(ERROR_MESSAGES.UNKNOWN_TOOL(name));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: ERROR_MESSAGES.ERROR(errorMessage),
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Server Startup
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(ERROR_MESSAGES.SERVER_RUNNING);
}

main().catch((error) => {
  console.error(ERROR_MESSAGES.FATAL_ERROR, error);
  process.exit(1);
});
