// MongoDB initialization script
// This runs when MongoDB starts to create the database and user

db = db.getSiblingDB("mini_social_app");

db.createCollection("users");
db.createCollection("posts");

// Create the app user
db.createUser({
  user: "appuser",
  pwd: "apppassword123",
  roles: [
    {
      role: "readWrite",
      db: "mini_social_app",
    },
  ],
});

print("Database initialized with collections and user created");
