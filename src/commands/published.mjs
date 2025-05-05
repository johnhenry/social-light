import chalk from "chalk";
import { getPosts } from "../utils/db.mjs";

/**
 * Format post content for display
 * @param {string} content - Post content
 * @param {number} maxLength - Maximum length to display
 * @returns {string} Formatted content
 */
const formatContent = (content, maxLength = 60) => {
  if (!content) return "";
  const trimmed = content.replace(/\s+/g, " ").trim();
  return trimmed.length > maxLength
    ? trimmed.substring(0, maxLength) + "..."
    : trimmed;
};

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "No date";

  try {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today or yesterday
    if (date.toDateString() === today.toDateString()) {
      return chalk.green("Today");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return chalk.yellow("Yesterday");
    }

    // Format as YYYY-MM-DD
    return date.toISOString().split("T")[0];
  } catch (error) {
    return dateStr; // Fallback to raw date string
  }
};

/**
 * List all published posts
 * @param {Object} argv - Command arguments
 */
export const listPublished = async (argv) => {
  try {
    // Get published posts from database
    const posts = getPosts({ published: true });

    if (posts.length === 0) {
      console.log(chalk.yellow("No published posts found."));
      console.log(
        chalk.gray("Run"),
        chalk.cyan("social-light publish"),
        chalk.gray("to publish eligible posts.")
      );
      return;
    }

    console.log(chalk.cyan(`\nPublished Posts (${posts.length}):`));
    console.log(chalk.gray("─".repeat(80)));

    // Display each post with index and details
    posts.forEach((post, index) => {
      const postNumber = chalk.bold(`[${index + 1}]`);
      const postDate = formatDate(post.publish_date);
      const postTitle = chalk.white(post.title || "No title");
      const postContent = formatContent(post.content);
      const postPlatforms = post.platforms
        ? chalk.blue(post.platforms)
        : chalk.gray("No platforms");

      console.log(`${postNumber} ${postDate} ${postTitle}`);
      console.log(`    ${chalk.gray(postContent)}`);
      console.log(`    ${postPlatforms}`);
      console.log(chalk.gray("─".repeat(80)));
    });

    console.log("");
  } catch (error) {
    console.error(chalk.red("Error listing published posts:"), error.message);
    console.error(error);
    process.exit(1);
  }
};
