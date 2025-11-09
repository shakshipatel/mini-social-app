const mongoose = require("mongoose");

// MongoDB connection
let isConnected = false;

async function connectMongo() {
  if (isConnected) return;
  const mongoUrl =
    process.env.MONGO_URL || "mongodb://localhost:27017/mini_social_app";
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`Connected to MongoDB at ${mongoUrl}`);
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    throw err;
  }
}

async function disconnectMongo() {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Disconnected from MongoDB");
  } catch (err) {
    console.error(`Failed to disconnect from MongoDB: ${err.message}`);
  }
}

// User model
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Post model
const postSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  body: String,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

module.exports = {
  connectMongo,
  disconnectMongo,
  User,
  Post,
  isConnected: () => isConnected,
};
