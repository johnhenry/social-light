import { SocialPlatform } from './base.mjs';
import fetch from 'node-fetch';

/**
 * Bluesky Platform API Implementation
 * Uses Bluesky's AT Protocol for posting and managing content
 */
export class BlueskyPlatform extends SocialPlatform {
  /**
   * Constructor for Bluesky platform
   * @param {Object} config - Platform-specific configuration
   * @param {string} config.handle - Bluesky handle (username)
   * @param {string} config.password - Bluesky app password
   * @param {string} config.service - Bluesky service URL (default: https://bsky.social)
   */
  constructor(config = {}) {
    super(config);
    this.name = 'bluesky';
    this.service = config.service || 'https://bsky.social';
    this.authenticated = false;
    this.session = null;
  }

  /**
   * Check if platform is properly configured
   * @returns {boolean} True if platform is configured
   */
  isConfigured() {
    // Check config for credentials
    const hasConfigCreds = Boolean(
      this.config.handle &&
      this.config.password
    );

    // Also check environment variables
    const hasEnvCreds = Boolean(
      process.env.BLUESKY_HANDLE &&
      process.env.BLUESKY_APP_PASSWORD
    );

    return hasConfigCreds || hasEnvCreds;
  }

  /**
   * Authenticate with the Bluesky API
   * @returns {Promise<boolean>} True if authentication successful
   */
  async authenticate() {
    if (!this.isConfigured()) {
      throw new Error('Bluesky API not properly configured');
    }

    // Get credentials from config or environment variables
    const handle = this.config.handle || process.env.BLUESKY_HANDLE;
    const password = this.config.password || process.env.BLUESKY_APP_PASSWORD;
    const service = this.config.service || process.env.BLUESKY_SERVICE || this.service;

    try {
      const response = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: handle,
          password: password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bluesky authentication failed: ${JSON.stringify(error)}`);
      }

      this.session = await response.json();
      this.authenticated = true;
      return true;
    } catch (error) {
      console.error('Bluesky authentication error:', error);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Post content to Bluesky
   * @param {Object} post - Post content and metadata
   * @param {string} post.text - Text content of the post (required)
   * @param {Array<string>} post.mediaUrls - URLs of media to attach (optional)
   * @param {Object} post.options - Bluesky-specific options
   * @returns {Promise<Object>} Response including post URI and CID
   */
  async post(post) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('Bluesky authentication required');
    }

    if (!post.text) {
      throw new Error('Post text is required');
    }

    try {
      // Create basic post record
      const record = {
        $type: 'app.bsky.feed.post',
        text: post.text,
        createdAt: new Date().toISOString()
      };

      // Handle languages if specified
      if (post.options && post.options.langs) {
        record.langs = Array.isArray(post.options.langs) ? post.options.langs : [post.options.langs];
      }

      // Handle media attachments if provided
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        const images = await Promise.all(
          post.mediaUrls.map(url => this._uploadImage(url))
        );

        if (images.length > 0) {
          record.embed = {
            $type: 'app.bsky.embed.images',
            images: images.map(img => ({
              alt: post.options?.imageAlt || 'Image',
              image: img
            }))
          };
        }
      }

      // Handle external link embedding if provided
      if (post.options && post.options.externalLink) {
        record.embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: post.options.externalLink.uri,
            title: post.options.externalLink.title || '',
            description: post.options.externalLink.description || ''
          }
        };

        if (post.options.externalLink.thumbnailUrl) {
          const thumb = await this._uploadImage(post.options.externalLink.thumbnailUrl);
          record.embed.external.thumb = thumb;
        }
      }

      // Create the post
      const response = await fetch(`${this.service}/xrpc/com.atproto.repo.createRecord`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.accessJwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repo: this.config.handle,
          collection: 'app.bsky.feed.post',
          record: record
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bluesky post failed: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        id: result.uri.split('/').pop(),
        uri: result.uri,
        cid: result.cid
      };
    } catch (error) {
      console.error('Bluesky post error:', error);
      throw error;
    }
  }

  /**
   * Get status of a post
   * @param {string} postUri - URI of the post to check
   * @returns {Promise<Object>} Post status information
   */
  async getPostStatus(postUri) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('Bluesky authentication required');
    }

    try {
      // Parse URI to get repo and record ID
      const parts = postUri.split('/');
      const repo = parts[2];
      const recordId = parts.pop();
      const collection = 'app.bsky.feed.post';

      const response = await fetch(`${this.service}/xrpc/com.atproto.repo.getRecord?repo=${repo}&collection=${collection}&rkey=${recordId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.session.accessJwt}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get post status: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        uri: postUri,
        cid: result.cid,
        record: result.value
      };
    } catch (error) {
      console.error('Bluesky get status error:', error);
      throw error;
    }
  }

  /**
   * Delete a post from Bluesky
   * @param {string} postUri - URI of the post to delete
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deletePost(postUri) {
    if (!this.authenticated && !await this.authenticate()) {
      throw new Error('Bluesky authentication required');
    }

    try {
      // Parse URI to get repo and record ID
      const parts = postUri.split('/');
      const repo = parts[2];
      const recordId = parts.pop();
      const collection = 'app.bsky.feed.post';

      const response = await fetch(`${this.service}/xrpc/com.atproto.repo.deleteRecord`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.accessJwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repo,
          collection,
          rkey: recordId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to delete post: ${JSON.stringify(error)}`);
      }

      return true;
    } catch (error) {
      console.error('Bluesky delete error:', error);
      throw error;
    }
  }

  /**
   * Upload an image to Bluesky
   * @param {string} imageUrl - URL of the image to upload
   * @returns {Promise<Object>} Blob reference
   * @private
   */
  async _uploadImage(imageUrl) {
    try {
      // Fetch the image data
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.buffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Upload the image blob
      const uploadResponse = await fetch(`${this.service}/xrpc/com.atproto.repo.uploadBlob`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.accessJwt}`,
          'Content-Type': contentType
        },
        body: imageBuffer
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Failed to upload image: ${JSON.stringify(error)}`);
      }

      const result = await uploadResponse.json();
      return result.blob;
    } catch (error) {
      console.error('Bluesky image upload error:', error);
      throw error;
    }
  }
}
