const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Post = require('../models/Post');

// Load cloudinary config
require('../config/cloudinary');

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

/* ---------- Create Post ---------- */
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { caption, userId } = req.body;
    let imageUrl = "";

    if (req.file) {
      const uploadFromBuffer = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "instamedia" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await uploadFromBuffer();
      imageUrl = result.secure_url;
    }

    const post = new Post({ caption, imageUrl, user: userId });
    await post.save();

    const populatedPost = await Post.findById(post._id).populate('user', 'username');
    res.status(201).json(populatedPost);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

/* ---------- Get Posts ---------- */
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
  res.json(post);
});

/* ---------- Comment ---------- */
router.post('/:postId/comment', async (req, res) => {
  const post = await Post.findById(req.params.postId);
  post.comments.push({ user: req.body.userId, text: req.body.text });
  await post.save();
  res.json(post);
});

/* ---------- Delete (Owner Only) ---------- */
router.delete('/:postId', async (req, res) => {
  const { userId } = req.body;
  const post = await Post.findById(req.params.postId);

  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.user.toString() !== userId)
    return res.status(403).json({ message: 'Not allowed' });

  await Post.findByIdAndDelete(req.params.postId);
  res.json({ message: 'Post deleted' });
});

module.exports = router;
