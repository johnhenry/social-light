# Socialite

An AI-powered social media scheduling tool with CLI and web interface.

## Features

- **CLI Interface**: Create, manage, and publish posts directly from your terminal
- **Web Interface**: Optional local web server for a visual post management experience
- **AI Assistance**: Automatic title generation, date suggestions, and content enhancement
- **Multi-Platform**: Publish to Twitter, Bluesky, and TikTok from a single interface
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

## CLI Usage

### Initialize Socialite

```bash
socialite init
```

This will:
- Create a configuration file at `~/.socialite/config.json`
- Initialize a SQLite database at `~/.socialite/socialite.db`
- Set up your default platforms

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
  "defaultPlatforms": ["twitter", "bluesky"],
  "aiEnabled": true
}
```

### Platform Setup

To publish to social media platforms, you'll need to set up API credentials for each platform you want to use:

#### Twitter
- Create a Twitter Developer account and app
- Generate API key, API secret, access token, and access token secret
- Add these to your environment variables:
  ```
  TWITTER_API_KEY=your_api_key
  TWITTER_API_SECRET=your_api_secret
  TWITTER_ACCESS_TOKEN=your_access_token
  TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
  ```

#### Bluesky
- Create a Bluesky account
- Generate an app password in your account settings
- Add these to your environment variables:
  ```
  BLUESKY_HANDLE=your_handle.bsky.social
  BLUESKY_APP_PASSWORD=your_app_password
  ```

#### TikTok
- Create a TikTok developer account and app
- Generate client key, client secret, and access token
- Add these to your environment variables:
  ```
  TIKTOK_CLIENT_KEY=your_client_key
  TIKTOK_CLIENT_SECRET=your_client_secret
  TIKTOK_ACCESS_TOKEN=your_access_token
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
- **Platform APIs** for social media integrations

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
