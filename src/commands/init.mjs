import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

import { createDefaultConfig, configExists, updateConfig } from '../utils/config.mjs';
import { initializeDb } from '../utils/db.mjs';

/**
 * Initialize the Socialite application
 * @param {Object} argv - Command arguments
 * @example
 * await initialize({ force: true });
 */
export const initialize = async (argv) => {
  const spinner = ora('Initializing Socialite...').start();
  
  try {
    const exists = configExists();
    
    // If config already exists and not forcing re-init, prompt for confirmation
    if (exists && !argv.force) {
      spinner.stop();
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Socialite is already initialized. Reinitialize with default settings?',
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
      
      spinner.start('Reinitializing Socialite...');
    }
    
    // Create default config
    const config = createDefaultConfig();
    
    // Configure platforms
    spinner.text = 'Setting up platforms...';
    const { platforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Select default platforms:',
        choices: [
          { name: 'Twitter', value: 'Twitter' },
          { name: 'Bluesky', value: 'Bluesky' },
          { name: 'TikTok', value: 'TikTok' },
          { name: 'Instagram', value: 'Instagram' },
          { name: 'LinkedIn', value: 'LinkedIn' }
        ]
      }
    ]);
    
    // Update config with selected platforms
    updateConfig({ defaultPlatforms: platforms });
    
    // Initialize database
    spinner.text = 'Setting up database...';
    initializeDb();
    
    spinner.succeed('Socialite initialized successfully!');
    
    // Display configuration summary
    console.log('\n', chalk.cyan('Configuration:'));
    console.log(` ${chalk.gray('•')} ${chalk.bold('Database path:')} ${config.dbPath}`);
    console.log(` ${chalk.gray('•')} ${chalk.bold('Default platforms:')} ${platforms.join(', ') || 'None'}`);
    console.log(` ${chalk.gray('•')} ${chalk.bold('AI features:')} ${config.aiEnabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    
    console.log('\n', chalk.green('✓'), 'You\'re all set! Get started with', chalk.cyan('socialite create'));
    console.log(chalk.gray('  Need help? Run'), chalk.cyan('socialite --help'));
    
  } catch (error) {
    spinner.fail(`Initialization failed: ${error.message}`);
    console.error(chalk.red('Error details:'), error);
    process.exit(1);
  }
};
