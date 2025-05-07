
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { getConfig } from './config.mjs';

/**
 * Check if database tables are initialized
 * @param {Object} db - Database connection
 * @returns {boolean} True if tables are initialized
 */
const checkTablesInitialized = (db) => {
  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts';").get();
    return Boolean(tableExists);
  } catch (error) {
    console.error('Error checking database tables:', error);
    return false;
  }
};

/**
 * Get database connection
 * @returns {Object} Database connection
 * @example
 * const db = getDb();
 * const posts = db.prepare('SELECT * FROM posts').all();
 */
export const getDb = () => {
  const config = getConfig();
  
  // Resolve path with home directory if needed
  const dbPath = config.dbPath.replace(/^~/, os.homedir());
  
  // Ensure directory exists
  fs.ensureDirSync(path.dirname(dbPath));
  
  // Connect to database
  const db = new Database(dbPath);
  
  // Check if tables exist and initialize if needed
  if (!checkTablesInitialized(db)) {
    // Create tables directly to avoid circular dependency
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT NOT NULL,
          platforms TEXT,
          publish_date TEXT,
          published INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL,
          details TEXT,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }
  
  return db;
};

/**
 * Initialize database schema
 * @param {Object} existingDb - Optional existing database connection
 * @returns {boolean} True if successful
 * @example
 * const success = initializeDb();
 */
export const initializeDb = (existingDb = null) => {
  // Use provided database connection or get a new one
  const db = existingDb || getDb();
  
  try {
    // Create posts table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT NOT NULL,
        platforms TEXT,
        publish_date TEXT,
        publish_time TEXT,
        published INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

/**
 * Get all posts with optional filters
 * @param {Object} filters - Query filters
 * @param {boolean} filters.published - Filter by published status
 * @returns {Array} Array of post objects
 * @example
 * const unpublishedPosts = getPosts({ published: false });
 */
export const getPosts = (filters = {}) => {
  const db = getDb();
  
  let query = 'SELECT * FROM posts';
  const params = [];
  
  // Apply filters
  if (filters.published !== undefined) {
    query += ' WHERE published = ?';
    params.push(Number(filters.published));
  }
  
  // Add ordering
  query += ' ORDER BY publish_date ASC';
  
  return db.prepare(query).all(...params);
};

/**
 * Get a single post by ID
 * @param {number} id - Post ID
 * @returns {Object|null} Post object or null if not found
 * @example
 * const post = getPostById(1);
 */
export const getPostById = (id) => {
  const db = getDb();
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
};

/**
 * Create a new post
 * @param {Object} post - Post object
 * @returns {number} ID of the created post
 * @example
 * const postId = createPost({
 *   title: 'My first post',
 *   content: 'Hello world!',
 *   platforms: 'Twitter,Bluesky',
 *   publish_date: '2023-01-01'
 * });
 */
export const createPost = (post) => {
  const db = getDb();
  
  const { title, content, platforms, publish_date } = post;
  
  const result = db.prepare(`
    INSERT INTO posts (title, content, platforms, publish_date)
    VALUES (?, ?, ?, ?)
  `).run(title, content, platforms, publish_date);
  
  return result.lastInsertRowid;
};

/**
 * Update an existing post
 * @param {number} id - Post ID
 * @param {Object} updates - Fields to update
 * @returns {boolean} True if successful
 * @example
 * const success = updatePost(1, {
 *   title: 'Updated title',
 *   content: 'Updated content'
 * });
 */
export const updatePost = (id, updates) => {
  const db = getDb();
  
  // Build update query dynamically
  const fields = Object.keys(updates).filter(field => 
    ['title', 'content', 'platforms', 'publish_date', 'published'].includes(field)
  );
  
  if (fields.length === 0) return false;
  
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const params = fields.map(field => updates[field]);
  
  // Add updated_at
  const query = `
    UPDATE posts
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  params.push(id);
  
  const result = db.prepare(query).run(...params);
  return result.changes > 0;
};

/**
 * Mark posts as published
 * @param {Array|number} ids - Post ID or array of post IDs
 * @returns {number} Number of posts updated
 * @example
 * const count = markAsPublished([1, 2, 3]);
 */
export const markAsPublished = (ids) => {
  const db = getDb();
  
  if (!Array.isArray(ids)) {
    ids = [ids];
  }
  
  let totalChanges = 0;
  
  // Use a transaction for bulk updates
  const updateStmt = db.prepare(`
    UPDATE posts
    SET published = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const transaction = db.transaction((postIds) => {
    for (const id of postIds) {
      const result = updateStmt.run(id);
      totalChanges += result.changes;
    }
    return totalChanges;
  });
  
  return transaction(ids);
};

/**
 * Log an action to the database
 * @param {string} action - Action name
 * @param {Object} details - Additional details (will be JSON.stringified)
 * @example
 * logAction('post_created', { postId: 1, platforms: ['Twitter'] });
 */
export const logAction = (action, details = {}) => {
  const db = getDb();
  
  db.prepare(`
    INSERT INTO logs (action, details)
    VALUES (?, ?)
  `).run(action, JSON.stringify(details));
};

/**
 * Delete posts by published status
 * @param {Object} options - Options for deletion
 * @param {boolean} options.published - Whether to delete published posts
 * @param {boolean} options.unpublished - Whether to delete unpublished posts
 * @returns {Object} Counts of deleted posts by type
 * @example
 * const result = deletePosts({ published: true }); // Delete only published posts
 * const result = deletePosts({ unpublished: true }); // Delete only unpublished posts
 * const result = deletePosts({ published: true, unpublished: true }); // Delete all posts
 */
export const deletePosts = (options = { published: true }) => {
  const db = getDb();
  const result = { published: 0, unpublished: 0, total: 0 };
  
  try {
    // Delete published posts if requested
    if (options.published) {
      // Get count of published posts
      const publishedCountQuery = db.prepare("SELECT COUNT(*) as count FROM posts WHERE published = 1");
      const publishedCountResult = publishedCountQuery.get();
      result.published = publishedCountResult ? publishedCountResult.count : 0;
      
      // Delete published posts
      const deletePublishedQuery = db.prepare("DELETE FROM posts WHERE published = 1");
      deletePublishedQuery.run();
    }
    
    // Delete unpublished posts if requested
    if (options.unpublished) {
      // Get count of unpublished posts
      const unpublishedCountQuery = db.prepare("SELECT COUNT(*) as count FROM posts WHERE published = 0");
      const unpublishedCountResult = unpublishedCountQuery.get();
      result.unpublished = unpublishedCountResult ? unpublishedCountResult.count : 0;
      
      // Delete unpublished posts
      const deleteUnpublishedQuery = db.prepare("DELETE FROM posts WHERE published = 0");
      deleteUnpublishedQuery.run();
    }
    
    // Calculate total
    result.total = result.published + result.unpublished;
    
    // Log the action
    logAction('posts_cleaned', { 
      published: result.published,
      unpublished: result.unpublished,
      total: result.total
    });
    
    return result;
  } catch (error) {
    console.error('Error deleting posts:', error.message);
    throw error;
  }
};

/**
 * Delete a single post by ID
 * @param {number} id - Post ID
 * @returns {boolean} True if successful
 * @example
 * const success = deletePost(1);
 */
export const deletePost = (id) => {
  const db = getDb();
  
  try {
    // Get post to determine if it was published (for logging)
    const post = getPostById(id);
    if (!post) return false;
    
    // Delete the post
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    
    if (result.changes > 0) {
      // Log the action
      logAction('post_deleted', { 
        postId: id,
        wasPublished: post.published === 1,
        title: post.title
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting post:', error.message);
    return false;
  }
};
