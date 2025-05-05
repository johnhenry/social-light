/**
 * Base Social Platform API Interface
 * All platform-specific API implementations should extend this class
 */
export class SocialPlatform {
  /**
   * Constructor for the base social platform
   * @param {Object} config - Platform-specific configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.authenticated = false;
  }

  /**
   * Check if platform is properly configured
   * @returns {boolean} True if platform is configured
   */
  isConfigured() {
    return false;
  }

  /**
   * Authenticate with the platform API
   * @returns {Promise<boolean>} True if authentication successful
   */
  async authenticate() {
    this.authenticated = false;
    return false;
  }

  /**
   * Post content to the platform
   * @param {Object} post - Post content and metadata
   * @param {string} post.text - Text content of the post
   * @param {string} post.title - Title/caption of the post (if applicable)
   * @param {Array<string>} post.mediaUrls - Array of media URLs to attach
   * @param {Object} post.options - Platform-specific options
   * @returns {Promise<Object>} Response data including post ID or errors
   */
  async post(post) {
    throw new Error('Method not implemented');
  }

  /**
   * Get status of a post
   * @param {string} postId - ID of the post to check
   * @returns {Promise<Object>} Status information
   */
  async getPostStatus(postId) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a post from the platform
   * @param {string} postId - ID of the post to delete
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deletePost(postId) {
    throw new Error('Method not implemented');
  }
}

/**
 * Factory for creating platform instances
 */
export const PlatformFactory = {
  /**
   * Create a new platform instance
   * @param {string} platform - Platform name (e.g., 'twitter', 'bluesky', 'tiktok')
   * @param {Object} config - Platform-specific configuration
   * @returns {SocialPlatform} Platform instance
   */
  create(platform, config = {}) {
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        // Dynamic import to avoid circular dependencies
        return import('./twitter.mjs').then(module => new module.TwitterPlatform(config));
      case 'bluesky':
        return import('./bluesky.mjs').then(module => new module.BlueskyPlatform(config));
      case 'tiktok':
        return import('./tiktok.mjs').then(module => new module.TikTokPlatform(config));
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
};
