Backend README (MongoDB-only)

Prerequisites:

- Node.js 16+
- MongoDB running locally (default: mongodb://localhost:27017) or configure MONGO_URL env var

Setup and Run:

```bash
npm install
npm run seed
npm start
```

Server will start at http://localhost:4000

Environment variables:

- MONGO_URL: MongoDB connection string (default: mongodb://localhost:27017/mini_social_app)
- JWT_SECRET: JWT signing key (default: dev_secret_key)
- PORT: HTTP server port (default: 4000)

Default user credentials created by seed:

- alice@example.com / password
- bob@example.com / password

Tests:

```bash
npm test
```

Tests expect MongoDB running at mongodb://localhost:27017/mini_social_app_test
