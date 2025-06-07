const API_BASE = 'http://localhost:5000/api';

const usernameSpan = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('postsContainer');

// Utility: format date/time nicely
function formatDateTime(dateString) {
  const options = { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  };
  return new Date(dateString).toLocaleString(undefined, options);
}

// Check login status
function checkLogin() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'index.html';
  } else {
    usernameSpan.textContent = user.username;
  }
}

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// Get current user id
function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user._id : null;
}

// Fetch and display posts
async function loadPosts() {
  postsContainer.innerHTML = 'Loading posts...';
  try {
    const res = await fetch(`${API_BASE}/posts`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    const posts = await res.json();

    if (!posts.length) {
      postsContainer.innerHTML = '<p>No posts yet.</p>';
      return;
    }

    postsContainer.innerHTML = '';
    posts.forEach(post => {
      const liked = post.likes.includes(getCurrentUserId());
      const postEl = document.createElement('div');
      postEl.className = 'post';

      postEl.innerHTML = `
        <div class="post-header">
          <div><strong>${post.user.username}</strong></div>
          <div>${formatDateTime(post.createdAt)}</div>
        </div>
        <div class="post-caption">${post.caption}</div>
        ${post.imageUrl ? `<img src="http://localhost:5000${post.imageUrl}" alt="Post Image" />` : ''}
        <div class="post-actions">
          <button class="like-btn ${liked ? 'liked' : ''}" data-id="${post._id}">
            ❤️ Like (<span class="like-count">${post.likes.length}</span>)
          </button>
          <button class="comment-btn" data-id="${post._id}">
            💬 Comment (${post.comments.length})
          </button>
        </div>
        <div class="comments-section" id="comments-${post._id}" style="display:none;">
          ${post.comments.map(c => `
            <div class="comment"><strong>${c.username}:</strong> ${c.text}</div>
          `).join('')}
          <input type="text" class="comment-input" placeholder="Write a comment..." data-id="${post._id}" />
        </div>
      `;

      postsContainer.appendChild(postEl);
    });
  } catch (err) {
    postsContainer.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// Handle post creation
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const caption = document.getElementById('caption').value.trim();
  const imageInput = document.getElementById('image');
  const userId = getCurrentUserId();

  if (!caption) return alert('Caption required');
  if (!userId) return alert('Login required');

  const formData = new FormData();
  formData.append('caption', caption);
  formData.append('userId', userId);
  if (imageInput.files[0]) formData.append('image', imageInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/posts/create`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error(await res.text());
    postForm.reset();
    loadPosts();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Like & Comment handlers
postsContainer.addEventListener('click', async (e) => {
  const target = e.target;

  // Like post
  if (target.classList.contains('like-btn')) {
    const postId = target.dataset.id;
    const userId = getCurrentUserId();
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to like post');
      const updatedPost = await res.json();

      target.querySelector('.like-count').textContent = updatedPost.likes.length;
      target.classList.toggle('liked', updatedPost.likes.includes(userId));
    } catch (err) {
      alert(err.message);
    }
  }

  // Toggle comment section
  if (target.classList.contains('comment-btn')) {
    const postId = target.dataset.id;
    const section = document.getElementById(`comments-${postId}`);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  }
});

// Handle comment input (Enter key)
postsContainer.addEventListener('keydown', async (e) => {
  if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
    const text = e.target.value.trim();
    const postId = e.target.dataset.id;
    const userId = getCurrentUserId();
    if (!text || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text })
      });
      if (!res.ok) throw new Error('Failed to add comment');
      e.target.value = '';
      loadPosts();
    } catch (err) {
      alert(err.message);
    }
  }
});

// Initial
checkLogin();
loadPosts();
