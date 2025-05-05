import { SocialPlatform } from './base.mjs';
import fetch from 'node-fetch';

/**
 * Twitter (X) Platform API Implementation
 * Uses Twitter API v2 for posting and managing tweets
 */
export class TwitterPlatform extends SocialPlatform {
  /**
   * Constructor for Twitter platform
   * @param {Object} config - Platform-specific configuration
   * @param {string} config.apiKey - Twitter API key
   * @param {string} config.apiSecret - Twitter API secret
   * @param {string} config.accessToken - Twitter access token
   * @param {string} config.accessTokenSecret - Twitter access token secret
   */
  constructor(config = {}) {
    super(config);
    this.name = 'twitter';
    this.baseUrl = 'https://api.twitter.com/2';
    this.authenticated = false;
    this.bearerToken = null;
  }

  /**
   * Check if platform is properly configured
   * @returns {boolean} True if platform is configured
   */
  isConfigured() {
    return Boolean(
      this.config.apiKey &&
      this.config.apiSecret &&
      this.config.accessToken &&
      this.config.accessTokenSecret
    );
  }

  /**
   * Authenticate with the Twitter API
   * @returns {Promise<boolean>} True if authentication successful
   */
  async authenticate() {
    if (!this.isConfigured()) {
      throw new Error('Twitter API not properly configured');
    }

    try {
      // For OAuth 1.0a authentication, we need to implement a proper signature method
      // This is a simplified version for demonstration purposes
      // In a real implementation, you'd use a library like 'oauth-1.0a'
      const authHeader = this._generateOAuthHeader();
      
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'GET',
        headers: {
          Authorization: authHeader
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter authentication failed: ${JSON.stringify(error)}`);
      }

      this.authenticated = true;
      return true;
    } catch (error) {
      console.error('Twitter authentication error:', error);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Post content to Twitter
   * @param {Object} post - Post content and metadata
   * @param {string} post.text - Text content of the tweet (required)
   * @param {Array<string>} post.mediaUrls - URLs of media to attach (optional)
   * @param {Object} post.options - Twitter-specific options
   * @returns {Promise<Object>} Response including tweet ID
   */
  async post(post) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('Twitter authentication required');
    }

    if (!post.text) {
      throw new Error('Tweet text is required');
    }

    try {
      const tweetData = {
        text: post.text
      };

      // Handle media attachments if provided
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        const mediaIds = await this._uploadMedia(post.mediaUrls);
        if (mediaIds.length > 0) {
          tweetData.media = {
            media_ids: mediaIds
          };
        }
      }

      // Add any Twitter-specific options
      if (post.options) {
        // Handle reply settings if provided
        if (post.options.replySettings) {
          tweetData.reply_settings = post.options.replySettings;
        }

        // Handle quote tweet if provided
        if (post.options.quoteTweetId) {
          tweetData.quote_tweet_id = post.options.quoteTweetId;
        }

        // Handle reply if provided
        if (post.options.inReplyToTweetId) {
          tweetData.reply = {
            in_reply_to_tweet_id: post.options.inReplyToTweetId
          };
        }
      }

      const authHeader = this._generateOAuthHeader('POST', `${this.baseUrl}/tweets`);
      
      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter post failed: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        id: result.data.id,
        text: result.data.text,
        url: `https://twitter.com/user/status/${result.data.id}`
      };
    } catch (error) {
      console.error('Twitter post error:', error);
      throw error;
    }
  }

  /**
   * Get status of a tweet
   * @param {string} tweetId - ID of the tweet to check
   * @returns {Promise<Object>} Tweet status information
   */
  async getPostStatus(tweetId) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('Twitter authentication required');
    }

    try {
      const authHeader = this._generateOAuthHeader('GET', `${this.baseUrl}/tweets/${tweetId}`);
      
      const response = await fetch(`${this.baseUrl}/tweets/${tweetId}?tweet.fields=public_metrics`, {
        method: 'GET',
        headers: {
          Authorization: authHeader
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get tweet status: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        id: result.data.id,
        text: result.data.text,
        metrics: result.data.public_metrics,
        url: `https://twitter.com/user/status/${result.data.id}`
      };
    } catch (error) {
      console.error('Twitter get status error:', error);
      throw error;
    }
  }

  /**
   * Delete a tweet
   * @param {string} tweetId - ID of the tweet to delete
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deletePost(tweetId) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('Twitter authentication required');
    }

    try {
      const authHeader = this._generateOAuthHeader('DELETE', `${this.baseUrl}/tweets/${tweetId}`);
      
      const response = await fetch(`${this.baseUrl}/tweets/${tweetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to delete tweet: ${JSON.stringify(error)}`);
      }

      return true;
    } catch (error) {
      console.error('Twitter delete error:', error);
      throw error;
    }
  }

  /**
   * Upload media to Twitter
   * @param {Array<string>} mediaUrls - Array of media URLs to upload
   * @returns {Promise<Array<string>>} Array of media IDs
   * @private
   */
  async _uploadMedia(mediaUrls) {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Download each media file or read from local file
    // 2. Upload to Twitter's media endpoint (v1.1/media/upload)
    // 3. Return the media IDs
    
    const mediaIds = [];
    // Implementation would go here
    
    return mediaIds;
  }

  /**
   * Generate OAuth 1.0a header for Twitter API
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @returns {string} OAuth header string
   * @private
   */
  _generateOAuthHeader(method = 'GET', url = '') {
    // This is a simplified placeholder implementation
    // In a real implementation, you would use a library like 'oauth-1.0a'
    // to generate proper OAuth 1.0a signatures
    
    // Return simplified header for demo purposes
    return `OAuth oauth_consumer_key="${this.config.apiKey}", oauth_token="${this.config.accessToken}"`;
  }
}
