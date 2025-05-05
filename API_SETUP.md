# Setting Up API Keys for Socialite

To use Socialite with social media platforms, you need to set up API keys for each platform you want to use. This guide will walk you through the process.

## Setting Up Environment Variables

Socialite uses environment variables to securely store your API credentials. You can set these up in a `.env` file in the project root:

1. Create a file named `.env` in the root of the Socialite project
2. Add your API keys using the format below
3. Make sure to never commit this file to version control

Example `.env` file:
```
# OpenAI API for AI features
OPENAI_API_KEY=your_openai_api_key_here

# Twitter/X API credentials
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Bluesky credentials
BLUESKY_HANDLE=your_handle.bsky.social
BLUESKY_APP_PASSWORD=your_bluesky_app_password

# TikTok API credentials
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
```

## Platform-Specific Setup

### Twitter/X API Setup

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new application (or use an existing one)
3. Generate API keys and tokens with the appropriate permissions
   - You'll need Read + Write permissions for posting
4. Add the following to your `.env` file:
   ```
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
   ```

### Bluesky Setup

1. Sign in to your Bluesky account
2. Go to Settings > App Passwords
3. Create a new application password
4. Add the following to your `.env` file:
   ```
   BLUESKY_HANDLE=your_handle.bsky.social
   BLUESKY_APP_PASSWORD=your_app_password
   ```

### TikTok API Setup

1. Register as a developer on the [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create a new app 
3. Enable the Content Posting API product
4. Generate your client key, client secret, and access token
5. Add the following to your `.env` file:
   ```
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   TIKTOK_ACCESS_TOKEN=your_access_token
   ```

### OpenAI Setup (for AI Features)

1. Create an account or sign in to [OpenAI](https://platform.openai.com/)
2. Go to API keys and create a new secret key
3. Add to your `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

## Verifying Setup

After setting up your API keys, you can verify that they're working:

1. Run `socialite init` to initialize the app
2. Select the platforms you've set up credentials for
3. Try creating and publishing a post to test the connections

If you encounter authentication errors, double-check your API keys and make sure they have the appropriate permissions.

## Troubleshooting

- **API Key Invalid**: Make sure you've copied the full key without any extra spaces
- **Authentication Failed**: Check if your API keys have expired or been revoked
- **Rate Limit Errors**: Some platforms limit how many posts you can make in a time period
- **Missing Variables**: Ensure all required environment variables are set for each platform

For platform-specific issues, consult the respective platform's developer documentation.
