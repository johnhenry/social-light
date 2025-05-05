#!/usr/bin/env node

import { getConfig, updateConfig } from "./config.mjs";
import fs from "fs-extra";
import path from "path";
import os from "os";

// This is a utility script to properly set the platformConfigs in config.json
console.log("Fixing configuration file...");

// Get the current config
const config = getConfig();
console.log("Current config:", config);

// Create platformConfigs if it doesn't exist
if (!config.platformConfigs) {
  config.platformConfigs = {};
}

// Get environment variables for Bluesky
const blueskyHandle = process.env.BLUESKY_HANDLE;
const blueskyPassword = process.env.BLUESKY_APP_PASSWORD;
const pdsHost = process.env.PDSHOST || "https://bsky.social";

// Check if we have Bluesky credentials in environment variables
if (blueskyHandle && blueskyPassword) {
  console.log("Found Bluesky credentials in environment variables");

  // Add Bluesky configuration to platformConfigs
  config.platformConfigs.bluesky = {
    handle: blueskyHandle,
    password: blueskyPassword,
    pdshost: pdsHost,
  };

  // Ensure Bluesky is in defaultPlatforms
  if (
    !config.defaultPlatforms ||
    !config.defaultPlatforms.includes("bluesky")
  ) {
    config.defaultPlatforms = ["bluesky"];
  }
} else {
  console.log("No Bluesky credentials found in environment variables");

  // Prompt user for credentials if in interactive mode
  if (process.stdout.isTTY) {
    console.log(
      "Please run the following command to set up Bluesky credentials:"
    );
    console.log("social-light init");
  }
}

// Save the updated config
const configPath = path.join(os.homedir(), ".social-light", "config.json");
fs.writeJsonSync(configPath, config, { spaces: 2 });

console.log("Updated config:", config);
console.log("Configuration file updated successfully!");
