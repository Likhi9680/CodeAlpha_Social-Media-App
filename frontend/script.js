// 🔥 CHANGE THIS AFTER BACKEND DEPLOY
const API_BASE = 'https://social-media-app-rtxu.onrender.com/api';
// const API_BASE = 'http://localhost:5000/api'; // for local testing

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
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function getCurrentUserId() {
  const user = getCurrentUser();
  return user ? user._id : null;
}

function checkLogin() {
  const user = getCurrentUser();
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

/* ---------- Load Posts ---------- */
async function loadPosts() {
  postsContainer.innerHTML = 'Loading posts...';

  try {
    const res = await fetch(`${API_BASE}/posts`);
    const posts = await res.json();
    const currentUserId = getCurrentUserId();

    postsContainer.innerHTML = '';

    posts.forEach(post => {
      const isOwner = post.user._id === currentUserId;
      const liked = post.likes.includes(currentUserId);

      const postEl = document.createElement('div');
      postEl.className = 'post';
      postEl.id = post._id;

      postEl.innerHTML = `
        <div class="post-header">
          <span><strong>${post.user.username}</strong> • ${formatDateTime(post.createdAt)}</span>
          ${isOwner ? `<button class="delete-btn" data-id="${post._id}">🗑</button>` : ''}
        </div>

        <div class="post-caption">${post.caption}</div>

        ${post.imageUrl ? `<img src="${post.imageUrl}" />` : ''}

        <div class="post-actions">
          <button class="like-btn ${liked ? 'liked' : ''}" data-id="${post._id}">
            ❤️ <span class="like-count">${post.likes.length}</span>
          </button>
          <button class="comment-btn" data-id="${post._id}">
            💬 ${post.comments.length}
          </button>
        </div>

        <div class="comments-section" id="comments-${post._id}" style="display:none;">
          ${post.comments.map(c => `
            <div class="comment"><strong>${c.user.username}</strong>: ${c.text}</div>
          `).join('')}
          <input class="comment-input" data-id="${post._id}" placeholder="Write comment...">
        </div>
      `;

      postsContainer.appendChild(postEl);
    });

  } catch (err) {
    postsContainer.innerHTML = 'Failed to load posts';
  }
}

/* ---------- Create Post ---------- */
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const caption = captionInput.value.trim();
  const imageFile = image.files[0];
  const userId = getCurrentUserId();

  const formData = new FormData();
  formData.append('caption', caption);
  formData.append('userId', userId);
  if (imageFile) formData.append('image', imageFile);

  await fetch(`${API_BASE}/posts/create`, {
    method: 'POST',
    body: formData
  });

  postForm.reset();
  loadPosts();
});

/* ---------- Like / Comment / Delete ---------- */
postsContainer.addEventListener('click', async (e) => {

  // LIKE
  if (e.target.classList.contains('like-btn')) {
    const postId = e.target.dataset.id;

    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: getCurrentUserId() })
    });

    const updated = await res.json();
    e.target.querySelector('.like-count').innerText = updated.likes.length;
    e.target.classList.toggle('liked', updated.likes.includes(getCurrentUserId()));
  }

  // COMMENT TOGGLE
  if (e.target.classList.contains('comment-btn')) {
    const postId = e.target.dataset.id;
    const box = document.getElementById(`comments-${postId}`);
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }

  // DELETE (ONLY OWNER SEES BUTTON)
  if (e.target.classList.contains('delete-btn')) {
    const postId = e.target.dataset.id;

    if (confirm('Delete this post permanently?')) {
      await fetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE' });
      document.getElementById(postId).remove();
    }
  }
});

/* ---------- Add Comment ---------- */
postsContainer.addEventListener('keydown', async (e) => {
  if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
    const postId = e.target.dataset.id;
    const text = e.target.value;

    await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: getCurrentUserId(), text })
    });

    loadPosts();
  }
});

/* ---------- Init ---------- */
checkLogin();
loadPosts();
