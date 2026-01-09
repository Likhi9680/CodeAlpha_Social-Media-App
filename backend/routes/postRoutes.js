const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const User = require('../models/User');

/* ---------- Cloudinary Storage ---------- */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social-media-posts',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

const upload = multer({ storage });

/* ---------- Create Post ---------- */
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { caption, userId } = req.body;

    const post = new Post({
      user: userId,
      caption,
      imageUrl: req.file ? req.file.path : ''
    });

    await post.save();
    const populatedPost = await post.populate('user', 'username');

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

/* ---------- Get All Posts ---------- */
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username')
      .populate('comments.user', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

/* ---------- Like / Unlike ---------- */
router.post('/:postId/like', async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const index = post.likes.indexOf(userId);
  index === -1 ? post.likes.push(userId) : post.likes.splice(index, 1);

  await post.save();
  res.json(post);
});

/* ---------- Add Comment ---------- */
router.post('/:postId/comment', async (req, res) => {
  const { postId } = req.params;
  const { userId, text } = req.body;

  const user = await User.findById(userId);
  const post = await Post.findById(postId);

  if (!user || !post) {
    return res.status(404).json({ message: 'Post or user not found' });
  }

  post.comments.push({ user: userId, text });
  await post.save();

  res.json(post);
});

module.exports = router;
