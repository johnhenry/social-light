import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { exec } from "child_process";
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  markAsPublished,
  logAction,
  deletePost,
} from "../utils/db.mjs";
import { getSocialAPI } from "../utils/social/index.mjs";
import {
  generateTitle,
  suggestPublishDate,
  enhanceContent,
} from "../utils/ai.mjs";
import { getConfig } from "../utils/config.mjs";

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Start the web server
 * @param {Object} argv - Command arguments
 */
export const startServer = async (argv) => {
  const app = express();
  const port = argv.port || 3000;
  const shouldOpen = !argv.noOpen; // Open by default, disabled with --no-open

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve static files from 'client' directory
  app.use(express.static(path.join(__dirname, "client")));

  // API routes
  setupApiRoutes(app);

  // Serve React app for all other routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
  });

  // Start server
  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(chalk.green(`✓ Server started on port ${port}`));
    console.log(
      chalk.cyan(
        `Opening ${url} in your browser...`
      )
    );
    console.log(chalk.gray("Press Ctrl+C to stop the server"));
    
    // Open URL in default browser if not disabled
    if (shouldOpen) {
      // Open URL in default browser based on platform
      let command;
      switch (process.platform) {
        case 'darwin': // macOS
          command = `open ${url}`;
          break;
        case 'win32': // Windows
          command = `start ${url}`;
          break;
        default: // Linux and others
          command = `xdg-open ${url}`;
      }
      
      // Execute the command to open the browser
      exec(command, (error) => {
        if (error) {
          console.error(chalk.yellow(`Unable to open browser automatically: ${error.message}`));
          console.log(chalk.cyan(`Open ${url} in your browser to access the web interface`));
        }
      });
    } else {
      console.log(chalk.cyan(`Open ${url} in your browser to access the web interface`));
    }
  });
};

/**
 * Set up API routes
 * @param {Express} app - Express app
 */
const setupApiRoutes = (app) => {
  // Get API info
  app.get("/api", (req, res) => {
    res.json({
      name: "Social Light API",
      version: "1.0.0",
      endpoints: [
        "/api/posts",
        "/api/posts/:id",
        "/api/publish/:id",
        "/api/posts/:id/delete",
        "/api/ai/title",
        "/api/ai/date",
        "/api/ai/enhance",
        "/api/config",
      ],
    });
  });

  // Get configuration
  app.get("/api/config", (req, res) => {
    const config = getConfig();

    // Remove sensitive information
    const safeConfig = {
      ...config,
      // Always ensure platforms are available
      platforms: [
        { id: "bluesky", name: "Bluesky", icon: "cloud" },
        // Add more platforms here when they become available
        // { id: 'twitter', name: 'Twitter', icon: 'twitter' },
        // { id: 'tiktok', name: 'TikTok', icon: 'music' }
      ],
    };

    res.json(safeConfig);
  });

  // Get all posts
  app.get("/api/posts", (req, res) => {
    try {
      const published = req.query.published === "true";
      const posts = getPosts({ published });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get post by ID
  app.get("/api/posts/:id", (req, res) => {
    try {
      const post = getPostById(parseInt(req.params.id, 10));

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new post
  app.post("/api/posts", async (req, res) => {
    try {
      const { title, content, platforms, publish_date, publish_time } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Combine date and time if both are provided
      let dateTimeValue = publish_date;
      if (publish_date && publish_time) {
        dateTimeValue = `${publish_date} ${publish_time}`;
      }

      const postId = createPost({
        title,
        content,
        platforms: Array.isArray(platforms) ? platforms.join(",") : platforms,
        publish_date: dateTimeValue,
      });

      logAction("post_created", { postId, source: "web" });

      res.status(201).json({ id: postId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update post
  app.put("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { title, content, platforms, publish_date, publish_time } = req.body;

      const post = getPostById(id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Combine date and time if both are provided
      let dateTimeValue = publish_date;
      if (publish_date && publish_time) {
        dateTimeValue = `${publish_date} ${publish_time}`;
      }

      const success = updatePost(id, {
        title,
        content,
        platforms: Array.isArray(platforms) ? platforms.join(",") : platforms,
        publish_date: dateTimeValue,
      });

      if (!success) {
        return res.status(500).json({ error: "Failed to update post" });
      }

      logAction("post_updated", { postId: id, source: "web" });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete post - using a different route pattern to avoid conflicts
  app.post("/api/posts/:id/delete", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const post = getPostById(id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const success = deletePost(id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete post" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Publish post
  app.post("/api/publish/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const post = getPostById(id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.published) {
        return res.status(400).json({ error: "Post is already published" });
      }

      if (!post.platforms) {
        return res
          .status(400)
          .json({ error: "No platforms specified for post" });
      }
      
      // Check if post is eligible for publishing based on date/time
      if (post.publish_date) {
        let publishDateTime;
        
        // If the date includes time component (contains 'T' or ' ')
        if (post.publish_date.includes('T') || post.publish_date.includes(' ')) {
          publishDateTime = new Date(post.publish_date);
        } else {
          // If only date is provided, assume start of day
          publishDateTime = new Date(post.publish_date);
          publishDateTime.setHours(0, 0, 0, 0);
        }
        
        const now = new Date();
        
        if (publishDateTime > now) {
          return res.status(400).json({ 
            error: "Post is scheduled for future publication",
            scheduledTime: publishDateTime.toISOString()
          });
        }
      }

      // Initialize social API
      const socialAPI = getSocialAPI();
      const platforms = post.platforms.split(",").map((p) => p.trim());

      // Publish post to specified platforms
      const result = await socialAPI.post({
        text: post.content,
        title: post.title,
        platforms,
      });

      // Check if post was successfully published to at least one platform
      const anySuccess = Object.values(result.results).some((r) => r.success);

      if (anySuccess) {
        markAsPublished(id);

        // Log the action with platform results
        logAction("post_published", {
          postId: id,
          platforms: result.results,
          source: "web",
        });

        res.json({
          success: true,
          platforms: result.results,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to publish to any platform",
          platforms: result.results,
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate title with AI
  app.post("/api/ai/title", async (req, res) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const title = await generateTitle(content);
      res.json({ title });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Suggest publish date and time with AI
  app.get("/api/ai/date", async (req, res) => {
    try {
      const dateTime = await suggestPublishDate();
      
      // Parse datetime to separate date and time if needed for client
      let date, time;
      if (dateTime.includes(" ")) {
        [date, time] = dateTime.split(" ");
      } else {
        date = dateTime;
        time = "12:00"; // Default time
      }
      
      res.json({ dateTime, date, time });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Enhance content with AI
  app.post("/api/ai/enhance", async (req, res) => {
    try {
      const { content, platform } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      if (!platform) {
        return res.status(400).json({ error: "Platform is required" });
      }

      const enhanced = await enhanceContent(content, platform);
      res.json({ enhanced });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};
