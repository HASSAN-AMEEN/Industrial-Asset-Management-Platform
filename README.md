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
   If your mobile device is on the same LAN and Expo can't connect, use the helper script which auto-detects your current LAN IP and updates the local env files, then starts Expo bound to that IP.

   - Windows PowerShell (from repository root):
      ```powershell
      # run once to update env files and start Expo
      .\scripts\start-expo.ps1
      ```

   - macOS / Linux (manual):
      ```bash
      # Auto-detect IP (example, add your own helper if desired)
      node ./scripts/set-lan-ip.js
      REACT_NATIVE_PACKAGER_HOSTNAME=$(node -e "const os=require('os');const ifaces=os.networkInterfaces();for(const k in ifaces){for(const i of ifaces[k]){if(i.family==='IPv4' && !i.internal){console.log(i.address);process.exit(0);}}}throw new Error('noip')") npm start -- --host lan
      ```

   Notes:
   - The `scripts/set-lan-ip.js` script updates `mobile/.env.local` and `backend/.env.local` with the detected LAN IPv4 address (so API URLs stay correct after network changes and never affect production env files).
   - Ensure your Windows network profile is set to **Private** and firewall rules allow ports `8082` (Expo Metro) and `5000` (backend).
   - If you prefer an mDNS/hostname solution, install Bonjour (Windows) and use `your-machine-name.local` instead of numeric IPs; otherwise the provided scripts keep the repo in sync with your current LAN IP.

4. Run on your preferred platform:
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

### One-command local development

From the repository root, start both backend and Expo with one command:

```powershell
npm run dev:wifi
```

What it does:
- Detects your current LAN IP.
- Updates `mobile/.env.local` and `backend/.env.local`.
- Starts the backend server.
- Starts Expo in LAN mode on port `8082`.

Use this every time you change Wi-Fi networks or reconnect to the router.

Shortcut from PowerShell if you want to keep the same terminal style:

```powershell
.\scripts\run-app.ps1 -Mode wifi
```

### Remote demo over tunnel

Expo tunnel only carries the app bundle. For a client in another city, the API must also be public.

If your backend is deployed publicly, run:

```powershell
npm run dev:tunnel -- --api-url https://your-public-api.example.com/api
```

This will:
- write the public API URL to `mobile/.env.local`,
- update `backend/.env.local` so generated upload URLs point to the public backend,
- start Expo in tunnel mode.

PowerShell shortcut:

```powershell
.\scripts\run-app.ps1 -Mode tunnel -ApiUrl https://your-public-api.example.com/api
```

If you do not have a public backend yet, tunnel mode alone will not be enough for the app to work end-to-end.

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
