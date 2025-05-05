import chalk from 'chalk';
import { getPosts } from '../utils/db.mjs';

/**
 * Format post content for display
 * @param {string} content - Post content
 * @param {number} maxLength - Maximum length to display
 * @returns {string} Formatted content
 */
const formatContent = (content, maxLength = 60) => {
  if (!content) return '';
  const trimmed = content.replace(/\s+/g, ' ').trim();
  return trimmed.length > maxLength
    ? trimmed.substring(0, maxLength) + '...'
    : trimmed;
};

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'No date';
  
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return chalk.green('Today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return chalk.yellow('Tomorrow');
    }
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateStr; // Fallback to raw date string
  }
};

/**
 * List all unpublished posts
 * @param {Object} argv - Command arguments
 */
export const listUnpublished = async (argv) => {
  try {
    // Get unpublished posts from database
    const posts = getPosts({ published: false });
    
    if (posts.length === 0) {
      console.log(chalk.yellow('No unpublished posts found.'));
      console.log(chalk.gray('Run'), chalk.cyan('socialite create'), chalk.gray('to create a new post.'));
      return;
    }
    
    console.log(chalk.cyan(`\nUnpublished Posts (${posts.length}):`));
    console.log(chalk.gray('─'.repeat(80)));
    
    // Display each post with index and details
    posts.forEach((post, index) => {
      const postNumber = chalk.bold(`[${index + 1}]`);
      const postDate = formatDate(post.publish_date);
      const postTitle = chalk.white(post.title || 'No title');
      const postContent = formatContent(post.content);
      const postPlatforms = post.platforms ? chalk.blue(post.platforms) : chalk.gray('No platforms');
      
      console.log(`${postNumber} ${postDate} ${postTitle}`);
      console.log(`    ${chalk.gray(postContent)}`);
      console.log(`    ${postPlatforms}`);
      console.log(chalk.gray('─'.repeat(80)));
    });
    
    // Display helpful commands
    console.log('');
    console.log(`${chalk.green('✓')} Use ${chalk.cyan('socialite edit [index]')} to edit a post.`);
    console.log(`${chalk.green('✓')} Use ${chalk.cyan('socialite publish')} to publish all eligible posts.`);
    console.log('');
  } catch (error) {
    console.error(chalk.red('Error listing unpublished posts:'), error.message);
    console.error(error);
    process.exit(1);
  }
};
