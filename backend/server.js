const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

/* ---------- Middleware ---------- */
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

/* ---------- Routes ---------- */
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

/* ---------- MongoDB Atlas Connection ---------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

/* ---------- Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
