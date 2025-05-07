import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import os from "os";

import { configExists } from "../utils/config.mjs";

// Load environment variables
dotenv.config();

/**
 * Remove the Social Light application configuration
 * @example
 * await uninitialize();
 */
export const uninitialize = async () => {
  const spinner = ora("Removing Social Light...").start();
  const deletedFiles = [];

  try {
    const exists = configExists();

    // If config already prompt for confirmation
    if (exists) {
      spinner.stop();

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Delete Social Light configuration?",
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Unitialization cancelled."));
        return;
      }

      spinner.start("Removing Social Light configuration...");

      // Remove configuration file in current directory
      const configPath = path.join(process.cwd(), "config.json");
      if (fs.existsSync(configPath)) {
        fs.removeSync(configPath);
        deletedFiles.push(configPath);
        spinner.text = "Configuration file removed...";
      }

      // Remove database files
      const dbDir = path.join(process.cwd(), "data");
      if (fs.existsSync(dbDir)) {
        fs.removeSync(dbDir);
        deletedFiles.push(dbDir);
        spinner.text = "Database files removed...";
      }

      // Remove configuration in $HOME/.social-light directory
      const homeSocialLightDir = path.join(os.homedir(), ".social-light");
      if (fs.existsSync(homeSocialLightDir)) {
        // Get list of files before deletion for reporting
        const configFiles = fs
          .readdirSync(homeSocialLightDir)
          .map((file) => path.join(homeSocialLightDir, file));

        // Add them to deleted files list
        deletedFiles.push(...configFiles);

        // Remove the directory and all contents
        fs.removeSync(homeSocialLightDir);
        spinner.text = "Home social-light directory removed...";
      }

      // Clean environment variables related to Social Light
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        fs.removeSync(envPath);
        deletedFiles.push(envPath);
        spinner.text = "Environment file removed...";
      }

      spinner.succeed("Social Light configuration removed successfully!");

      // Print list of deleted files
      console.log(
        chalk.green("\n✓ All Social Light configurations have been removed.")
      );

      if (deletedFiles.length > 0) {
        console.log(chalk.cyan("\nDeleted files and directories:"));
        deletedFiles.forEach((file) => {
          console.log(chalk.gray(`  • ${file}`));
        });
      }

      console.log(
        chalk.cyan("\nYou can reinitialize anytime with:"),
        chalk.cyan("social-light init")
      );
      return;
    }

    spinner.info("Not initialized. No configuration to remove.");
    return;
  } catch (error) {
    spinner.fail(`Unintialization failed: ${error.message}`);
    console.error(chalk.red("Error details:"), error);
    process.exit(1);
  }
};
