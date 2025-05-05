# Socialite

An AI-powered social media scheduling tool for Bluesky with CLI and web interface.

## Features

- **CLI Interface**: Create, manage, and publish posts directly from your terminal
- **Web Interface**: Optional local web server for a visual post management experience
- **AI Assistance**: Automatic title generation, date suggestions, and content enhancement
- **Bluesky Integration**: Publish to Bluesky with ease
- **Scheduling**: Schedule posts ahead of time with smart AI date suggestions
- **Continuous Publishing**: Run in daemon mode to automatically publish scheduled posts

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/socialite.git
cd socialite

# Install dependencies
npm install

# Make the CLI executable
chmod +x src/index.mjs
npm link
```

## API Configuration

To use Socialite with Bluesky, you need to set up your credentials:

1. Create a `.env` file in the project root or complete the prompts during `socialite init`
2. Add your credentials following the format in `.env.example`
3. See `API_SETUP.md` for detailed instructions on obtaining credentials

Example:
```
# OpenAI API for AI features
OPENAI_API_KEY=your_openai_api_key

# Bluesky credentials
BLUESKY_HANDLE=your_handle.bsky.social
BLUESKY_APP_PASSWORD=your_bluesky_app_password
BLUESKY_SERVICE=https://bsky.social
```

## CLI Usage

### Initialize Socialite

```bash
socialite init
```

This will:
- Create a configuration file at `~/.socialite/config.json`
- Initialize a SQLite database at `~/.socialite/socialite.db`
- Set up Bluesky as the default platform
- Collect your Bluesky credentials

### Create a Post

```bash
socialite create
```

This will guide you through creating a new post with:
- Interactive content editor
- AI-powered title suggestions
- Smart publish date recommendations
- Platform selection

### Manage Posts

```bash
# List unpublished posts
socialite unpublished

# List published posts
socialite published

# Edit a post by index
socialite edit 1
```

### Publish Posts

```bash
# Publish all eligible posts
socialite publish

# Run in continuous mode (daemon)
socialite publish --continuous
```

### Web Interface

```bash
# Start the web server
socialite server

# Specify a custom port
socialite server --port 8080
```

## Web Interface

The web interface provides a visual way to:
- View all your scheduled and published posts
- Create and edit posts with a rich text editor
- See a calendar view of your posting schedule
- Manually publish posts with a single click

Access the web interface at `http://localhost:3000` (or your specified port) after starting the server.

## Configuration

Configuration is stored in `~/.socialite/config.json` and can be modified directly or through the initialization process.

### Example Config

```json
{
  "dbPath": "~/.socialite/socialite.db",
  "defaultPlatforms": ["Bluesky"],
  "aiEnabled": true
}
```

### Platform Setup

To publish to Bluesky, you'll need to set up your credentials:

#### Bluesky
- Create a Bluesky account if you don't have one
- Generate an app password in your account settings
- Add these to your environment variables:
  ```
  BLUESKY_HANDLE=your_handle.bsky.social
  BLUESKY_APP_PASSWORD=your_app_password
  BLUESKY_SERVICE=https://bsky.social
  ```

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
socialite/
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
