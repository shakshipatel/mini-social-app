# Mini Social App — Production Ready

A full-stack social media application with React frontend, Express API backend, and MongoDB database. Production-ready with Docker, docker-compose, and CI/CD pipelines.

## ⚡ Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB 7+ (running at `mongodb://localhost:27017`)
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd backend
npm install
npm run seed          # Seed sample data (alice@example.com, bob@example.com)
npm start             # Runs on http://localhost:4000
npm test              # Run test suite
```

**API Endpoints:**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/posts` - List all posts with authors
- `POST /api/posts` - Create new post (requires auth)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Runs on http://localhost:5173
npm run build         # Production build → dist/
```

## 🐳 Docker & Production Deployment

### Quick Docker Setup

```bash
docker-compose up --build
```

Services available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- MongoDB: localhost:27017 (internal)

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide covering:

- Traditional server deployment
- Docker on Linux/Cloud
- Kubernetes
- Heroku, AWS, Google Cloud Run, DigitalOcean
- Security & SSL setup
- Monitoring & logging
- Continuous deployment

## 📋 Features

✅ User authentication (register/login with JWT)  
✅ Create and view posts  
✅ SCSS module-scoped styling  
✅ Responsive gradient UI  
✅ MongoDB persistence  
✅ CORS-enabled API  
✅ Jest + Supertest tests  
✅ Docker containerization  
✅ CI/CD GitHub Actions  
✅ Production-ready error handling

## 🧪 Testing

```bash
cd backend && npm test
cd frontend && npm run build
```

## 📁 Project Structure

```
mini-social-app/
├── backend/
│   ├── Dockerfile
│   ├── index.js
│   ├── mongo.js
│   ├── seed-mongo.js
│   ├── routes/ (auth.js, posts.js)
│   └── tests/ (auth.test.js, posts.test.js)
├── frontend/
│   ├── Dockerfile
│   ├── vite.config.js
│   └── src/
│       ├── components/ (Login, Register, Feed, NewPost)
│       ├── App.jsx
│       └── api.js
├── docker-compose.yml
├── .github/workflows/ci-cd.yml
└── DEPLOYMENT.md
```

## 🔐 Environment Variables

### Backend (.env)

```
NODE_ENV=production
MONGO_URL=mongodb://localhost:27017/mini_social_app
JWT_SECRET=your_secret_key_here
PORT=4000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:4000/api
```

## 📞 Support

- Backend runs on port 4000
- Frontend runs on port 5173 (dev) or 3000 (production)
- MongoDB required at localhost:27017

## 📄 License

MIT
