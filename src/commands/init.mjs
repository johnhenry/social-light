import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import os from "os";
import dotenv from "dotenv";

import {
  createDefaultConfig,
  configExists,
  updateConfig,
  updateCredentials,
} from "../utils/config.mjs";
import { initializeDb } from "../utils/db.mjs";

// Load environment variables
dotenv.config();

/**
 * Initialize the Social Light application
 * @param {Object} argv - Command arguments
 * @example
 * await initialize({ force: true });
 */
export const initialize = async (argv) => {
  const spinner = ora("Initializing Social Light...").start();

  try {
    const exists = configExists();

    // If config already exists and not forcing re-init, prompt for confirmation
    if (exists && !argv.force) {
      spinner.stop();

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Social Light is already initialized. Reinitialize with default settings?",
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Initialization cancelled."));
        return;
      }

      spinner.start("Reinitializing Social Light...");
    }

    // Create default config
    const config = createDefaultConfig();

    // Initialize database first
    spinner.text = "Setting up database...";
    const dbInitialized = initializeDb();

    if (!dbInitialized) {
      throw new Error("Failed to initialize database");
    }

    // Configure platforms
    spinner.text = "Setting up platforms...";

    // Bluesky is the only platform we support
    const platforms = ["Bluesky"];

    // Check if we need to collect Bluesky credentials
    spinner.text = "Checking Bluesky credentials...";
    spinner.stop();

    // Get existing credentials from .env, if available
    const blueskyHandle = process.env.BLUESKY_HANDLE || "";
    const blueskyPassword = process.env.BLUESKY_APP_PASSWORD || "";
    const blueskyService = process.env.BLUESKY_SERVICE || "https://bsky.social";

    console.log(chalk.cyan("\nBluesky Account Setup"));
    console.log(
      chalk.gray("Create an app password in your Bluesky account settings")
    );

    const { collectCredentials } = await inquirer.prompt([
      {
        type: "confirm",
        name: "collectCredentials",
        message: "Would you like to set up your Bluesky credentials now?",
        default: true,
      },
    ]);

    let blueskyCredentials = {};

    if (collectCredentials) {
      blueskyCredentials = await inquirer.prompt([
        {
          type: "input",
          name: "handle",
          message: "Enter your Bluesky handle (username with .bsky.social):",
          default: blueskyHandle,
          validate: (input) =>
            input.includes(".")
              ? true
              : "Handle should include domain (e.g., username.bsky.social)",
        },
        {
          type: "password",
          name: "password",
          message:
            "Enter your Bluesky app password (created in your Bluesky account settings):",
          mask: "*",
          validate: (input) =>
            input.length > 0 ? true : "Password cannot be empty",
        },
        {
          type: "input",
          name: "service",
          message: "Enter your Bluesky service URL:",
          default: blueskyService,
        },
      ]);

      // Save credentials to .env file
      const envPath = path.join(process.cwd(), ".env");
      let envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf8")
        : "";

      // Parse existing .env content
      const envLines = envContent.split("\n");
      const envMap = {};

      envLines.forEach((line) => {
        if (line.includes("=")) {
          const [key, value] = line.split("=");
          envMap[key.trim()] = value.trim();
        }
      });

      // Update with new credentials
      envMap["BLUESKY_HANDLE"] = blueskyCredentials.handle;
      envMap["BLUESKY_APP_PASSWORD"] = blueskyCredentials.password;
      envMap["BLUESKY_SERVICE"] = blueskyCredentials.service;

      // Save to config.json as well
      updateCredentials("bluesky", {
        handle: blueskyCredentials.handle,
        password: blueskyCredentials.password,
        service: blueskyCredentials.service,
      });

      // If OpenAI key doesn't exist, prompt for it
      let openaiKey = envMap["OPENAI_API_KEY"] || "";
      if (!openaiKey) {
        const response = await inquirer.prompt([
          {
            type: "input",
            name: "openaiKey",
            mask: "*",
            message:
              "Enter your OpenAI API key for AI features (press Enter to skip):",
          },
        ]);

        if (response.openaiKey) {
          openaiKey = response.openaiKey;
          envMap["OPENAI_API_KEY"] = openaiKey;
        }
      }

      // Save OpenAI key to config.json
      if (openaiKey) {
        updateCredentials("openai", {
          apiKey: openaiKey,
        });
      }

      // Convert map back to env string
      const newEnvContent = Object.entries(envMap)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      // Write to .env file
      fs.writeFileSync(envPath, newEnvContent);

      console.log(
        chalk.green("\n✓ Credentials saved to .env file and config.json")
      );
    }

    spinner.start("Updating configuration...");

    // Update config with selected platforms
    updateConfig({ defaultPlatforms: platforms });

    // Initialize database
    spinner.text = "Setting up database...";
    initializeDb();

    spinner.succeed("Social Light initialized successfully!");

    // Display configuration summary
    console.log("\n", chalk.cyan("Configuration:"));
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("Database path:")} ${config.dbPath}`
    );
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("Default platforms:")} ${
        platforms.join(", ") || "None"
      }`
    );
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("AI features:")} ${
        config.aiEnabled ? chalk.green("Enabled") : chalk.red("Disabled")
      }`
    );

    // Display credentials info
    const hasOpenAI = Boolean(
      process.env.OPENAI_API_KEY || config.credentials?.openai?.apiKey
    );
    const hasBluesky = Boolean(
      (process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD) ||
        (config.credentials?.bluesky?.handle &&
          config.credentials?.bluesky?.password)
    );

    console.log("\n", chalk.cyan("Credentials:"));
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("OpenAI API:")} ${
        hasOpenAI ? chalk.green("Configured") : chalk.yellow("Not configured")
      }`
    );
    console.log(
      ` ${chalk.gray("•")} ${chalk.bold("Bluesky:")} ${
        hasBluesky ? chalk.green("Configured") : chalk.yellow("Not configured")
      }`
    );

    console.log(
      "\n",
      chalk.green("✓"),
      "You're all set! Get started with",
      chalk.cyan("social-light create")
    );
    console.log(
      chalk.gray("  Need help? Run"),
      chalk.cyan("social-light --help")
    );
  } catch (error) {
    spinner.fail(`Initialization failed: ${error.message}`);
    console.error(chalk.red("Error details:"), error);
    process.exit(1);
  }
};
