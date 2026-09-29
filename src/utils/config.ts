/**
 * Configuration utilities
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Config, ConfigSchema } from '../types';

// Get config path - always in the same directory as the script
const getConfigPath = (): string => {
  const cwdConfig = path.join(process.cwd(), 'config.json');
  const projectConfig = path.join(__dirname, '../../config.json');
  
  // If config exists in current directory, use it
  if (fs.existsSync(cwdConfig)) {
    return cwdConfig;
  }

  // If config exists in project root and not in cwd, copy it
  if (fs.existsSync(projectConfig) && process.cwd() !== path.dirname(projectConfig)) {
    try {
      fs.copyFileSync(projectConfig, cwdConfig);
      console.log(`✓ Config disalin ke: ${cwdConfig}`);
      return cwdConfig;
    } catch (error) {
      console.log(`⚠ Gagal menyalin config, menggunakan dari project root`);
      return projectConfig;
    }
  }

  // Try other locations
  const locations = [
    cwdConfig,
    projectConfig,
    path.join(process.env.APPDATA || '', 'strak', 'config.json')
  ];

  for (const location of locations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  // Default to current directory
  return cwdConfig;
};

const CONFIG_PATH = getConfigPath();

/**
 * Load configuration from config.json
 */
export function loadConfig(): Config {
  // Create default config if not exists
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = {
      apiKey: '',
      baseUrl: '',
      model: ''
    };
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(CONFIG_PATH));
    fs.writeJsonSync(CONFIG_PATH, defaultConfig, { spaces: 2 });
    
    console.log(`Created config.json at: ${CONFIG_PATH}`);
    
    return defaultConfig as Config;
  }

  try {
    const config = fs.readJsonSync(CONFIG_PATH);
    return config as Config;
  } catch (error) {
    throw new Error(`Failed to load config.json from ${CONFIG_PATH}: ${error}`);
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): boolean {
  if (!config.apiKey || !config.baseUrl || !config.model) {
    return false;
  }

  return true;
}

/**
 * Save configuration to config.json
 */
export function saveConfig(config: Config): void {
  try {
    fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
  } catch (error) {
    throw new Error(`Failed to save config.json: ${error}`);
  }
}

/**
 * Get config file path
 */
export function getConfigFilePath(): string {
  return CONFIG_PATH;
}
