#!/usr/bin/env node --no-deprecation

// Load environment variables from .env file
import { config } from "dotenv";
config();

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";

import { initialize } from "./commands/init.mjs";
import { createPost } from "./commands/create.mjs";
import { listUnpublished } from "./commands/unpublished.mjs";
import { listPublished } from "./commands/published.mjs";
import { editPost } from "./commands/edit.mjs";
import { publishPosts } from "./commands/publish.mjs";
import { startServer } from "./server/index.mjs";

// Application title banner
const displayBanner = () => {
  console.log(
    chalk.cyan(`
   _____  ____   _____ _____          _        _      _____ _____ _    _ _______
  / ____|/ __ \ / ____|_   _|   /\   | |      | |    |_   _/ ____| |  | |__   __|
 | (___ | |  | | |      | |    /  \  | |      | |      | || |  __| |__| |  | |   
  \___ \| |  | | |      | |   / /\ \ | |      | |      | || | |_ |  __  |  | |   
  ____) | |__| | |____ _| |_ / ____ \| |____  | |____ _| || |__| | |  | |  | |   
 |_____/ \____/ \_____|_____/_/    \_\______| |______|_____\_____|_|  |_|  |_|   
                                                                               

 `)
  );
  console.log(chalk.gray("AI-powered social media scheduler\n"));
};

const main = async () => {
  displayBanner();

  yargs(hideBin(process.argv))
    .command("init", "Initialize Social Light configuration", {}, initialize)
    .command(
      "create",
      "Create a new social media post",
      {
        file: {
          alias: "f",
          describe: "Create post from file",
          type: "string",
        },
      },
      createPost
    )
    .command("unpublished", "List all unpublished posts", {}, listUnpublished)
    .command("published", "List all published posts", {}, listPublished)
    .command(
      "edit [index]",
      "Edit a draft post by index",
      {
        index: {
          describe: "Index of the post to edit",
          type: "number",
        },
      },
      editPost
    )
    .command(
      "publish",
      "Publish eligible posts",
      {
        continuous: {
          alias: "c",
          describe: "Run in continuous mode, polling for publishable posts",
          type: "boolean",
          default: false,
        },
      },
      publishPosts
    )
    .command(
      "server",
      "Start the web interface",
      {
        port: {
          alias: "p",
          describe: "Port to run the server on",
          type: "number",
          default: 3000,
        },
      },
      startServer
    )
    .demandCommand(1, "Please specify a command")
    .help().argv;
};

// Handle top-level await
try {
  await main();
} catch (error) {
  console.error(chalk.red("Error:"), error.message);
  process.exit(1);
}
