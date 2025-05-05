# Social Light

<img src="https://raw.githubusercontent.com/johnhenry/social-light/main/src/server/client/logo.jpg" alt="social light logo" style="height:256px">

An AI-powered social media scheduling tool for Bluesky with CLI and web interface. More platforms coming soon!

## Features

- **CLI Interface**: Create, manage, and publish posts directly from your terminal
- **Web Interface**: Optional local web server for a visual post management experience
- **AI Assistance**: Automatic title generation, date suggestions, and content enhancement
- **Bluesky Integration**: Publish to Bluesky with ease
- **Scheduling**: Schedule posts ahead of time with smart AI date suggestions
- **Continuous Publishing**: Run in daemon mode to automatically publish scheduled posts

## Prerequesites

### Software

[Node.js/npm](https://nodejs.org) must be installed on your system

> [!WARNING]  
> There's a know issues with the latest version of Node.js (v23) and 'better-sqlite3'. Please use Node.js v22 (LTS) or lower.

## Accounts

You will need an account on [blue sky](https://bsky.app) and an [OpenAI](https://openai.com) account to use the AI features.

## Installation

### From NPM

```bash
npm install -g social-light
```

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/social-light.git
cd social-light

# Install dependencies
npm install

# Make the CLI executable
chmod +x src/index.mjs
npm link
```

## CLI Usage

### Initialize social-light

```bash
social-light init
```

This will:

- Create a configuration file at `~/.social-light/config.json`
- Initialize a SQLite database at `~/.social-light/social-light.db`
- Collect your Bluesky credentials
- Collect your Open AI credentials

### Create a Post

```bash
social-light create
```

This will guide you through creating a new post with:

- Interactive content editor
- AI-powered title suggestions
- Smart publish date recommendations
- Platform selection

### Manage Posts

```bash
# List unpublished posts
social-light unpublished

# List published posts
social-light published

# Edit a post by index
social-light edit 1
```

### Publish Posts

```bash
# Publish all eligible posts
social-light publish

# Run in continuous mode (daemon)
social-light publish --continuous
```

### Web Interface

Open the web interface to manage post visually

<img src="https://raw.githubusercontent.com/johnhenry/social-light/main/server.png" alt="server" style="height:256px">

```bash
# Start the web server
social-light server

# Specify a custom port
social-light server --port 8080
```

## Web Interface

The web interface provides a visual way to:

- View all your scheduled and published posts
- Create and edit posts with a rich text editor
- See a calendar view of your posting schedule
- Manually publish posts with a single click

Access the web interface at `http://localhost:3000` (or your specified port) after starting the server.

## Configuration

Configuration is stored in `~/.social-light/config.json` and can be modified directly or through the initialization process.

### Example Config

```json
{
  "dbPath": "~/.social-light/social-light.db",
  "defaultPlatforms": ["Bluesky"],
  "aiEnabled": true
}
```

### Platform Setup

To publish to Bluesky, you'll need to set up your credentials:

#### Bluesky

## AI Features

To use AI features, you need an OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key
```

AI features include:

- Title generation based on post content
- Smart publish date suggestions based on your posting history
- Content enhancement for platform-specific optimization

## Development

### Project Structure

```
social-light/
├── src/
│   ├── commands/        # CLI command implementations
│   ├── utils/           # Utility modules
│   │   ├── social/      # Social media platform APIs
│   │   ├── ai.mjs       # AI utilities
│   │   ├── config.mjs   # Configuration utilities
│   │   └── db.mjs       # Database utilities
│   ├── server/          # Web server and UI
│   │   ├── client/      # Client-side web interface
│   │   └── index.mjs    # Express server
│   └── index.mjs        # Main CLI entry point
└── package.json         # Project configuration
```

### Technologies Used

- **Node.js** with ES Modules
- **SQLite** for local database storage
- **Express** for the web server
- **OpenAI API** for AI-powered features
- **Bluesky AT Protocol** for social media integration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
