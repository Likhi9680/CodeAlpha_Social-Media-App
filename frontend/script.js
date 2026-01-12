// 🔥 CHANGE THIS AFTER BACKEND DEPLOY
const API_BASE = 'https://social-media-app-rtxu.onrender.com/api';
// const API_BASE = 'http://localhost:5000/api';

const usernameSpan = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('postsContainer');
const captionInput = document.getElementById('caption');
const imageInput = document.getElementById('image');

/* ---------- Utility ---------- */
function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
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
  if (!user) window.location.href = 'index.html';
  usernameSpan.textContent = user.username;
}

logoutBtn.onclick = () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

/* ---------- Load Posts ---------- */
async function loadPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  const posts = await res.json();
  const currentUserId = getCurrentUserId();

  postsContainer.innerHTML = '';

  posts.forEach(post => {
    const liked = post.likes.includes(currentUserId);
    const isOwner = post.user._id === currentUserId;

    const div = document.createElement('div');
    div.className = 'post';
    div.id = post._id;

    div.innerHTML = `
      <div class="post-header">
        <strong>${post.user.username}</strong> • ${formatDateTime(post.createdAt)}
        ${isOwner ? `<button class="delete-btn" data-id="${post._id}">🗑</button>` : ''}
      </div>

      <div class="post-caption">${post.caption}</div>
      ${post.imageUrl ? `<img src="${post.imageUrl}">` : ''}

      <div class="post-actions">
        <button class="like-btn ${liked ? 'liked' : ''}" data-id="${post._id}">
          ❤️ <span class="like-count">${post.likes.length}</span>
        </button>
        <button class="comment-btn" data-id="${post._id}">💬 ${post.comments.length}</button>
      </div>

      <div class="comments" id="comments-${post._id}" style="display:none">
        ${post.comments.map(c => `<p><b>${c.user.username}</b>: ${c.text}</p>`).join('')}
        <input class="comment-input" data-id="${post._id}" placeholder="Write a comment...">
      </div>
    `;

    postsContainer.appendChild(div);
  });
}

/* ---------- Create Post ---------- */
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const caption = captionInput.value.trim();
  const imageFile = imageInput.files[0];

  const formData = new FormData();
  formData.append('caption', caption);
  formData.append('userId', getCurrentUserId());
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

  if (e.target.classList.contains('like-btn')) {
    const postId = e.target.dataset.id;

    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ userId: getCurrentUserId() })
    });

    const updated = await res.json();
    e.target.querySelector('.like-count').innerText = updated.likes.length;
    e.target.classList.toggle('liked', updated.likes.includes(getCurrentUserId()));
  }

  if (e.target.classList.contains('comment-btn')) {
    const box = document.getElementById(`comments-${e.target.dataset.id}`);
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }

  if (e.target.classList.contains('delete-btn')) {
    const postId = e.target.dataset.id;
    await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ userId: getCurrentUserId() })
    });
    document.getElementById(postId).remove();
  }
});

/* ---------- Add Comment ---------- */
postsContainer.addEventListener('keydown', async (e) => {
  if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
    const postId = e.target.dataset.id;

    await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        userId: getCurrentUserId(),
        text: e.target.value
      })
    });

    loadPosts();
  }
});

/* ---------- Init ---------- */
checkLogin();
loadPosts();
