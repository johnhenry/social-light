import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import path from "path";
import os from "os";

import { getConfig, configExists } from "../utils/config.mjs";
import {
  createPost as dbCreatePost,
  logAction,
  initializeDb,
} from "../utils/db.mjs";
import {
  generateTitle,
  suggestPublishDate,
  enhanceContent,
} from "../utils/ai.mjs";

/**
 * Create a new social media post
 * @param {Object} argv - Command arguments
 * @example
 * await createPost({ file: 'my-post.txt' });
 */
export const createPost = async (argv) => {
  const config = getConfig();
  let content = "";

  try {
    // Check if initialized and initialize if needed
    if (!configExists()) {
      console.log(chalk.yellow("Social Light is not initialized yet."));
      console.log("Initializing with default settings...");

      // Create config directory
      const configDir = path.join(os.homedir(), ".social-light");
      fs.ensureDirSync(configDir);

      // Initialize database
      const dbInitialized = initializeDb();
      if (!dbInitialized) {
        throw new Error("Failed to initialize database");
      }
    }
    // File-based creation
    if (argv.file) {
      const spinner = ora(`Reading file ${argv.file}...`).start();

      try {
        content = await fs.readFile(argv.file, "utf8");
        spinner.succeed(`File ${argv.file} loaded successfully!`);
      } catch (error) {
        spinner.fail(`Failed to read file: ${error.message}`);
        process.exit(1);
      }
    }
    // Interactive creation
    else {
      // Function to handle input with 3 empty lines to end
      const getContentInput = async (prompt) => {
        console.log(`${prompt} (Press Enter 3 times in a row when done)`);
        let lines = [];
        let emptyLineCount = 0;

        // Set up recursive prompt for input
        const promptLine = async () => {
          const { input } = await inquirer.prompt([
            {
              type: "input",
              name: "input",
              message: ">",
            },
          ]);

          // Check for empty line
          if (input.trim() === "") {
            emptyLineCount++;

            // If we have 3 consecutive empty lines, we're done
            if (emptyLineCount >= 2) {
              // Remove the last empty lines (if any) from the result
              while (
                lines.length > 0 &&
                lines[lines.length - 1].trim() === ""
              ) {
                lines.pop();
              }
              console.log(chalk.green("\n✓ Content input complete"));
              return lines.join("\n");
            }
          } else {
            // Reset empty line counter when non-empty input is received
            emptyLineCount = 0;
          }

          lines.push(input);
          return promptLine();
        };

        return promptLine();
      };

      // Get post content
      content = await getContentInput("Enter your post content:");
    }

    // Generate title with AI or prompt for manual entry
    let spinner = ora("Generating title suggestion...").start();
    let title = "";

    if (config.aiEnabled) {
      title = await generateTitle(content);
      spinner.succeed("Title suggestion generated");
    } else {
      spinner.info("AI is disabled, skipping title generation");
    }

    // Allow manual title override
    const { titleInput } = await inquirer.prompt([
      {
        type: "input",
        name: "titleInput",
        message: "Enter post title (or press Enter to use suggestion):",
        default: title,
      },
    ]);

    title = titleInput;

    // Generate publish date with AI or prompt for manual entry
    spinner = ora("Suggesting publish date and time...").start();
    let publishDateTime = "";

    if (config.aiEnabled) {
      publishDateTime = await suggestPublishDate();
      spinner.succeed(`Suggested publish date and time: ${publishDateTime}`);
    } else {
      spinner.info("AI is disabled, skipping date/time suggestion");
      // Provide default as tomorrow at noon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      publishDateTime = `${tomorrow.toISOString().split('T')[0]} 12:00`;
    }

    // Parse suggested date/time
    let suggestedDate = "";
    let suggestedTime = "";
    
    if (publishDateTime.includes(" ")) {
      [suggestedDate, suggestedTime] = publishDateTime.split(" ");
    } else {
      suggestedDate = publishDateTime;
      suggestedTime = "12:00";
    }

    // Allow manual date override
    const { dateInput } = await inquirer.prompt([
      {
        type: "input",
        name: "dateInput",
        message:
          "Enter publish date (YYYY-MM-DD) or press Enter to use suggestion:",
        default: suggestedDate,
        validate: (input) => {
          if (!input) return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(input)
            ? true
            : "Please use YYYY-MM-DD format";
        },
      },
    ]);
    
    // Allow manual time override with flexible input
    const { timeInput } = await inquirer.prompt([
      {
        type: "input",
        name: "timeInput",
        message:
          "Enter publish time (HH:MM, H:MM, HH:MMam/pm or just 'Xpm') or press Enter to use suggestion:",
        default: suggestedTime,
        validate: (input) => {
          if (!input) return true;
          
          // Support various formats
          // 24-hour format: 13:45, 9:30
          if (/^\d{1,2}:\d{2}$/.test(input)) return true;
          
          // 12-hour with am/pm: 1:45pm, 9:30am
          if (/^\d{1,2}:\d{2}(am|pm)$/i.test(input)) return true;
          
          // Simple hour with am/pm: 3pm, 11am
          if (/^\d{1,2}(am|pm)$/i.test(input)) return true;
          
          // Just hour: 13, 9 (assumes on the hour)
          if (/^\d{1,2}$/.test(input)) return true;
          
          return "Please enter a valid time format";
        },
      },
    ]);
    
    // Convert time input to standardized 24-hour format
    let standardizedTime = timeInput;
    
    // Process different time formats
    if (/^\d{1,2}(am|pm)$/i.test(timeInput)) {
      // Format like "3pm"
      const isPM = timeInput.toLowerCase().includes("pm");
      let hour = parseInt(timeInput.replace(/[^0-9]/g, ""));
      
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      
      standardizedTime = `${hour.toString().padStart(2, "0")}:00`;
    } else if (/^\d{1,2}:\d{2}(am|pm)$/i.test(timeInput)) {
      // Format like "3:30pm"
      const isPM = timeInput.toLowerCase().includes("pm");
      const timeParts = timeInput.replace(/[^0-9:]/g, "").split(":");
      let hour = parseInt(timeParts[0]);
      const minute = timeParts[1];
      
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      
      standardizedTime = `${hour.toString().padStart(2, "0")}:${minute}`;
    } else if (/^\d{1,2}$/.test(timeInput)) {
      // Format like "15" (just hour)
      const hour = parseInt(timeInput);
      standardizedTime = `${hour.toString().padStart(2, "0")}:00`;
    }
    
    // Combine date and time
    publishDateTime = `${dateInput} ${standardizedTime}`;

    // Select platforms
    const { selectedPlatforms } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedPlatforms",
        message: "Select platforms to publish to:",
        choices: [
          {
            name: "Bluesky",
            value: "Bluesky",
            checked: config.defaultPlatforms.includes("Bluesky"),
          },
        ],
      },
    ]);

    const platforms = selectedPlatforms.join(",");

    // Option to enhance content for the primary platform
    if (config.aiEnabled && selectedPlatforms.length > 0) {
      const primaryPlatform = selectedPlatforms[0];

      const { enhance } = await inquirer.prompt([
        {
          type: "confirm",
          name: "enhance",
          message: `Would you like AI to enhance your content for ${primaryPlatform}?`,
          default: false,
        },
      ]);

      if (enhance) {
        spinner = ora(`Enhancing content for ${primaryPlatform}...`).start();
        const enhancedContent = await enhanceContent(content, primaryPlatform);

        if (enhancedContent !== content) {
          spinner.succeed("Content enhanced");

          // Show the original and enhanced versions
          console.log("\n", chalk.cyan("Original:"), chalk.gray(content));
          console.log(
            "\n",
            chalk.cyan("Enhanced:"),
            chalk.white(enhancedContent)
          );

          const { useEnhanced } = await inquirer.prompt([
            {
              type: "confirm",
              name: "useEnhanced",
              message: "Use the enhanced version?",
              default: true,
            },
          ]);

          if (useEnhanced) {
            content = enhancedContent;
          }
        } else {
          spinner.info("No significant enhancements suggested");
        }
      }
    }

    // Create post in database
    spinner = ora("Saving post...").start();

    const postId = dbCreatePost({
      title,
      content,
      platforms,
      publish_date: publishDateTime,
    });

    // Log the action
    logAction("post_created", {
      postId,
      title,
      platforms: selectedPlatforms,
      publishDate: publishDateTime,
    });

    spinner.succeed(`Post created successfully with ID: ${postId}`);

    // Summary
    console.log("\n", chalk.cyan("Post Summary:"));
    console.log(` ${chalk.gray("•")} ${chalk.bold("Title:")} ${title}`);
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("Platforms:")} ${platforms || "None"}`
    );
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("Publish Date & Time:")} ${
        publishDateTime || "Not scheduled"
      }`
    );
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("Content:")} ${content.substring(
        0,
        50
      )}${content.length > 50 ? "..." : ""}`
    );

    console.log("\n", chalk.green("✓"), "Post created successfully!");
    console.log(
      chalk.gray("  Run"),
      chalk.cyan("social-light list"),
      chalk.gray("to see your scheduled posts")
    );
  } catch (error) {
    console.error(chalk.red("Error creating post:"), error.message);
    console.error(error);
    process.exit(1);
  }
};
