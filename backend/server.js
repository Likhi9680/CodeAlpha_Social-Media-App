const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

/* ---------- Middleware ---------- */
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

/* ---------- Routes ---------- */
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

/* ---------- MongoDB ---------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => console.error(err));

/* ---------- Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
