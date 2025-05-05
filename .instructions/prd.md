Here's a **Product Requirements Document (PRD)** for your CLI + Web hybrid AI-powered social scheduling tool, named **Socialite**.

---

## 📄 Product Requirements Document (PRD)

### Product Name

**Socialite**

### Overview

**Socialite** is a command-line tool and optional local web server that helps users manage and schedule social media posts. It leverages AI to assist with post generation, scheduling, and cross-platform publishing.

---

### Goals

- Provide a fast, scriptable, and extensible CLI for content creation and scheduling.
- Allow an optional local web interface for reviewing/editing posts and calendars.
- Support AI-powered assistance for titles, publish dates, and content suggestions.
- Manage state using a local SQLite database and a user-scoped JSON settings file.
- Support for scheduling and publishing to multiple platforms (e.g., Twitter, Bluesky, TikTok).

---

### Interfaces

#### CLI (Primary)

Command-line tool with subcommands (inspired by Git/Heroku-style commands).

#### Web UI (Optional)

Local web interface launched with `socialite server` to browse, create, and edit posts.

---

### Initial Setup

#### `socialite init`

- Creates a JSON config file at `$HOME/.socialite/config.json`
- Config includes:

  ```json
  {
    "dbPath": "~/.socialite/socialite.db",
    "defaultPlatforms": [],
    "aiEnabled": true
  }
  ```

- Creates SQLite DB file and necessary tables (posts, logs, etc.)

---

### Post Data Model (SQLite)

| Field        | Type     | Description                       |
| ------------ | -------- | --------------------------------- |
| id           | INTEGER  | Primary key                       |
| title        | TEXT     | Title of the post                 |
| content      | TEXT     | Full post content                 |
| platforms    | TEXT     | Comma-separated list of platforms |
| publish_date | DATE     | Scheduled publish date            |
| published    | BOOLEAN  | Whether the post is published     |
| created_at   | DATETIME | Timestamp of creation             |
| updated_at   | DATETIME | Timestamp of last edit            |

---

### CLI Commands

#### `socialite create`

Two modes:

1. **Prompt-based (interactive)**

   ```
   > This is my first post!
   enter a title? (leave blank for AI to figure it out)>
   enter a publish date? (leave blank for AI to figure it out)>
   where would you like to publish this post?
   - [x] Twitter
   - [ ] Bluesky
   - [ ] TikTok
   ```

2. **File-based**

   ```bash
   socialite create --file my_post.txt
   ```

AI will infer:

- Title (from content)
- Date (based on historical post frequency and current date)

#### `socialite unpublished`

Lists all unpublished posts:

```
[index] [date] [title] [truncated content...]
```

#### `socialite published`

Lists published posts:

```
[index] [date] [title] [truncated content...]
```

#### `socialite edit [index]`

- Edits a draft post by index
- Opens `$EDITOR` or prompts inline
- Title/content/platform/date editable

#### `socialite publish`

- Publishes all eligible posts (date <= today)
- Marks them as `published = true`

#### `socialite publish --continuous`

- Polls continuously (e.g., every 60s)
- Checks for publishable posts and posts them

#### `socialite server`

- Launches local web UI
- React frontend served via Express or Vite backend
- Allows post browsing, editing, calendar view, platform settings

---

### AI Integration

- **AI Title Inference:** Uses first lines + intent classification
- **AI Date Prediction:** Based on user's post cadence
- **Optional Caption Enhancement:** Suggestions on tone, hashtags, or trending topics

Uses the [`ai`](https://www.npmjs.com/package/ai) npm package (OpenAI wrapper).

---

### Tech Stack

- **CLI:** Node.js, `yargs`, `ora`, `inquirer`, `fs-extra`, `chalk`
- **AI:** [`ai`](https://www.npmjs.com/package/ai)
- **DB:** SQLite via `better-sqlite3` or `knex`
- **Config:** JSON in `$HOME/.socialite/config.json`
- **Server (optional):** Express + React (via Vite), Tailwind for UI
- **Scheduler:** Node cron jobs or `setInterval` for continuous mode

---

### Stretch Goals

- 🗓️ **Monthly Calendar Generator:** Visual calendar view with post slots
- ✍️ **Caption Generator:** Suggests captions per platform
- 🎨 **Image Generator:** AI-based content visuals from prompts
- 📹 **Video Stitcher:** Combine images/sound for TikTok/IG Reels

---

### Success Criteria

- Can create, edit, and publish posts via CLI
- AI assistance enhances workflow (for title/date at minimum)
- Local DB reliably stores and syncs post state
- Posts appear and update correctly in the optional web UI
- User can run `--continuous` publish mode reliably

---

Would you like help scaffolding the CLI file structure or database schema next?
