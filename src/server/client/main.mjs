// Main entry point for the Social Light web client

// State management
const state = {
  posts: [],
  unpublishedPosts: [],
  publishedPosts: [],
  currentView: "unpublished", // 'unpublished', 'published', 'editor', 'calendar'
  currentPost: null,
  config: null,
  loading: true,
  error: null,
};

// DOM elements
let app;
let mainContent;

// Initialize the application
const init = async () => {
  app = document.getElementById("app");

  // Fetch configuration
  try {
    state.loading = true;
    renderApp();

    // Fetch configuration
    const configResponse = await fetch("/api/config");
    if (!configResponse.ok) throw new Error("Failed to load configuration");
    state.config = await configResponse.json();

    // Fetch posts
    await fetchPosts();

    state.loading = false;
    renderApp();
  } catch (error) {
    console.error("Initialization error:", error);
    state.error = error.message;
    state.loading = false;
    renderApp();
  }
};

// Fetch posts from API
const fetchPosts = async () => {
  try {
    // Fetch unpublished posts
    const unpublishedResponse = await fetch("/api/posts?published=false");
    if (!unpublishedResponse.ok)
      throw new Error("Failed to fetch unpublished posts");
    state.unpublishedPosts = await unpublishedResponse.json();

    // Fetch published posts
    const publishedResponse = await fetch("/api/posts?published=true");
    if (!publishedResponse.ok)
      throw new Error("Failed to fetch published posts");
    state.publishedPosts = await publishedResponse.json();

    // Set combined posts
    state.posts = [...state.unpublishedPosts, ...state.publishedPosts];
  } catch (error) {
    console.error("Error fetching posts:", error);
    state.error = error.message;
  }
};

// Render the application
const renderApp = () => {
  if (state.loading) {
    app.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading Social Light...</p>
      </div>
    `;
    return;
  }

  if (state.error) {
    app.innerHTML = `
      <div class="card">
        <h2 class="text-center" style="color: var(--color-accent-danger)">Error</h2>
        <p class="text-center">${state.error}</p>
        <div class="text-center mt-md">
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      </div>
    `;
    return;
  }

  // Render application layout
  app.innerHTML = `
    <header class="header">

      <div class="header-logo">Social Light</div>
      <nav class="header-nav">
        <button class="btn ${
          state.currentView === "unpublished" ? "btn-primary" : ""
        }" 
          data-view="unpublished">Unpublished</button>
        <button class="btn ${
          state.currentView === "published" ? "btn-primary" : ""
        }"
          data-view="published">Published</button>
        <button class="btn ${
          state.currentView === "calendar" ? "btn-primary" : ""
        }"
          data-view="calendar">Calendar</button>
        <button class="btn btn-action" data-action="create-post">Create Post</button>
      </nav>
    </header>
    
    <main id="main-content"></main>

    <footer class="footer">
      <p>Social Light - AI-powered social media scheduler</p>
    </footer>
  `;

  // Set up event listeners for navigation
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;
      renderApp();
    });
  });

  // Set up event listener for create post button
  document
    .querySelector('[data-action="create-post"]')
    .addEventListener("click", () => {
      state.currentView = "editor";
      state.currentPost = null;
      renderApp();
    });

  // Render main content based on current view
  mainContent = document.getElementById("main-content");
  renderMainContent();
};

// Render main content based on current view
const renderMainContent = () => {
  switch (state.currentView) {
    case "unpublished":
      renderUnpublishedPosts();
      break;
    case "published":
      renderPublishedPosts();
      break;
    case "editor":
      renderPostEditor();
      break;
    case "calendar":
      renderCalendar();
      break;
    default:
      renderUnpublishedPosts();
  }
};

// Render list of unpublished posts
const renderUnpublishedPosts = () => {
  if (state.unpublishedPosts.length === 0) {
    mainContent.innerHTML = `
      <div class="card text-center">
        <h2>No Unpublished Posts</h2>
        <p>You don't have any unpublished posts yet.</p>
        <button class="btn btn-action mt-md" data-action="create-post">Create New Post</button>
      </div>
    `;

    // Set up event listener for create post button
    mainContent
      .querySelector('[data-action="create-post"]')
      .addEventListener("click", () => {
        state.currentView = "editor";
        state.currentPost = null;
        renderApp();
      });

    return;
  }

  mainContent.innerHTML = `
    <div class="section">
      <div class="d-flex justify-between align-center mb-md">
        <h2>Unpublished Posts</h2>
        <button class="btn btn-action" data-action="create-post">Create New Post</button>
      </div>
      
      <div class="post-list">
        ${state.unpublishedPosts
          .map(
            (post) => `
          <div class="card post-card" data-post-id="${post.id}">
            <div class="post-card-header">
              <h3 class="post-card-title">${post.title || "Untitled"}</h3>
              <div class="post-card-date">${formatDate(post.publish_date)}</div>
            </div>
            <div class="post-card-content">
              ${post.content}
            </div>
            <div class="post-card-footer">
              <div class="post-card-platforms">
                ${formatPlatforms(post.platforms)}
              </div>
              <div class="d-flex gap-sm">
                <button class="btn btn-sm" data-action="edit-post" data-post-id="${
                  post.id
                }">Edit</button>
                <button class="btn btn-sm btn-action" data-action="publish-post" data-post-id="${
                  post.id
                }">Publish</button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  // Set up event listeners
  // Edit post buttons
  mainContent
    .querySelectorAll('[data-action="edit-post"]')
    .forEach((button) => {
      button.addEventListener("click", () => {
        const postId = parseInt(button.dataset.postId, 10);
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          state.currentView = "editor";
          state.currentPost = post;
          renderApp();
        }
      });
    });

  // Publish post buttons
  mainContent
    .querySelectorAll('[data-action="publish-post"]')
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = parseInt(button.dataset.postId, 10);
        await publishPost(postId);
      });
    });

  // Create post button
  mainContent
    .querySelector('[data-action="create-post"]')
    .addEventListener("click", () => {
      state.currentView = "editor";
      state.currentPost = null;
      renderApp();
    });
};

// Render list of published posts
const renderPublishedPosts = () => {
  if (state.publishedPosts.length === 0) {
    mainContent.innerHTML = `
      <div class="card text-center">
        <h2>No Published Posts</h2>
        <p>You haven't published any posts yet.</p>
        <div class="mt-md">
          <button class="btn btn-primary" data-view="unpublished">View Unpublished Posts</button>
        </div>
      </div>
    `;

    // Set up event listener for view unpublished button
    mainContent
      .querySelector('[data-view="unpublished"]')
      .addEventListener("click", () => {
        state.currentView = "unpublished";
        renderApp();
      });

    return;
  }

  mainContent.innerHTML = `
    <div class="section">
      <h2 class="mb-md">Published Posts</h2>
      
      <div class="post-list">
        ${state.publishedPosts
          .map(
            (post) => `
          <div class="card post-card">
            <div class="post-card-header">
              <h3 class="post-card-title">${post.title || "Untitled"}</h3>
              <div class="post-card-date">${formatDate(post.publish_date)}</div>
            </div>
            <div class="post-card-content">
              ${post.content}
            </div>
            <div class="post-card-footer">
              <div class="post-card-platforms">
                ${formatPlatforms(post.platforms)}
              </div>
              <div>
                <span class="text-secondary">Published</span>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
};

// Render post editor
const renderPostEditor = () => {
  const isEditing = Boolean(state.currentPost);
  const post = state.currentPost || {
    title: "",
    content: "",
    platforms: "",
    publish_date: "",
  };

  // Get available platforms from config
  const platformOptions = state.config.platforms || [
    { id: "twitter", name: "Twitter" },
    { id: "bluesky", name: "Bluesky" },
    { id: "tiktok", name: "TikTok" },
  ];

  // Get selected platforms
  const selectedPlatforms = post.platforms
    ? post.platforms.split(",").map((p) => p.trim().toLowerCase())
    : [];

  mainContent.innerHTML = `
    <div class="card post-editor">
      <div class="post-editor-header">
        <h2 class="post-editor-title">${
          isEditing ? "Edit Post" : "Create New Post"
        }</h2>
      </div>
      
      <form id="post-form">
        <div class="form-group">
          <label class="form-label" for="post-title">Title</label>
          <div class="d-flex gap-sm">
            <input 
              type="text" 
              id="post-title" 
              class="form-control" 
              value="${post.title || ""}"
              placeholder="Enter title (or leave blank for AI to generate)"
            >
            ${
              state.config.aiEnabled
                ? `
              <button type="button" class="btn" id="generate-title-btn">Generate with AI</button>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="post-content">Content</label>
          <textarea 
            id="post-content" 
            class="form-control" 
            placeholder="What's on your mind?"
            rows="6"
          >${post.content || ""}</textarea>
          ${
            state.config.aiEnabled && platformOptions.length > 0
              ? `
            <div class="d-flex justify-end mt-sm">
              <button type="button" class="btn" id="enhance-content-btn">Enhance with for Provider AI</button>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="form-group">
          <label class="form-label" for="post-date">Publish Date</label>
          <div class="d-flex gap-sm">
            <input 
              type="date" 
              id="post-date" 
              class="form-control" 
              value="${extractDatePart(post.publish_date) || ""}"
              placeholder="YYYY-MM-DD"
            >
            ${
              state.config.aiEnabled
                ? `
              <button type="button" class="btn" id="suggest-date-btn">Suggest with AI</button>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="post-time">Publish Time</label>
          <div class="d-flex gap-sm">
            <input 
              type="time" 
              id="post-time" 
              class="form-control" 
              value="${extractTimePart(post.publish_date) || "12:00"}"
              placeholder="HH:MM"
            >
            ${
              state.config.aiEnabled
                ? `
              <button type="button" class="btn" id="suggest-time-btn">Suggest with AI</button>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Platforms</label>
          <div class="d-flex gap-md flex-wrap">
            ${platformOptions && platformOptions.length > 0 ? 
              platformOptions.map(
                (platform) => `
              <label class="d-flex align-center gap-sm">
                <input 
                  type="checkbox" 
                  name="platforms" 
                  value="${platform.id}"
                  ${selectedPlatforms.includes(platform.id) ? "checked" : ""}
                >
                ${platform.name}
              </label>
            `
              ).join("") : 
              `<label class="d-flex align-center gap-sm">
                <input 
                  type="checkbox" 
                  name="platforms" 
                  value="bluesky"
                  ${selectedPlatforms.includes("bluesky") || selectedPlatforms.includes("Bluesky") ? "checked" : ""}
                >
                Bluesky
              </label>`
            }
          </div>
        </div>
        
        <div class="post-editor-actions">
          <button type="button" class="btn" id="cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary">${
            isEditing ? "Update" : "Create"
          }</button>
        </div>
      </form>
    </div>
  `;

  // Set up event listeners

  // Cancel button
  document.getElementById("cancel-btn").addEventListener("click", () => {
    state.currentView = "unpublished";
    state.currentPost = null;
    renderApp();
  });

  // Form submission
  document
    .getElementById("post-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      // Get form values
      const title = document.getElementById("post-title").value;
      const content = document.getElementById("post-content").value;
      const date = document.getElementById("post-date").value;
      const time = document.getElementById("post-time").value || "12:00";
      const publishDate = date ? `${date} ${time}` : ""; // Combine date and time
      const platformElements = document.querySelectorAll(
        'input[name="platforms"]:checked'
      );
      // Make sure we have at least one platform (Bluesky is default)
      let platforms = Array.from(platformElements)
        .map((el) => el.value)
        .join(",");
        
      // If no platforms selected, default to Bluesky
      if (!platforms) {
        platforms = "bluesky";
      }

      // Validate form
      if (!content) {
        alert("Please enter post content");
        return;
      }

      try {
        if (isEditing) {
          // Update existing post
          const response = await fetch(`/api/posts/${post.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
              content,
              platforms,
              publish_date: publishDate,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update post");
          }

          // Update local state
          const updatedPost = {
            ...post,
            title,
            content,
            platforms,
            publish_date: publishDate,
          };

          // Update in posts arrays
          const postIndex = state.posts.findIndex((p) => p.id === post.id);
          if (postIndex !== -1) state.posts[postIndex] = updatedPost;

          const unpubIndex = state.unpublishedPosts.findIndex(
            (p) => p.id === post.id
          );
          if (unpubIndex !== -1)
            state.unpublishedPosts[unpubIndex] = updatedPost;
        } else {
          // Create new post
          const response = await fetch("/api/posts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
              content,
              platforms,
              publish_date: publishDate,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create post");
          }

          // Refresh posts
          await fetchPosts();
        }

        // Return to posts view
        state.currentView = "unpublished";
        state.currentPost = null;
        renderApp();
      } catch (error) {
        console.error("Error saving post:", error);
        alert(`Error: ${error.message}`);
      }
    });

  // Enhance content with AI
  const enhanceContentBtn = document.getElementById("enhance-content-btn");
  if (enhanceContentBtn) {
    enhanceContentBtn.addEventListener("click", async () => {
      const content = document.getElementById("post-content").value;
      const platformCheckboxes = document.querySelectorAll(
        'input[name="platforms"]:checked'
      );

      if (!content) {
        alert("Please enter post content first");
        return;
      }

      if (platformCheckboxes.length === 0) {
        alert("Please select at least one platform");
        return;
      }

      // Get the first selected platform
      const platform = platformCheckboxes[0].value;

      try {
        enhanceContentBtn.disabled = true;
        enhanceContentBtn.textContent = "Enhancing...";

        const response = await fetch("/api/ai/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, platform }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to enhance content");
        }

        const result = await response.json();
        const enhancedContent = result.enhanced;

        if (enhancedContent === content) {
          alert("No significant enhancements suggested");
        } else {
          // Create a modal to show both versions for comparison
          const modalHtml = `
            <div class="modal-overlay" id="content-comparison-modal">
              <div class="modal-content">
                <div class="modal-header">
                  <h3>Content Comparison</h3>
                  <button type="button" class="btn-close" id="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                  <div class="comparison-container">
                    <div class="comparison-column">
                      <h4>Original</h4>
                      <div class="comparison-content original-content">${content}</div>
                    </div>
                    <div class="comparison-column">
                      <h4>Enhanced for ${platform}</h4>
                      <div class="comparison-content enhanced-content">${enhancedContent}</div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn" id="keep-original-btn">Keep Original</button>
                  <button type="button" class="btn btn-primary" id="use-enhanced-btn">Use Enhanced</button>
                </div>
              </div>
            </div>
          `;

          // Add modal to the DOM
          const modalContainer = document.createElement("div");
          modalContainer.innerHTML = modalHtml;
          document.body.appendChild(modalContainer.firstElementChild);

          // Add event listeners for the modal
          document
            .getElementById("close-modal")
            .addEventListener("click", () => {
              document.getElementById("content-comparison-modal").remove();
            });

          document
            .getElementById("keep-original-btn")
            .addEventListener("click", () => {
              document.getElementById("content-comparison-modal").remove();
            });

          document
            .getElementById("use-enhanced-btn")
            .addEventListener("click", () => {
              document.getElementById("post-content").value = enhancedContent;
              document.getElementById("content-comparison-modal").remove();
            });
        }
      } catch (error) {
        console.error("Error enhancing content:", error);
        alert(`Error: ${error.message}`);
      } finally {
        enhanceContentBtn.disabled = false;
        enhanceContentBtn.textContent = "Enhance with AI";
      }
    });
  }

  // Generate title with AI
  const generateTitleBtn = document.getElementById("generate-title-btn");
  if (generateTitleBtn) {
    generateTitleBtn.addEventListener("click", async () => {
      const content = document.getElementById("post-content").value;

      if (!content) {
        alert("Please enter post content first");
        return;
      }

      try {
        generateTitleBtn.disabled = true;
        generateTitleBtn.textContent = "Generating...";

        const response = await fetch("/api/ai/title", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate title");
        }

        const result = await response.json();
        document.getElementById("post-title").value = result.title;
      } catch (error) {
        console.error("Error generating title:", error);
        alert(`Error: ${error.message}`);
      } finally {
        generateTitleBtn.disabled = false;
        generateTitleBtn.textContent = "Generate with AI";
      }
    });
  }

  // Suggest date with AI
  const suggestDateBtn = document.getElementById("suggest-date-btn");
  if (suggestDateBtn) {
    suggestDateBtn.addEventListener("click", async () => {
      try {
        suggestDateBtn.disabled = true;
        suggestDateBtn.textContent = "Generating...";

        const response = await fetch("/api/ai/date");

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to suggest date");
        }

        const result = await response.json();
        document.getElementById("post-date").value = result.date;
        // Also update the time field if available
        if (result.time) {
          document.getElementById("post-time").value = result.time;
        }
      } catch (error) {
        console.error("Error suggesting date:", error);
        alert(`Error: ${error.message}`);
      } finally {
        suggestDateBtn.disabled = false;
        suggestDateBtn.textContent = "Suggest with AI";
      }
    });
  }
  
  // Suggest time with AI (using same endpoint as date, but only updating time)
  const suggestTimeBtn = document.getElementById("suggest-time-btn");
  if (suggestTimeBtn) {
    suggestTimeBtn.addEventListener("click", async () => {
      try {
        suggestTimeBtn.disabled = true;
        suggestTimeBtn.textContent = "Generating...";

        const response = await fetch("/api/ai/date");

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to suggest time");
        }

        const result = await response.json();
        if (result.time) {
          document.getElementById("post-time").value = result.time;
        }
      } catch (error) {
        console.error("Error suggesting time:", error);
        alert(`Error: ${error.message}`);
      } finally {
        suggestTimeBtn.disabled = false;
        suggestTimeBtn.textContent = "Suggest with AI";
      }
    });
  }
};

// Render calendar view
const renderCalendar = () => {
  // Get current month/year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get first day of month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Create calendar grid
  const days = [];

  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Get posts for this month
  const postsThisMonth = state.posts.filter((post) => {
    if (!post.publish_date) return false;
    const postDate = new Date(post.publish_date);
    return (
      postDate.getFullYear() === currentYear &&
      postDate.getMonth() === currentMonth
    );
  });

  // Group posts by day
  const postsByDay = {};

  postsThisMonth.forEach((post) => {
    const postDate = new Date(post.publish_date);
    const day = postDate.getDate();

    if (!postsByDay[day]) {
      postsByDay[day] = [];
    }

    postsByDay[day].push(post);
  });

  // Month names for header
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Render calendar
  mainContent.innerHTML = `
    <div class="card calendar">
      <div class="calendar-header">
        <h2 class="calendar-title">${
          monthNames[currentMonth]
        } ${currentYear}</h2>
        <div class="calendar-navigation">
          <button class="btn" id="prev-month-btn">Previous</button>
          <button class="btn" id="next-month-btn">Next</button>
        </div>
      </div>
      
      <div class="calendar-grid">
        <div class="calendar-day-header">Sun</div>
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
        
        ${days
          .map((day) => {
            if (day === null) {
              return `<div class="calendar-day" style="opacity: 0.2;"></div>`;
            }

            const isToday = day === now.getDate();
            const dayPosts = postsByDay[day] || [];

            return `
            <div class="calendar-day ${
              isToday ? "calendar-day-today" : ""
            }" data-day="${day}">
              <div class="calendar-day-number">${day}</div>
              <div class="calendar-day-content">
                ${dayPosts
                  .map(
                    (post) => `
                  <div class="calendar-day-post" title="${
                    post.title || "Untitled"
                  }" data-post-id="${post.id}">
                    ${post.title || "Untitled"}
                  </div>
                `
                  )
                  .join("")}
                ${
                  dayPosts.length === 0
                    ? ""
                    : `
                  <div class="calendar-day-count">${dayPosts.length} post${
                        dayPosts.length > 1 ? "s" : ""
                      }</div>
                `
                }
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
};

// Publish a post
const publishPost = async (postId) => {
  try {
    const button = document.querySelector(
      `[data-action="publish-post"][data-post-id="${postId}"]`
    );

    if (button) {
      button.disabled = true;
      button.textContent = "Publishing...";
    }

    const response = await fetch(`/api/publish/${postId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to publish post");
    }

    const result = await response.json();

    // Refresh posts
    await fetchPosts();

    // Update view
    renderApp();

    // Show success message
    alert("Post published successfully!");
  } catch (error) {
    console.error("Error publishing post:", error);
    alert(`Error: ${error.message}`);

    // Re-enable button
    const button = document.querySelector(
      `[data-action="publish-post"][data-post-id="${postId}"]`
    );
    if (button) {
      button.disabled = false;
      button.textContent = "Publish";
    }
  }
};

// Helper function to extract date part from datetime string
const extractDatePart = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  
  // Handle different formats
  if (dateTimeStr.includes('T')) {
    return dateTimeStr.split('T')[0];
  } else if (dateTimeStr.includes(' ')) {
    return dateTimeStr.split(' ')[0];
  }
  
  // If only date is present
  return dateTimeStr;
};

// Helper function to extract time part from datetime string
const extractTimePart = (dateTimeStr) => {
  if (!dateTimeStr) return "12:00";
  
  // Handle different formats
  if (dateTimeStr.includes('T')) {
    const timePart = dateTimeStr.split('T')[1];
    return timePart ? timePart.substr(0, 5) : "12:00"; // Get HH:MM part
  } else if (dateTimeStr.includes(' ')) {
    return dateTimeStr.split(' ')[1] || "12:00";
  }
  
  // If only date is present, return default time
  return "12:00";
};

// Format date for display
const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return "No date set";

  const date = new Date(dateTimeStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if date is today or tomorrow
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${formatTime(dateTimeStr)}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${formatTime(dateTimeStr)}`;
  }

  // Format as Month Day, Year at Time
  const options = { month: "short", day: "numeric", year: "numeric" };
  return `${date.toLocaleDateString(undefined, options)} at ${formatTime(dateTimeStr)}`;
};

// Format time for display
const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  
  const time = extractTimePart(dateTimeStr);
  if (!time) return "";
  
  // Convert 24-hour time to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Format platforms for display
const formatPlatforms = (platforms) => {
  if (!platforms) return "";

  // Handle empty string but not null/undefined
  if (platforms === "") return "";

  // Make sure we have a string and filter out empty values
  const platformsStr = String(platforms);
  const platformsList = platformsStr.split(",").map((p) => p.trim()).filter(p => p);

  return platformsList
    .map((platform) => {
      let icon = "";

      switch (platform.toLowerCase()) {
        case "twitter":
          icon = "T";
          break;
        case "bluesky":
          icon = "B";
          break;
        case "tiktok":
          icon = "TT";
          break;
        default:
          icon = platform.charAt(0).toUpperCase();
      }

      return `<div class="platform-icon" title="${platform}">${icon}</div>`;
    })
    .join("");
};

// Initialize the application
document.addEventListener("DOMContentLoaded", init);
