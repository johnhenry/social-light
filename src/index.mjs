#!/usr/bin/env node --no-warnings

// Load environment variables from .env file
import { config } from "dotenv";
config();
import NPMPackage from "../package.json" with { type: "json" };

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";

import { initialize } from "./commands/init.mjs";
import { uninitialize } from "./commands/uninit.mjs";
import { createPost } from "./commands/create.mjs";

import { list } from "./commands/list.mjs";
import { editPost } from "./commands/edit.mjs";
import { publishPosts } from "./commands/publish.mjs";
import { cleanPosts } from "./commands/clean.mjs";
import { startServer } from "./server/index.mjs";

// Application title banner
const displayBanner = () => {
  console.log(
chalk.cyan(`
   _____  ____   _____ _____          _        _      _____ _____ _    _ _______
  / ____|/ __ \\ / ____|_   _|   /\\   | |      | |    |_   _/ ____| |  | |__   __|
 | (___ | |  | || |      | |   /  \\  | |  __  | |      | || |  __| |__| |  | |
  \\___ \\| |  | || |      | |  / /\\ \\ | |      | |      | || | |_ |  __  |  | |
  ____) | |__| || |____ _| |_/ ____ \\| |_____ | |____ _| || |__| | |  | |  | |
 |_____/ \\____/ \\_____|_____/_/   \\__\\\\______||______|_____\\_____|_|  |_|  |_|
`)
  );
  console.log(chalk.gray("AI-powered social media scheduler\n"));
};
const main = async () => {
  yargs(hideBin(process.argv))
    .parserConfiguration({
      'boolean-negation': true
    })
    .command("version", "Social Light version", {}, () => {
      console.log(NPMPackage.version);
    })
    .command("init", "Initialize Social Light configuration", {}, initialize)
    .command("uninit", "Remove Social Light configuration", {}, uninitialize)
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
    .command(
      "list",
      "List posts",
      {
        published: {
          alias: "p",
          describe: "List published posts",
          type: "boolean",
          default: false,
        },
        unpublished: {
          alias: "u",
          describe: "List unpublished posts",
          type: "boolean",
          default: true,
        },
      },
      list
    )
    .command(
      "edit [index]",
      "Edit an unpublished post by index",
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
      "Publish unpublished posts",
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
        "no-open": {
          describe: "Disable automatically opening the browser",
          type: "boolean",
          default: false,
        },
      },
      startServer
    )
    .command(
      "clean",
      "Remove posts from the database",
      {
        published: {
          alias: "p",
          describe: "Remove published posts",
          type: "boolean",
          default: true,
        },
        unpublished: {
          alias: "u",
          describe: "Remove unpublished posts",
          type: "boolean",
          default: false,
        },
      },
      cleanPosts
    )
    .demandCommand(1, "Please specify a command")
    .fail((msg, err, yargs) => {
      displayBanner();
      if(msg) {
        console.error(msg);
      }
      console.log(yargs.help());
      process.exit(1);
    })
    .showHelpOnFail(false)
    .help()
    .epilogue('For more information, check the documentation.')
    .parse();
};

// Handle top-level await
try {
  await main();
} catch (error) {
  console.error(chalk.red("Error:"), error.message);
  process.exit(1);
}
