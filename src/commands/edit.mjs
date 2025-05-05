import chalk from "chalk";
import inquirer from "inquirer";
import { getPosts, getPostById, updatePost, logAction } from "../utils/db.mjs";
import { getConfig } from "../utils/config.mjs";

/**
 * Edit a draft post by index
 * @param {Object} argv - Command arguments
 */
export const editPost = async (argv) => {
  try {
    // Get unpublished posts
    const posts = getPosts({ published: false });

    if (posts.length === 0) {
      console.log(chalk.yellow("No unpublished posts found to edit."));
      console.log(
        chalk.gray("Run"),
        chalk.cyan("socialite create"),
        chalk.gray("to create a new post.")
      );
      return;
    }

    // Determine which post to edit
    let postIndex = argv.index;

    // If no index provided, prompt user to select a post
    if (postIndex === undefined) {
      const { selectedIndex } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedIndex",
          message: "Select a post to edit:",
          choices: posts.map((post, index) => ({
            name: `[${index + 1}] ${
              post.title || "No title"
            } - ${post.content.substring(0, 40)}...`,
            value: index + 1,
          })),
        },
      ]);

      postIndex = selectedIndex;
    }

    // Validate post index
    if (postIndex < 1 || postIndex > posts.length) {
      console.error(
        chalk.red(`Invalid post index. Must be between 1 and ${posts.length}.`)
      );
      process.exit(1);
    }

    // Get post by ID
    const post = getPostById(posts[postIndex - 1].id);

    if (!post) {
      console.error(chalk.red("Post not found."));
      process.exit(1);
    }

    // Function to handle multiline input
    const getMultilineInput = async (prompt, defaultText) => {
      console.log(`${prompt} (Type 'EOF' on a new line when done)`);
      console.log(`Current content: ${defaultText}`);
      console.log("Enter new content:");

      let lines = [];

      // Set up recursive prompt for multiline input
      const promptLine = async () => {
        const { input } = await inquirer.prompt([
          {
            type: "input",
            name: "input",
            message: ">",
          },
        ]);

        if (input === "EOF") {
          return lines.length > 0 ? lines.join("\n") : defaultText;
        }

        lines.push(input);
        return promptLine();
      };

      return promptLine();
    };

    // Ask if user wants to edit with multiline input
    const { useMultiline } = await inquirer.prompt([
      {
        type: "confirm",
        name: "useMultiline",
        message: "Would you like to edit content with multiline input?",
        default: true,
      },
    ]);

    // Get title
    const { title } = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Edit title:",
        default: post.title || "",
      },
    ]);

    // Get content based on user preference
    let content;
    if (useMultiline) {
      content = await getMultilineInput("Edit content:", post.content);
    } else {
      const result = await inquirer.prompt([
        {
          type: "input",
          name: "content",
          message: "Edit content:",
          default: post.content,
        },
      ]);
      content = result.content;
    }

    // Get publish date and platforms
    const { publishDate, platforms } = await inquirer.prompt([
      {
        type: "input",
        name: "publishDate",
        message: "Edit publish date (YYYY-MM-DD):",
        default: post.publish_date || "",
        validate: (input) => {
          if (!input) return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(input)
            ? true
            : "Please use YYYY-MM-DD format";
        },
      },
      {
        type: "checkbox",
        name: "platforms",
        message: "Select platforms to publish to:",
        choices: [
          // { name: 'Twitter', value: 'Twitter', checked: post.platforms && post.platforms.includes('Twitter') },
          {
            name: "Bluesky",
            value: "Bluesky",
            checked: post.platforms && post.platforms.includes("Bluesky"),
          },
          // { name: 'TikTok', value: 'TikTok', checked: post.platforms && post.platforms.includes('TikTok') },
          // { name: 'Instagram', value: 'Instagram', checked: post.platforms && post.platforms.includes('Instagram') },
          // { name: 'LinkedIn', value: 'LinkedIn', checked: post.platforms && post.platforms.includes('LinkedIn') }
        ],
      },
    ]);

    const config = getConfig();

    // Update post in database
    const updatedPost = {
      title,
      content,
      platforms: platforms.join(","),
      publish_date: publishDate,
    };

    const success = updatePost(post.id, updatedPost);

    if (success) {
      // Log the action
      logAction("post_edited", {
        postId: post.id,
        title: title,
      });

      console.log(chalk.green("\n✓ Post updated successfully!"));
      console.log(
        chalk.gray("Run"),
        chalk.cyan("socialite unpublished"),
        chalk.gray("to see your updated post.")
      );
      console.log(
        chalk.gray("Run"),
        chalk.cyan("socialite publish"),
        chalk.gray("to publish eligible posts.")
      );
    } else {
      console.error(chalk.red("Failed to update post."));
    }
  } catch (error) {
    console.error(chalk.red("Error editing post:"), error.message);
    console.error(error);
    process.exit(1);
  }
};
