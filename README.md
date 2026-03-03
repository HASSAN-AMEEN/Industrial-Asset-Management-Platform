# Full-Stack Mobile Application

A production-ready full-stack project with Node.js backend and React Native frontend.

## Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (to be implemented)
- **Architecture**: Modular and scalable
- **API**: REST API

### Frontend
- **React Native** (Expo + TypeScript)
- **HTTP Client**: Axios
- **Navigation**: React Navigation
- **State Management**: Ready for Redux/Zustand integration

## Project Structure

```
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration files
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   ├── app.ts          # Express app configuration
│   │   └── server.ts       # Server startup
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── tsconfig.json
├── mobile/                 # React Native frontend
│   ├── src/
│   │   ├── screens/        # Screen components
│   │   ├── components/     # Reusable components
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── App.tsx             # Main app component
│   ├── package.json
│   └── tsconfig.json
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Expo CLI (for mobile development)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database configuration.

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000`

### Mobile Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your preferred platform:
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## API Endpoints

### Test Endpoint
- **GET** `/api/test` - Tests API connectivity

### Health Check
- **GET** `/health` - Server health status

## Database Schema

### User Model
```typescript
interface User {
  id: string;        // UUID
  email: string;     // Unique email address
  password: string;  // Hashed password
  role: string;      // User role (default: "user")
  createdAt: Date;   // Account creation date
}
```

## Development Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Mobile
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

## Features Implemented

### Backend ✅
- [x] Express server with TypeScript
- [x] CORS configuration
- [x] JSON middleware
- [x] Environment variables
- [x] Error handling middleware
- [x] Logging with Morgan
- [x] Prisma ORM setup
- [x] Database connection
- [x] Test API endpoint
- [x] Health check endpoint
- [x] Graceful shutdown

### Mobile ✅
- [x] React Native Expo setup
- [x] TypeScript configuration
- [x] Axios HTTP client
- [x] API service with test function
- [x] Project structure
- [x] Type definitions

### To Be Implemented 🚧
- [ ] JWT authentication
- [ ] User registration/login
- [ ] Protected routes
- [ ] Input validation
- [ ] File uploads
- [ ] Push notifications
- [ ] Testing suite
- [ ] CI/CD pipeline

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:19006
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
