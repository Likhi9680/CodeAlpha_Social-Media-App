const express = require('express');
const router = express.Router();
const multer = require('multer');
const Post = require('../models/Post');
const User = require('../models/User');

/* ---------- Multer Configuration ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/* ---------- Create Post ---------- */
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { caption, userId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const post = new Post({
      caption,
      imageUrl,
      user: userId
    });

    await post.save();
    const populatedPost = await post.populate('user', 'username');

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

/* ---------- Like / Unlike Post ---------- */
router.post('/:postId/like', async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    const updatedPost = await post.populate('user', 'username');

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
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user || !post) {
      return res.status(404).json({ message: 'Post or user not found' });
    }

    post.comments.push({
      user: userId,
      username: user.username,
      text
    });

    await post.save();
    const updatedPost = await post.populate('user', 'username');

    res.json(updatedPost);

  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

module.exports = router;
