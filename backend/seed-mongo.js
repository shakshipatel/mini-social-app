const { connectMongo, User, Post } = require("./mongo");

async function seedMongo() {
  try {
    await connectMongo();

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});

    // Create users
    const alice = new User({
      name: "Alice",
      email: "alice@example.com",
      password: "hashed_pass",
    });
    const bob = new User({
      name: "Bob",
      email: "bob@example.com",
      password: "hashed_pass",
    });
    await alice.save();
    await bob.save();

    // Create posts
    const post1 = new Post({
      userId: alice._id,
      title: "Welcome",
      body: "Hello from Alice!",
    });
    const post2 = new Post({
      userId: bob._id,
      title: "Bob's first post",
      body: "Bob says hi",
    });
    await post1.save();
    await post2.save();

    console.log("MongoDB seed completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seedMongo();
