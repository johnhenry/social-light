import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";

import { deletePosts } from "../utils/db.mjs";

/**
 * Clean up posts
 * @param {Object} argv - Command arguments
 * @example
 * await cleanPosts({ force: true }); // Clean only published posts with force flag
 * await cleanPosts({ unpublished: true }); // Clean published and unpublished posts
 * await cleanPosts({ unpublished: true, published:false }); // Clean only unpublished posts
 */
export const cleanPosts = async (argv) => {
  try {
    // Determine which posts to delete
    const deletePublished = argv.published;
    const deleteUnpublished = argv.unpublished;

    // Generate appropriate confirmation message
    let confirmMessage = "";
    if (deletePublished && deleteUnpublished) {
      confirmMessage =
        "Are you sure you want to remove ALL posts (published and unpublished)? This action cannot be undone.";
    } else if (deletePublished) {
      confirmMessage =
        "Are you sure you want to remove all published posts? This action cannot be undone.";
    } else if (deleteUnpublished) {
      confirmMessage =
        "Are you sure you want to remove all unpublished posts? This action cannot be undone.";
    }

    // Skip confirmation if --force flag is used
    if (!argv.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: confirmMessage,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Operation cancelled."));
        return;
      }
    }

    // Show a spinner while deleting
    let spinnerText = "Cleaning up";
    if (deletePublished && deleteUnpublished) {
      spinnerText += " all posts...";
    } else if (deletePublished) {
      spinnerText += " published posts...";
    } else if (deleteUnpublished) {
      spinnerText += " unpublished posts...";
    }

    const spinner = ora(spinnerText).start();

    // Delete posts
    const result = deletePosts({
      published: deletePublished,
      unpublished: deleteUnpublished,
    });

    // Generate success message
    let successMessage = `Cleaned up ${result.total} post${
      result.total !== 1 ? "s" : ""
    }.`;
    if (deletePublished && deleteUnpublished) {
      successMessage += ` (${result.published} published, ${result.unpublished} unpublished)`;
    }

    spinner.succeed(successMessage);

    if (result.total > 0) {
      console.log(chalk.green("\n✓ Cleanup complete."));
    } else {
      console.log(chalk.blue("\nℹ No posts found to clean up."));
    }
  } catch (error) {
    console.error(chalk.red("Error cleaning posts:"), error.message);
    process.exit(1);
  }
};
