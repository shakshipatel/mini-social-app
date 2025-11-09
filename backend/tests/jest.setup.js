// Configure tests to use MongoDB (local instance expected at localhost:27017)
process.env.MONGO_URL = "mongodb://localhost:27017/mini_social_app_test";

// Increase Jest timeout for MongoDB operations
jest.setTimeout(10000);
