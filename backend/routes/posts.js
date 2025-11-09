const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Post, User, Comment } = require("../mongo");

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

// Debug middleware to log incoming requests to this router
router.use((req, res, next) => {
  console.log(`[DEBUG] posts router -> ${req.method} ${req.originalUrl}`);
  next();
});

// List posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    // For each post, also include like and comment counts
    const formatted = await Promise.all(
      posts.map(async (p) => {
        const commentCount = await Comment.countDocuments({ postId: p._id });
        return {
          id: p._id,
          title: p.title,
          body: p.body,
          created_at: p.createdAt,
          user_id: p.userId?._id,
          user_name: p.userId?.name,
          like_count: p.likes ? p.likes.length : 0,
          comment_count: commentCount,
        };
      })
    );
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post by id (includes counts)
router.get("/:id", async (req, res) => {
  try {
    const p = await Post.findById(req.params.id).populate("userId", "name");
    if (!p) return res.status(404).json({ error: "post not found" });
    const commentCount = await Comment.countDocuments({ postId: p._id });
    res.json({
      id: p._id,
      title: p.title,
      body: p.body,
      created_at: p.createdAt,
      user_id: p.userId?._id,
      user_name: p.userId?.name,
      like_count: p.likes ? p.likes.length : 0,
      comment_count: commentCount,
    });
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

// Toggle like for a post (auth required)
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "post not found" });

    const userId = req.user.id;
    const exists = post.likes?.some((id) => id.toString() === userId);
    if (exists) {
      // remove like
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes = post.likes || [];
      post.likes.push(userId);
    }
    await post.save();
    res.json({ like_count: post.likes.length, liked: !exists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List comments for a post
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "name");
    const formatted = comments.map((c) => ({
      id: c._id,
      body: c.body,
      created_at: c.createdAt,
      user_id: c.userId?._id,
      user_name: c.userId?.name,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a comment on a post
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: "body required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "post not found" });

    const comment = new Comment({
      postId: req.params.id,
      userId: req.user.id,
      body,
    });
    await comment.save();
    await comment.populate("userId", "name");
    res.status(201).json({
      id: comment._id,
      body: comment.body,
      created_at: comment.createdAt,
      user_id: req.user.id,
      user_name: req.user.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a post (only owner)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body)
      return res.status(400).json({ error: "title and body required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "post not found" });
    if (post.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "forbidden" });

    post.title = title;
    post.body = body;
    await post.save();
    await post.populate("userId", "name");
    res.json({
      id: post._id,
      title: post.title,
      body: post.body,
      created_at: post.createdAt,
      user_id: post.userId?._id,
      user_name: post.userId?.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a post (only owner)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "post not found" });
    if (post.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "forbidden" });

    await Comment.deleteMany({ postId: req.params.id });
    await post.remove();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
