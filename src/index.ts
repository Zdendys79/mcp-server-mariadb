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

// Environment variables
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = parseInt(process.env.DB_PORT || "3306");
const DB_USER = process.env.DB_USER || "claude_mcp";
const DB_PASS = process.env.DB_PASS || "";

// Current database (no default - must be set via switch_database)
let currentDatabase: string | null = null;

// Create MySQL connection pool (without database)
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
                text: "Error: No database selected. Use switch_database tool first.",
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
                text: JSON.stringify(rows, null, 2),
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
                text: "Error: No database selected. Use switch_database tool first.",
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
                text: JSON.stringify(rows, null, 2),
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
                text: "Error: No database selected. Use switch_database tool first.",
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
                text: JSON.stringify(rows, null, 2),
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
                text: JSON.stringify(rows, null, 2),
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
                text: `Successfully switched to database: ${database}`,
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
                ? `Current database: ${currentDatabase}`
                : "No database selected. Use switch_database tool first.",
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MariaDB MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
