import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Default configuration
const defaultConfig = {
  dbPath: '~/.socialite/socialite.db',
  defaultPlatforms: [],
  aiEnabled: true
};

/**
 * Get config file path
 * @returns {string} Path to config file
 * @example
 * const configPath = getConfigPath();
 */
export const getConfigPath = () => {
  return path.join(os.homedir(), '.socialite', 'config.json');
};

/**
 * Check if config exists
 * @returns {boolean} True if config exists
 * @example
 * const exists = configExists();
 */
export const configExists = () => {
  return fs.existsSync(getConfigPath());
};

/**
 * Create default config
 * @returns {Object} Created config object
 * @example
 * const config = createDefaultConfig();
 */
export const createDefaultConfig = () => {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  
  fs.ensureDirSync(configDir);
  fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
  
  return defaultConfig;
};

/**
 * Get current config, creating default if it doesn't exist
 * @returns {Object} Config object
 * @example
 * const config = getConfig();
 * console.log(config.aiEnabled);
 */
export const getConfig = () => {
  if (!configExists()) {
    return createDefaultConfig();
  }
  
  return fs.readJsonSync(getConfigPath());
};

/**
 * Update config
 * @param {Object} updates - Config fields to update
 * @returns {Object} Updated config
 * @example
 * const updatedConfig = updateConfig({ aiEnabled: false });
 */
export const updateConfig = (updates) => {
  const config = getConfig();
  const newConfig = { ...config, ...updates };
  
  fs.writeJsonSync(getConfigPath(), newConfig, { spaces: 2 });
  
  return newConfig;
};
