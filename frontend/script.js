// 🔥 CHANGE THIS AFTER BACKEND DEPLOY
const API_BASE = 'https://social-media-app-rtxu.onrender.com/api';


// (use localhost ONLY for local testing)
// const API_BASE = 'http://localhost:5000/api';

const usernameSpan = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('postsContainer');

/* ---------- Utility ---------- */
function formatDateTime(dateString) {
  const options = { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleString(undefined, options);
}

/* ---------- Auth ---------- */
function checkLogin() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'index.html';
  } else {
    usernameSpan.textContent = user.username;
  }
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user._id : null;
}

/* ---------- Load Posts ---------- */
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

        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" />` : ''}

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
            <div class="comment">
              <strong>${c.user?.username || 'User'}:</strong> ${c.text}
            </div>
          `).join('')}
          <input
            type="text"
            class="comment-input"
            placeholder="Write a comment..."
            data-id="${post._id}"
          />
        </div>
      `;

      postsContainer.appendChild(postEl);
    });

  } catch (err) {
    postsContainer.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

/* ---------- Create Post ---------- */
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
  if (imageInput.files[0]) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    const res = await fetch(`${API_BASE}/posts/create`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Failed to create post');

    postForm.reset();
    loadPosts();

  } catch (err) {
    alert(err.message);
  }
});

/* ---------- Like & Toggle Comment ---------- */
postsContainer.addEventListener('click', async (e) => {
  const target = e.target;

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

  if (target.classList.contains('comment-btn')) {
    const postId = target.dataset.id;
    const section = document.getElementById(`comments-${postId}`);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  }
});

/* ---------- Add Comment ---------- */
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

/* ---------- Init ---------- */
checkLogin();
loadPosts();
