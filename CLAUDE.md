# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Social Light is an AI-powered social media scheduling tool for Bluesky (with more platforms planned). It provides both a CLI and web interface for creating, scheduling, and publishing posts.

## Commands

### Development Commands

```bash
# Install dependencies
npm install

# Run CLI in development mode (with auto-restart)
npm run dev

# Start the web server
npm run server
# OR with custom port
node src/server/index.mjs --port 8080

# Make CLI globally available
chmod +x src/index.mjs
npm link
```

### CLI Commands

```bash
# Initialize social-light
social-light init

# Create a new post
social-light create

# List unpublished posts
social-light list
# List all posts (including published)
social-light list --published

# Edit a post by index
social-light edit 1

# Publish eligible posts
social-light publish
# Run in continuous mode (daemon)
social-light publish --continuous

# Clean published posts
social-light clean
# Clean all posts (including unpublished)
social-light clean --unpublished

# Start web interface
social-light server
# With custom port
social-light server --port 8080

# Remove social-light configuration
social-light uninit
```

## Architecture

### Core Components

1. **CLI Commands** (`src/commands/`) - Implementations of CLI commands
2. **Configuration** (`src/utils/config.mjs`) - Manages app configuration in `~/.social-light/config.json`
3. **Database** (`src/utils/db.mjs`) - SQLite database operations using better-sqlite3 and Knex
4. **Social Platform APIs** (`src/utils/social/`) - Interface with social media platforms
5. **AI Utilities** (`src/utils/ai.mjs`) - OpenAI integration for content enhancement
6. **Web Server** (`src/server/`) - Express server and client-side web interface

### Data Flow

1. User creates/edits posts via CLI or web interface
2. Posts are stored in SQLite database with metadata
3. AI enhances content when requested (via OpenAI)
4. Scheduled posts are published to platforms (currently Bluesky)
5. Post status is updated in database

### Configuration

Configuration is stored in `~/.social-light/config.json` and includes:
- Database path
- Platform credentials
- AI settings (OpenAI API key)
- Default platforms

### Database

SQLite database (`~/.social-light/social-light.db`) with tables for:
- Posts (title, content, platforms, publish date, published status)
- Activity logs

## Technology Stack

- Node.js (ES Modules)
- SQLite via better-sqlite3
- Express for web server
- OpenAI API for AI features
- Bluesky AT Protocol integration
- Inquirer for CLI interaction

## Development Notes

- The application requires Node.js >= 20.9.0
- ES Modules are used throughout the codebase (import/export syntax)
- No formal testing framework is currently implemented
- Configuration follows XDG standards for user data in home directory