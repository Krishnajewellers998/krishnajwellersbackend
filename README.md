# Krishna Jewellers — Clean Architecture Backend API

Robust, scalable REST API server built with Node.js & Express following Feature-First Clean Architecture.

## Architecture

```
backend/
├── src/
│   ├── config/             # Typed environment & constants
│   ├── database/           # Dual-mode data store (PostgreSQL + data.json fallback)
│   ├── middleware/         # Session auth, CORS, Multer upload, Error handler
│   ├── features/           # Feature-First Business Modules
│   │   ├── auth/           # Login, logout, session verification
│   │   ├── gold-rates/     # 24K, 22K, 18K rate retrieval & updates
│   │   ├── categories/     # Category CRUD & synonym mapping
│   │   ├── jewellery/      # Product filtering, pagination, search, CRUD
│   │   └── uploads/        # Image upload processor
│   ├── routes/             # Central API router
│   ├── app.js              # Express app, middleware, static /images
│   └── server.js           # Server lifecycle & bootstrap
├── images/                 # Product and banner images
├── data.json               # Offline fallback dataset
├── package.json
└── .env
```

## Running the Backend

```bash
cd backend
npm install
npm start
```

Health check: `http://localhost:3000/api/health`
