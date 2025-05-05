import { PlatformFactory } from "./base.mjs";
import { getConfig } from "../config.mjs";
import { logAction } from "../db.mjs";

/**
 * Social API manager for handling multiple platforms
 */
export class SocialAPI {
  /**
   * Constructor for the Social API manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.platforms = new Map();
    this.config = getConfig();
    this.options = options;
  }

  /**
   * Initialize a specific platform
   * @param {string} platform - Platform name
   * @param {Object} config - Platform-specific configuration
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initPlatform(platform, config = {}) {
    try {
      // Get platform instance from factory
      const platformInstance = await PlatformFactory.create(platform, config);

      // Store the platform instance
      this.platforms.set(platform.toLowerCase(), platformInstance);

      // Attempt authentication if configured
      if (platformInstance.isConfigured()) {
        await platformInstance.authenticate();
      }

      return true;
    } catch (error) {
      console.error(`Failed to initialize ${platform}:`, error);
      return false;
    }
  }

  /**
   * Get a platform instance by name
   * @param {string} platform - Platform name
   * @returns {SocialPlatform|null} Platform instance or null if not found
   */
  getPlatform(platform) {
    return this.platforms.get(platform.toLowerCase()) || null;
  }

  /**
   * Check if a platform is initialized and authenticated
   * @param {string} platform - Platform name
   * @returns {boolean} True if platform is ready
   */
  isPlatformReady(platform) {
    const platformInstance = this.getPlatform(platform);
    return platformInstance && platformInstance.authenticated;
  }

  /**
   * Post content to multiple platforms
   * @param {Object} post - Post content and metadata
   * @param {string} post.text - Text content of the post
   * @param {string} post.title - Title/caption of the post (optional)
   * @param {Array<string>} post.mediaUrls - Media URLs to attach (optional)
   * @param {Array<string>} post.platforms - Platforms to post to
   * @param {Object} post.options - Platform-specific options
   * @returns {Promise<Object>} Results for each platform
   */
  async post(post) {
    if (!post.platforms || post.platforms.length === 0) {
      throw new Error("No platforms specified for posting");
    }

    const results = {};
    const errors = [];

    // Post to each platform
    for (const platform of post.platforms) {
      try {
        const platformLower = platform.toLowerCase();
        let platformInstance = this.getPlatform(platformLower);

        if (!platformInstance) {
          await this.initPlatform(platformLower);
          platformInstance = this.getPlatform(platformLower);
        }

        if (!platformInstance) {
          throw new Error(`Platform ${platform} not initialized`);
        }

        if (!platformInstance.authenticated) {
          await platformInstance.authenticate();
        }

        // Get platform-specific options if provided
        const platformOptions =
          post.options && post.options[platformLower]
            ? post.options[platformLower]
            : {};

        // Create platform-specific post object
        const platformPost = {
          text: post.text,
          title: post.title,
          mediaUrls: post.mediaUrls,
          options: platformOptions,
        };

        // Post to the platform
        const result = await platformInstance.post(platformPost);

        // Store result
        results[platformLower] = {
          success: true,
          postId: result.id || result.uri || result.publishId,
          ...result,
        };

        // Log the action
        logAction("post_created", {
          platform: platformLower,
          postId: result.id || result.uri || result.publishId,
          content: post.text?.substring(0, 100),
        });
      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);

        // Store error
        results[platform.toLowerCase()] = {
          success: false,
          error: error.message,
        };

        errors.push({
          platform,
          message: error.message,
        });

        // Log the error
        logAction("post_error", {
          platform: platform.toLowerCase(),
          error: error.message,
          content: post.text?.substring(0, 100),
        });
      }
    }

    return {
      results,
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Get status of posts across platforms
   * @param {Object} postIds - Map of platform to post ID
   * @returns {Promise<Object>} Status for each platform
   */
  async getPostStatus(postIds) {
    const results = {};
    const errors = [];

    for (const [platform, postId] of Object.entries(postIds)) {
      try {
        const platformLower = platform.toLowerCase();
        const platformInstance = this.getPlatform(platformLower);

        if (!platformInstance) {
          throw new Error(`Platform ${platform} not initialized`);
        }

        if (!platformInstance.authenticated) {
          await platformInstance.authenticate();
        }

        const status = await platformInstance.getPostStatus(postId);

        results[platformLower] = {
          success: true,
          status,
        };
      } catch (error) {
        console.error(`Error getting status from ${platform}:`, error);

        results[platform.toLowerCase()] = {
          success: false,
          error: error.message,
        };

        errors.push({
          platform,
          message: error.message,
        });
      }
    }

    return {
      results,
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Delete posts across platforms
   * @param {Object} postIds - Map of platform to post ID
   * @returns {Promise<Object>} Results for each platform
   */
  async deletePosts(postIds) {
    const results = {};
    const errors = [];

    for (const [platform, postId] of Object.entries(postIds)) {
      try {
        const platformLower = platform.toLowerCase();
        const platformInstance = this.getPlatform(platformLower);

        if (!platformInstance) {
          throw new Error(`Platform ${platform} not initialized`);
        }

        if (!platformInstance.authenticated) {
          await platformInstance.authenticate();
        }

        const success = await platformInstance.deletePost(postId);

        results[platformLower] = {
          success,
        };

        // Log the action
        logAction("post_deleted", {
          platform: platformLower,
          postId,
        });
      } catch (error) {
        console.error(`Error deleting post from ${platform}:`, error);

        results[platform.toLowerCase()] = {
          success: false,
          error: error.message,
        };

        errors.push({
          platform,
          message: error.message,
        });

        // Log the error
        logAction("delete_error", {
          platform: platform.toLowerCase(),
          postId,
          error: error.message,
        });
      }
    }

    return {
      results,
      success: errors.length === 0,
      errors,
    };
  }
}

// Export a singleton instance
let instance = null;

/**
 * Get the Social API instance
 * @param {Object} options - Configuration options
 * @returns {SocialAPI} SocialAPI instance
 */
export const getSocialAPI = (options = {}) => {
  if (!instance) {
    instance = new SocialAPI(options);
  }
  return instance;
};
