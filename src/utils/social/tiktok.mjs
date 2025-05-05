import { SocialPlatform } from './base.mjs';
import fetch from 'node-fetch';

/**
 * TikTok Platform API Implementation
 * Uses TikTok's Content Posting API for posting and managing content
 */
export class TikTokPlatform extends SocialPlatform {
  /**
   * Constructor for TikTok platform
   * @param {Object} config - Platform-specific configuration
   * @param {string} config.accessToken - TikTok API access token
   * @param {string} config.clientKey - TikTok client key
   * @param {string} config.clientSecret - TikTok client secret
   */
  constructor(config = {}) {
    super(config);
    this.name = 'tiktok';
    this.baseUrl = 'https://open.tiktokapis.com/v2';
    this.authenticated = false;
  }

  /**
   * Check if platform is properly configured
   * @returns {boolean} True if platform is configured
   */
  isConfigured() {
    return Boolean(
      this.config.accessToken &&
      this.config.clientKey &&
      this.config.clientSecret
    );
  }

  /**
   * Authenticate with the TikTok API
   * @returns {Promise<boolean>} True if authentication successful
   */
  async authenticate() {
    if (!this.isConfigured()) {
      throw new Error('TikTok API not properly configured');
    }

    try {
      // Query creator info to verify access token is valid
      const response = await fetch(`${this.baseUrl}/post/publish/creator_info/query/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`TikTok authentication failed: ${JSON.stringify(error)}`);
      }

      const creatorInfo = await response.json();
      this.creatorInfo = creatorInfo.data;
      this.authenticated = true;
      return true;
    } catch (error) {
      console.error('TikTok authentication error:', error);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Post content to TikTok
   * @param {Object} post - Post content and metadata
   * @param {string} post.text - Text content/caption of the post
   * @param {Array<string>} post.mediaUrls - URLs of videos/images to post (required)
   * @param {Object} post.options - TikTok-specific options
   * @returns {Promise<Object>} Response including publish ID
   */
  async post(post) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('TikTok authentication required');
    }

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      throw new Error('TikTok post requires at least one video or image URL');
    }

    // TikTok API has different endpoints for videos and images
    const mediaType = this._determineMediaType(post.mediaUrls[0]);
    
    if (mediaType === 'video') {
      return this._postVideo(post);
    } else if (mediaType === 'image') {
      return this._postImage(post);
    } else {
      throw new Error(`Unsupported media type: ${mediaType}`);
    }
  }

  /**
   * Get status of a TikTok post
   * @param {string} publishId - Publish ID of the post to check
   * @returns {Promise<Object>} Post status information
   */
  async getPostStatus(publishId) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('TikTok authentication required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/post/publish/status/fetch/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          publish_id: publishId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get post status: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        publishId,
        status: result.data.status,
        statusMessage: result.data.status_msg,
        videoId: result.data.video_id,
        shareUrl: result.data.share_url
      };
    } catch (error) {
      console.error('TikTok get status error:', error);
      throw error;
    }
  }

  /**
   * Delete a TikTok post
   * Note: TikTok Content Posting API doesn't directly support post deletion
   * @param {string} postId - ID of the post to delete
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deletePost(postId) {
    throw new Error('TikTok API does not support post deletion via the Content Posting API');
  }

  /**
   * Post a video to TikTok
   * @param {Object} post - Post content and metadata
   * @returns {Promise<Object>} Response with publish ID
   * @private
   */
  async _postVideo(post) {
    try {
      // Prepare post data
      const postInfo = {
        title: post.text || '',
        privacy_level: post.options?.privacyLevel || 'PUBLIC_TO_EVERYONE',
        disable_duet: post.options?.disableDuet || false,
        disable_comment: post.options?.disableComment || false,
        disable_stitch: post.options?.disableStitch || false
      };

      if (post.options?.videoCoverTimestamp) {
        postInfo.video_cover_timestamp_ms = post.options.videoCoverTimestamp;
      }

      // Initialize video upload
      const initResponse = await fetch(`${this.baseUrl}/post/publish/video/init/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          post_info: postInfo,
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: post.mediaUrls[0]
          }
        })
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(`TikTok video post initialization failed: ${JSON.stringify(error)}`);
      }

      const initResult = await initResponse.json();
      const publishId = initResult.data.publish_id;

      return {
        publishId,
        status: 'PROCESSING',
        type: 'video'
      };
    } catch (error) {
      console.error('TikTok video post error:', error);
      throw error;
    }
  }

  /**
   * Post an image to TikTok
   * @param {Object} post - Post content and metadata
   * @returns {Promise<Object>} Response with publish ID
   * @private
   */
  async _postImage(post) {
    try {
      // Prepare post data
      const postInfo = {
        title: post.text || '',
        privacy_level: post.options?.privacyLevel || 'PUBLIC_TO_EVERYONE',
        disable_comment: post.options?.disableComment || false
      };

      // Initialize image upload
      const initResponse = await fetch(`${this.baseUrl}/post/publish/content/init/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          post_info: postInfo,
          media_type: 'PHOTO',
          post_mode: 'DIRECT_POST',
          source_info: {
            source: 'PULL_FROM_URL',
            photo_urls: post.mediaUrls.slice(0, 9) // TikTok supports up to 9 images
          }
        })
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(`TikTok image post initialization failed: ${JSON.stringify(error)}`);
      }

      const initResult = await initResponse.json();
      const publishId = initResult.data.publish_id;

      return {
        publishId,
        status: 'PROCESSING',
        type: 'image'
      };
    } catch (error) {
      console.error('TikTok image post error:', error);
      throw error;
    }
  }

  /**
   * Determine media type from URL
   * @param {string} url - Media URL
   * @returns {string} Media type: 'video', 'image', or 'unknown'
   * @private
   */
  _determineMediaType(url) {
    const lowercaseUrl = url.toLowerCase();
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    for (const ext of videoExtensions) {
      if (lowercaseUrl.endsWith(ext)) {
        return 'video';
      }
    }

    for (const ext of imageExtensions) {
      if (lowercaseUrl.endsWith(ext)) {
        return 'image';
      }
    }

    // If we can't determine from extension, check for common patterns
    if (lowercaseUrl.includes('video') || lowercaseUrl.includes('mov')) {
      return 'video';
    } else if (lowercaseUrl.includes('image') || lowercaseUrl.includes('photo')) {
      return 'image';
    }

    // Default to video as it's more common for TikTok
    return 'video';
  }
}
