# Setting Up API Keys for Socialite

To use Socialite with Bluesky, you need to set up the appropriate credentials. This guide will walk you through the process.

## Setting Up Environment Variables

Socialite uses environment variables to securely store your API credentials. You can set these up in a `.env` file in the project root or through the initialization process:

1. Create a file named `.env` in the root of the Socialite project (or let the `socialite init` command create it for you)
2. Add your credentials using the format below
3. Make sure to never commit this file to version control

Example `.env` file:
```
# OpenAI API for AI features
OPENAI_API_KEY=your_openai_api_key_here

# Bluesky credentials
BLUESKY_HANDLE=your_handle.bsky.social
BLUESKY_APP_PASSWORD=your_bluesky_app_password
BLUESKY_SERVICE=https://bsky.social
```

## Platform Setup

### Bluesky Setup

1. Sign in to your Bluesky account
2. Go to Settings > App Passwords
3. Create a new application password with a descriptive label (e.g., "Socialite")
4. Copy the generated password immediately (you won't be able to view it again)
5. Add the following to your `.env` file or enter them during the `socialite init` process:
   ```
   BLUESKY_HANDLE=your_handle.bsky.social
   BLUESKY_APP_PASSWORD=your_app_password
   BLUESKY_SERVICE=https://bsky.social
   ```

### OpenAI Setup (for AI Features)

1. Create an account or sign in to [OpenAI](https://platform.openai.com/)
2. Go to API keys and create a new secret key
3. Add to your `.env` file or enter it during the `socialite init` process:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

## Verifying Setup

After setting up your credentials, you can verify that they're working:

1. Run `socialite init` if you haven't already
2. Try creating and publishing a post to test the connection

If you encounter authentication errors, double-check your credentials and make sure they're correctly entered.

## Troubleshooting

- **App Password Invalid**: Make sure you've copied the full app password without any extra spaces
- **Authentication Failed**: Check if your app password has expired or been revoked
- **Rate Limit Errors**: Bluesky may limit how many posts you can make in a time period
- **Missing Variables**: Ensure all required environment variables are set

For platform-specific issues, consult the Bluesky developer documentation.
