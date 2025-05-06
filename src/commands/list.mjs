import { listPublished } from "./published.mjs";
import { listUnpublished } from "./unpublished.mjs";

export const list = async (argv) => {
  try {
    const { published, unpublished } = argv;

    if (!published && !unpublished) {
      console.log(chalk.yellow("No filter specified. Listing all posts."));
      console.log(
        chalk.gray("Run"),
        chalk.cyan("social-light list --published --unpublished"),
        chalk.gray("to see all posts.")
      );
    }

    if (published) {
      await listPublished(argv);
    }

    if (unpublished) {
      await listUnpublished(argv);
    }

    if (!published && !unpublished) {
      console.log(chalk.yellow("No posts found."));
    }
  } catch (error) {
    console.error(chalk.red("Error listing posts:"), error.message);
  }
};
