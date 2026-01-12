const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Post = require('../models/Post');


const upload = multer();

/* ---------- Create Post ---------- */
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { caption, userId } = req.body;

    let imageUrl = "";

    if (req.file) {
      const streamUpload = () => {
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

      const result = await streamUpload();
      imageUrl = result.secure_url;
    }

    const post = new Post({ caption, imageUrl, user: userId });
    await post.save();

    const populatedPost = await Post.findById(post._id).populate('user', 'username');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post' });
  }
});

/* ---------- Other routes unchanged ---------- */
router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username')
    .populate('comments.user', 'username')
    .sort({ createdAt: -1 });
  res.json(posts);
});

router.post('/:postId/like', async (req, res) => {
  const post = await Post.findById(req.params.postId);
  const index = post.likes.indexOf(req.body.userId);
  index === -1 ? post.likes.push(req.body.userId) : post.likes.splice(index, 1);
  await post.save();
  const updated = await Post.findById(post._id).populate('user', 'username');
  res.json(updated);
});

router.post('/:postId/comment', async (req, res) => {
  const post = await Post.findById(req.params.postId);
  post.comments.push({ user: req.body.userId, text: req.body.text });
  await post.save();
  const updated = await Post.findById(post._id)
    .populate('user', 'username')
    .populate('comments.user', 'username');
  res.json(updated);
});

router.delete('/:postId', async (req, res) => {
  const { userId } = req.body;
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.user.toString() !== userId) return res.status(403).json({ message: 'Not allowed' });

  await Post.findByIdAndDelete(req.params.postId);
  res.json({ message: 'Post deleted' });
});

module.exports = router;
