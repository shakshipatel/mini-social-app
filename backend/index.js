const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectMongo } = require("./mongo");

const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    console.log(
      `[${level}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Enable CORS for frontend (allow all origins in dev, restrict in production)
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN || "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

// Init MongoDB (required)
connectMongo().catch((err) => {
  console.error("MongoDB init failed:", err);
  process.exit(1);
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);

app.get("/", (req, res) =>
  res.json({ ok: true, message: "Mini Social App API" })
);

// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  console.error(`[ERROR] ${message}`, err.stack);

  res.status(status).json({
    error: message,
    status,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const port = process.env.PORT || 4000;

// Export app for tests. When run directly (node index.js), start the server.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`[INFO] Server listening on http://localhost:${port}`);
    console.log(
      `[INFO] Node environment: ${process.env.NODE_ENV || "development"}`
    );
  });
}

module.exports = app;
