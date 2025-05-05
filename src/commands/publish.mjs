import chalk from 'chalk';
import ora from 'ora';
import cron from 'node-cron';
import { getPosts, markAsPublished, logAction } from '../utils/db.mjs';
import { getSocialAPI } from '../utils/social/index.mjs';

/**
 * Check if a post is eligible for publishing
 * @param {Object} post - Post object
 * @returns {boolean} True if post is eligible for publishing
 */
const isEligibleForPublishing = (post) => {
  // If no publish date specified, it's eligible immediately
  if (!post.publish_date) {
    return true;
  }
  
  // Check if publish date is today or in the past
  const publishDate = new Date(post.publish_date);
  const now = new Date();
  
  // Reset time to compare dates only
  publishDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return publishDate <= now;
};

/**
 * Publish eligible posts once
 * @returns {Promise<Array>} Array of published post IDs
 */
const publishEligiblePosts = async () => {
  // Get unpublished posts
  const posts = getPosts({ published: false });
  
  // Filter eligible posts
  const eligiblePosts = posts.filter(isEligibleForPublishing);
  
  if (eligiblePosts.length === 0) {
    return [];
  }
  
  // Initialize social API
  const socialAPI = getSocialAPI();
  
  // Track published post IDs
  const publishedPostIds = [];
  
  // Publish each eligible post
  for (const post of eligiblePosts) {
    try {
      // Skip posts with no platforms
      if (!post.platforms || post.platforms.trim() === '') {
        console.log(chalk.yellow(`Skipping post ID ${post.id}: No platforms specified`));
        continue;
      }
      
      // Prepare platforms array
      const platforms = post.platforms.split(',').map(p => p.trim());
      
      // Publish post to specified platforms
      const result = await socialAPI.post({
        text: post.content,
        title: post.title,
        platforms,
        // Add more options as needed
      });
      
      // If post was successfully published to at least one platform, mark as published
      const anySuccess = Object.values(result.results).some(r => r.success);
      
      if (anySuccess) {
        markAsPublished(post.id);
        publishedPostIds.push(post.id);
        
        // Log the action with platform results
        logAction('post_published', {
          postId: post.id,
          platforms: result.results,
          title: post.title
        });
        
        console.log(chalk.green(`✓ Published post ID ${post.id} to platforms: ${Object.keys(result.results).filter(p => result.results[p].success).join(', ')}`));
      } else {
        console.log(chalk.red(`✗ Failed to publish post ID ${post.id} to any platform`));
        
        // Log failures
        for (const [platform, platformResult] of Object.entries(result.results)) {
          if (!platformResult.success) {
            console.log(chalk.red(`  - ${platform}: ${platformResult.error}`));
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error publishing post ID ${post.id}:`), error.message);
    }
  }
  
  return publishedPostIds;
};

/**
 * Publish posts command handler
 * @param {Object} argv - Command arguments
 */
export const publishPosts = async (argv) => {
  // Check if continuous mode is enabled
  if (argv.continuous) {
    console.log(chalk.cyan('Starting continuous publishing mode...'));
    console.log(chalk.gray('Press Ctrl+C to stop'));
    
    // Initial publish
    await runContinuousPublish();
    
    // Set up cron job to run every minute
    cron.schedule('* * * * *', async () => {
      await runContinuousPublish();
    });
    
    // Keep process alive
    process.stdin.resume();
  } else {
    // One-time publish
    const spinner = ora('Publishing eligible posts...').start();
    
    try {
      const publishedPostIds = await publishEligiblePosts();
      
      if (publishedPostIds.length === 0) {
        spinner.info('No eligible posts found for publishing.');
      } else {
        spinner.succeed(`Published ${publishedPostIds.length} post(s) successfully!`);
        console.log(chalk.gray('Run'), chalk.cyan('socialite published'), chalk.gray('to see published posts.'));
      }
    } catch (error) {
      spinner.fail(`Error publishing posts: ${error.message}`);
      console.error(error);
    }
  }
};

/**
 * Run continuous publish cycle
 */
const runContinuousPublish = async () => {
  try {
    // Get current time for logging
    const now = new Date().toLocaleTimeString();
    
    console.log(chalk.gray(`[${now}] Checking for posts to publish...`));
    
    const publishedPostIds = await publishEligiblePosts();
    
    if (publishedPostIds.length > 0) {
      console.log(chalk.green(`[${now}] Published ${publishedPostIds.length} post(s) successfully!`));
    } else {
      console.log(chalk.gray(`[${now}] No eligible posts found for publishing.`));
    }
  } catch (error) {
    console.error(chalk.red('Error in publishing cycle:'), error.message);
  }
};
