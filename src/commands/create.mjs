import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import os from 'os';

import { getConfig, configExists } from '../utils/config.mjs';
import { createPost as dbCreatePost, logAction, initializeDb } from '../utils/db.mjs';
import { generateTitle, suggestPublishDate, enhanceContent } from '../utils/ai.mjs';

/**
 * Create a new social media post
 * @param {Object} argv - Command arguments
 * @example
 * await createPost({ file: 'my-post.txt' });
 */
export const createPost = async (argv) => {
  const config = getConfig();
  let content = '';
  
  try {
    // Check if initialized and initialize if needed
    if (!configExists()) {
      console.log(chalk.yellow('Socialite is not initialized yet.'));
      console.log('Initializing with default settings...');
      
      // Create config directory
      const configDir = path.join(os.homedir(), '.socialite');
      fs.ensureDirSync(configDir);
      
      // Initialize database
      const dbInitialized = initializeDb();
      if (!dbInitialized) {
        throw new Error('Failed to initialize database');
      }
    }
    // File-based creation
    if (argv.file) {
      const spinner = ora(`Reading file ${argv.file}...`).start();
      
      try {
        content = await fs.readFile(argv.file, 'utf8');
        spinner.succeed(`File ${argv.file} loaded successfully!`);
      } catch (error) {
        spinner.fail(`Failed to read file: ${error.message}`);
        process.exit(1);
      }
    } 
    // Interactive creation
    else {
      // Function to handle multiline input
      const getMultilineInput = async (prompt) => {
        console.log(`${prompt} (Type 'EOF' on a new line when done)`)
        let lines = [];
        let line = '';
        
        // Set up recursive prompt for multiline input
        const promptLine = async () => {
          const { input } = await inquirer.prompt([
            {
              type: 'input',
              name: 'input',
              message: '>' 
            }
          ]);
          
          if (input === 'EOF') {
            return lines.join('\n');
          }
          
          lines.push(input);
          return promptLine();
        };
        
        return promptLine();
      };
      
      // Ask if user wants multiline input
      const { useMultiline } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useMultiline',
          message: 'Would you like to enter multiline content?',
          default: true
        }
      ]);
      
      // Get content based on user preference
      let postContent;
      if (useMultiline) {
        postContent = await getMultilineInput('Enter your post content:');
      } else {
        const result = await inquirer.prompt([
          {
            type: 'input',
            name: 'postContent',
            message: 'Enter your post content:',
            validate: input => input.trim().length > 0 ? true : 'Content cannot be empty'
          }
        ]);
        postContent = result.postContent;
      }
      
      content = postContent;
    }
    
    // Generate title with AI or prompt for manual entry
    let spinner = ora('Generating title suggestion...').start();
    let title = '';
    
    if (config.aiEnabled) {
      title = await generateTitle(content);
      spinner.succeed('Title suggestion generated');
    } else {
      spinner.info('AI is disabled, skipping title generation');
    }
    
    // Allow manual title override
    const { titleInput } = await inquirer.prompt([
      {
        type: 'input',
        name: 'titleInput',
        message: 'Enter post title (or press Enter to use suggestion):',
        default: title,
      }
    ]);
    
    title = titleInput;
    
    // Generate publish date with AI or prompt for manual entry
    spinner = ora('Suggesting publish date...').start();
    let publishDate = '';
    
    if (config.aiEnabled) {
      publishDate = await suggestPublishDate();
      spinner.succeed(`Suggested publish date: ${publishDate}`);
    } else {
      spinner.info('AI is disabled, skipping date suggestion');
    }
    
    // Allow manual date override
    const { dateInput } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dateInput',
        message: 'Enter publish date (YYYY-MM-DD) or press Enter to use suggestion:',
        default: publishDate,
        validate: input => {
          if (!input) return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(input) ? true : 'Please use YYYY-MM-DD format';
        }
      }
    ]);
    
    publishDate = dateInput;
    
    // Select platforms
    const { selectedPlatforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedPlatforms',
        message: 'Select platforms to publish to:',
        choices: [
          { name: 'Twitter', value: 'Twitter', checked: config.defaultPlatforms.includes('Twitter') },
          { name: 'Bluesky', value: 'Bluesky', checked: config.defaultPlatforms.includes('Bluesky') },
          { name: 'TikTok', value: 'TikTok', checked: config.defaultPlatforms.includes('TikTok') },
          { name: 'Instagram', value: 'Instagram', checked: config.defaultPlatforms.includes('Instagram') },
          { name: 'LinkedIn', value: 'LinkedIn', checked: config.defaultPlatforms.includes('LinkedIn') }
        ]
      }
    ]);
    
    const platforms = selectedPlatforms.join(',');
    
    // Option to enhance content for the primary platform
    if (config.aiEnabled && selectedPlatforms.length > 0) {
      const primaryPlatform = selectedPlatforms[0];
      
      const { enhance } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enhance',
          message: `Would you like AI to enhance your content for ${primaryPlatform}?`,
          default: false
        }
      ]);
      
      if (enhance) {
        spinner = ora(`Enhancing content for ${primaryPlatform}...`).start();
        const enhancedContent = await enhanceContent(content, primaryPlatform);
        
        if (enhancedContent !== content) {
          spinner.succeed('Content enhanced');
          
          // Show the original and enhanced versions
          console.log('\n', chalk.cyan('Original:'), chalk.gray(content));
          console.log('\n', chalk.cyan('Enhanced:'), chalk.white(enhancedContent));
          
          const { useEnhanced } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'useEnhanced',
              message: 'Use the enhanced version?',
              default: true
            }
          ]);
          
          if (useEnhanced) {
            content = enhancedContent;
          }
        } else {
          spinner.info('No significant enhancements suggested');
        }
      }
    }
    
    // Create post in database
    spinner = ora('Saving post...').start();
    
    const postId = dbCreatePost({
      title,
      content,
      platforms,
      publish_date: publishDate
    });
    
    // Log the action
    logAction('post_created', {
      postId,
      title,
      platforms: selectedPlatforms,
      publishDate
    });
    
    spinner.succeed(`Post created successfully with ID: ${postId}`);
    
    // Summary
    console.log('\n', chalk.cyan('Post Summary:'));
    console.log(` ${chalk.gray('•')} ${chalk.bold('Title:')} ${title}`);
    console.log(` ${chalk.gray('•')} ${chalk.bold('Platforms:')} ${platforms || 'None'}`);
    console.log(` ${chalk.gray('•')} ${chalk.bold('Publish Date:')} ${publishDate || 'Not scheduled'}`);
    console.log(` ${chalk.gray('•')} ${chalk.bold('Content:')} ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    
    console.log('\n', chalk.green('✓'), 'Post created successfully!');
    console.log(chalk.gray('  Run'), chalk.cyan('socialite unpublished'), chalk.gray('to see your scheduled posts'));
    
  } catch (error) {
    console.error(chalk.red('Error creating post:'), error.message);
    console.error(error);
    process.exit(1);
  }
};
