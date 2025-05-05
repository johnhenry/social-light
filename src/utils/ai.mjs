import { OpenAI } from 'openai';
import { getConfig } from './config.mjs';
import { getPosts, getDb } from './db.mjs';

// Initialize OpenAI client
let openaiClient = null;

/**
 * Get OpenAI client instance
 * @returns {OpenAI|null} OpenAI client or null if AI is disabled
 * @example
 * const openai = getOpenAIClient();
 * if (openai) {
 *   // Use openai client
 * }
 */
export const getOpenAIClient = () => {
  const config = getConfig();
  
  if (!config.aiEnabled) {
    return null;
  }
  
  if (!openaiClient) {
    // Attempt to get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('Warning: OPENAI_API_KEY environment variable not set. AI features will be limited.');
      return null;
    }
    
    openaiClient = new OpenAI({
      apiKey
    });
  }
  
  return openaiClient;
};

/**
 * Generate a title for a post using AI
 * @param {string} content - Post content
 * @returns {string} Generated title
 * @example
 * const title = await generateTitle('This is my first post about AI technology...');
 */
export const generateTitle = async (content) => {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Fallback to simple title generation if AI is disabled
    return content.split(' ').slice(0, 5).join(' ') + '...';
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a headline writer assistant that creates catchy, engaging titles for social media posts. Generate a short, attention-grabbing title based on the content provided. Keep it under 60 characters if possible.'
        },
        {
          role: 'user',
          content: `Create a title for this social media post: "${content.substring(0, 500)}${content.length > 500 ? '...' : ''}"`
        }
      ],
      max_tokens: 60
    });
    
    return response.choices[0].message.content.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error('Error generating title:', error.message);
    // Fallback
    return content.split(' ').slice(0, 5).join(' ') + '...';
  }
};

/**
 * Suggest a publish date for a post using AI
 * @returns {string} Suggested publish date in YYYY-MM-DD format
 * @example
 * const date = await suggestPublishDate();
 */
export const suggestPublishDate = async () => {
  const openai = getOpenAIClient();
  
  // Get database connection and check if posts table exists
  const db = getDb();
  
  try {
    // Check if posts table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts';").get();
    
    if (!tableExists) {
      // If table doesn't exist, just return tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Get historical posts for analysis if table exists
    const posts = getPosts();
    const today = new Date();
    
    if (!openai || posts.length < 3) {
      // Fallback to simple date suggestion if AI is disabled or not enough data
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Format post history for the AI
    const postHistory = posts
      .filter(post => post.publish_date)
      .map(post => ({
        date: post.publish_date,
        platform: post.platforms
      }));
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a social media scheduling assistant. Based on the user\'s posting history, suggest an optimal date for their next post. Consider post frequency, patterns, and optimal timing. Return only the date in YYYY-MM-DD format.'
        },
        {
          role: 'user',
          content: `Here is my posting history: ${JSON.stringify(postHistory)}. Today is ${today.toISOString().split('T')[0]}. When should I schedule my next post?`
        }
      ],
      max_tokens: 20
    });
    
    const suggestedDate = response.choices[0].message.content.trim();
    
    // Validate date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(suggestedDate)) {
      return suggestedDate;
    }
    
    // Extract date if the AI included other text
    const dateMatch = suggestedDate.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      return dateMatch[0];
    }
    
    // Fallback
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error suggesting publish date:', error.message);
    
    // Fallback
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
};

/**
 * Enhance content with AI suggestions
 * @param {string} content - Original content
 * @param {string} platform - Target platform
 * @returns {string} Enhanced content
 * @example
 * const enhanced = await enhanceContent('Check out our new product!', 'Twitter');
 */
export const enhanceContent = async (content, platform) => {
  const openai = getOpenAIClient();
  
  if (!openai) {
    return content;
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a social media expert who helps enhance posts for ${platform}. Provide an improved version of the user's content, optimized for engagement on ${platform}. You may suggest hashtags, emojis, or slight rewording, but preserve the original message and voice.`
        },
        {
          role: 'user',
          content: `Enhance this ${platform} post: "${content}"`
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error('Error enhancing content:', error.message);
    return content;
  }
};
