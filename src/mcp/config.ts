/**
 * MCP Configuration Loader
 * Compatible with Claude Code's mcp.json format
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { MCPConfig } from '../types/mcp.js';

/**
 * Get MCP config path
 */
function getMCPConfigPath(): string {
  // Try multiple locations (similar to config.json)
  const locations = [
    path.join(process.cwd(), '.strak', 'mcp.json'),           // .strak/mcp.json in cwd
    path.join(process.cwd(), 'mcp.json'),                     // mcp.json in cwd
    path.join(__dirname, '../../.strak', 'mcp.json'),         // .strak/mcp.json in project root
    path.join(__dirname, '../../mcp.json'),                   // mcp.json in project root
    path.join(process.env.HOME || '', '.strak', 'mcp.json')   // ~/.strak/mcp.json
  ];

  for (const location of locations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  // Default to project root .strak folder
  return path.join(__dirname, '../../.strak', 'mcp.json');
}

/**
 * Load MCP configuration
 */
export function loadMCPConfig(): MCPConfig {
  const configPath = getMCPConfigPath();

  // Return empty config if not found
  if (!fs.existsSync(configPath)) {
    console.log('ℹ️  No MCP configuration found');
    return { mcpServers: {} };
  }

  try {
    const config = fs.readJsonSync(configPath);
    console.log(`✅ Loaded MCP config from: ${configPath}`);
    return config;
  } catch (error: any) {
    console.error(`❌ Failed to load MCP config:`, error.message);
    return { mcpServers: {} };
  }
}

/**
 * Save MCP configuration
 */
export function saveMCPConfig(config: MCPConfig): void {
  const configPath = getMCPConfigPath();

  try {
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    console.log(`✅ Saved MCP config to: ${configPath}`);
  } catch (error: any) {
    console.error(`❌ Failed to save MCP config:`, error.message);
  }
}

/**
 * Create default MCP config
 */
export function createDefaultMCPConfig(): MCPConfig {
  return {
    mcpServers: {
      // Example server configurations
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        disabled: true  // Disabled by default
      },
      'fetch': {
        command: 'uvx',
        args: ['mcp-server-fetch'],
        env: {
          FASTMCP_LOG_LEVEL: 'ERROR'
        },
        disabled: true
      }
    }
  };
}

/**
 * Get MCP config file path for display
 */
export function getMCPConfigFilePath(): string {
  return getMCPConfigPath();
}
