# Setting Up API Keys for Social Light

To use Social Light with Bluesky, you need to set up the appropriate credentials. This guide will walk you through the process.

## Setting Up Environment Variables

Social Light stores your API credentials in two locations for flexibility:

1. `.env` file: Traditional environment variables for compatibility
2. `~/.social-light/config.json`: Secure local storage as part of your user configuration

You can set up these credentials in either location, or preferably through the `social-light init` process which handles both:

1. Create a file named `.env` in the root of the Social Light project (or let the `social-light init` command create it for you)
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
3. Create a new application password with a descriptive label (e.g., "Social Light")
4. Copy the generated password immediately (you won't be able to view it again)
5. Add the following to your `.env` file or enter them during the `social-light init` process:
   ```
   BLUESKY_HANDLE=your_handle.bsky.social
   BLUESKY_APP_PASSWORD=your_app_password
   BLUESKY_SERVICE=https://bsky.social
   ```

### OpenAI Setup (for AI Features)

1. Create an account or sign in to [OpenAI](https://platform.openai.com/)
2. Go to API keys and create a new secret key
3. Add to your `.env` file or enter it during the `social-light init` process:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

## Verifying Setup

After setting up your credentials, you can verify that they're working:

1. Run `social-light init` if you haven't already - this will confirm that your credentials are properly configured
2. Check both storage locations to ensure credentials are properly saved:
   - `.env` file in the project root
   - `~/.social-light/config.json` for your user configuration
3. Try creating and publishing a post to test the connection with `social-light create`

If you encounter authentication errors, check both storage locations and make sure your credentials are correctly entered. The application will check both locations when authenticating.

## Troubleshooting

- **App Password Invalid**: Make sure you've copied the full app password without any extra spaces
- **Authentication Failed**: Check if your app password has expired or been revoked
- **Rate Limit Errors**: Bluesky may limit how many posts you can make in a time period
- **Missing Variables**: Ensure all required environment variables are set

For platform-specific issues, consult the Bluesky developer documentation.
