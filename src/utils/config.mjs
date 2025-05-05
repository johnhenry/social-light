import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Default configuration
const defaultConfig = {
  dbPath: '~/.socialite/socialite.db',
  defaultPlatforms: ['Bluesky'],
  aiEnabled: true,
  credentials: {
    openai: {
      apiKey: ''
    },
    bluesky: {
      handle: '',
      password: '',
      service: 'https://bsky.social'
    }
  }
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

/**
 * Get credentials from config
 * @param {string} platform - Platform name (e.g., 'bluesky', 'openai')
 * @returns {Object} Credentials object
 * @example
 * const blueskyCredentials = getCredentials('bluesky');
 */
export const getCredentials = (platform) => {
  const config = getConfig();
  return config.credentials?.[platform.toLowerCase()] || {};
};

/**
 * Update credentials in config
 * @param {string} platform - Platform name (e.g., 'bluesky', 'openai')
 * @param {Object} credentials - Credentials object
 * @returns {Object} Updated config
 * @example
 * const updatedConfig = updateCredentials('bluesky', { handle: 'user.bsky.social', password: 'apppassword' });
 */
export const updateCredentials = (platform, credentials) => {
  const config = getConfig();
  
  // Ensure credentials object exists
  if (!config.credentials) {
    config.credentials = {};
  }
  
  // Update credentials for the platform
  config.credentials[platform.toLowerCase()] = {
    ...config.credentials[platform.toLowerCase()],
    ...credentials
  };
  
  // Save updated config
  fs.writeJsonSync(getConfigPath(), config, { spaces: 2 });
  
  return config;
};
