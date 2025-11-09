const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Post, User } = require("../mongo");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ error: "missing authorization header" });
  const parts = header.split(" ");
  if (parts.length !== 2)
    return res.status(401).json({ error: "invalid authorization header" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: "invalid token" });
  }
}

// List posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    const formatted = posts.map((p) => ({
      id: p._id,
      title: p.title,
      body: p.body,
      created_at: p.createdAt,
      user_id: p.userId?._id,
      user_name: p.userId?.name,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post("/", authMiddleware, async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body)
    return res.status(400).json({ error: "title and body required" });

  try {
    const post = new Post({ userId: req.user.id, title, body });
    await post.save();
    await post.populate("userId", "name");
    res.status(201).json({
      id: post._id,
      title: post.title,
      body: post.body,
      created_at: post.createdAt,
      user_id: req.user.id,
      user_name: req.user.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
