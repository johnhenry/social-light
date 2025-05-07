import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

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
      //TODO: remove configuration files

      console.log(chalk.green("Configuration removed successfully."));
      return;
    }
    console.log(chalk.yellow("Not initialized. No configuration to remove."));
    return;
  } catch (error) {
    spinner.fail(`Unitialization failed: ${error.message}`);
    console.error(chalk.red("Error details:"), error);
    process.exit(1);
  }
};
