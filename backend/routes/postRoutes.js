const express = require('express');
const router = express.Router();
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Post = require('../models/Post');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'social_posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

/* ---------- Create Post ---------- */
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { caption, userId } = req.body;

    const post = new Post({
      caption,
      imageUrl: req.file ? req.file.path : '',
      imagePublicId: req.file ? req.file.filename : '',
      user: userId
    });

    await post.save();
    const populated = await Post.findById(post._id).populate('user', 'username');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Post upload failed' });
  }
});

/* ---------- Get All Posts ---------- */
router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username')
    .populate('comments.user', 'username')
    .sort({ createdAt: -1 });
  res.json(posts);
});

/* ---------- Like ---------- */
router.post('/:postId/like', async (req, res) => {
  const post = await Post.findById(req.params.postId);
  const index = post.likes.indexOf(req.body.userId);
  index === -1 ? post.likes.push(req.body.userId) : post.likes.splice(index, 1);
  await post.save();
  const updated = await Post.findById(post._id).populate('user', 'username');
  res.json(updated);
});

/* ---------- Comment ---------- */
router.post('/:postId/comment', async (req, res) => {
  const post = await Post.findById(req.params.postId);
  post.comments.push({ user: req.body.userId, text: req.body.text });
  await post.save();
  const updated = await Post.findById(post._id)
    .populate('user', 'username')
    .populate('comments.user', 'username');
  res.json(updated);
});

/* ---------- DELETE POST (Owner Only + Cloudinary) ---------- */
router.delete('/:postId', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== userId)
      return res.status(403).json({ message: 'Not allowed' });

    // delete image from cloudinary
    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: 'Post deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
