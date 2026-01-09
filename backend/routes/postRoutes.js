const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');

/* ---------- Cloudinary Storage ---------- */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'social_media_posts',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

const upload = multer({ storage });

/* ---------- Create Post ---------- */
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { caption, userId } = req.body;

    const imageUrl = req.file ? req.file.path : '';

    const post = new Post({
      caption,
      imageUrl,
      user: userId
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username');

    res.status(201).json(populatedPost);
  } catch (err) {
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

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(userId);
    if (index === -1) post.likes.push(userId);
    else post.likes.splice(index, 1);

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('user', 'username')
      .populate('comments.user', 'username');

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Failed to like post' });
  }
});

/* ---------- Add Comment ---------- */
router.post('/:postId/comment', async (req, res) => {
  const { postId } = req.params;
  const { userId, text } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({
      user: userId,
      text
    });

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('user', 'username')
      .populate('comments.user', 'username');

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

module.exports = router;
