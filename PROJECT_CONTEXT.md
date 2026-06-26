# Tayyab Traders - Project Context & Architecture Guide

**Last Updated**: May 3, 2026  
**Project Name**: Tayyab Traders  
**Type**: Full-Stack Mobile & Web Application  
**Status**: Active Development

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [Backend API Structure](#backend-api-structure)
6. [Mobile App Structure](#mobile-app-structure)
7. [Authentication & Authorization](#authentication--authorization)
8. [Services & Business Logic](#services--business-logic)
9. [Development Workflow](#development-workflow)
10. [Current Implementation Status](#current-implementation-status)
11. [Known Issues & TODOs](#known-issues--todos)

---

## 🎯 Project Overview

**Purpose**: Industrial equipment management system for Tayyab Traders

**Core Features**:
- 🏭 **Machine Management**: Track industrial equipment lifecycle (purchase → installation → shipment)
- 📍 **Installation Tracking**: Geographic mapping and installation site management
- 🚚 **Shipment Management**: Warehouse-to-warehouse and warehouse-to-client equipment transfers
- 🏢 **Warehouse Management**: Multi-location inventory management
- 👥 **Client Management**: Customer relationship and installation tracking
- 📊 **Dashboard**: Analytics and operational overview
- 📱 **Mobile-First**: React Native app for field operations

**Target Users**:
- Warehouse Managers
- Sales Operations Staff
- Technicians
- Super Admins

---

## 🏗️ Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────┐
│         React Native Mobile App         │
│       (Expo SDK 54.0.0, TypeScript)    │
│  └─ Screens, Navigation, Components    │
│  └─ Services (API, Auth, Domain)       │
│  └─ AuthContext (State Management)     │
└────────────────┬────────────────────────┘
                 │ HTTP/REST (Axios)
                 │ Bearer Token Auth
                 ▼
┌─────────────────────────────────────────┐
│     Node.js/Express Backend API         │
│    (TypeScript, Running on Port 5000)   │
│  └─ 9 Feature Modules                   │
│  └─ RBAC Middleware                     │
│  └─ Error Handling & Logging            │
└────────────────┬────────────────────────┘
                 │ Prisma ORM
                 │ Connection Pooling
                 ▼
        ┌─────────────────────┐
        │   PostgreSQL DB     │
        │  (Prisma Managed)   │
        │  11+ Models/Tables  │
        └─────────────────────┘
```

### Directory Structure
```
Tayyab_Traders/
├── backend/                  # Node.js Backend
│   ├── src/
│   │   ├── app.ts            # Express app config
│   │   ├── server.ts         # Server entry point
│   │   ├── config/           # Configuration
│   │   │   ├── database.ts   # Prisma setup
│   │   │   └── env.ts        # Environment variables
│   │   ├── middleware/       # Express middleware
│   │   │   └── errorHandler.ts
│   │   ├── modules/          # Feature modules (9 total)
│   │   │   ├── auth/
│   │   │   ├── client/
│   │   │   ├── dashboard/
│   │   │   ├── installation/
│   │   │   ├── machine/
│   │   │   ├── notifications/
│   │   │   ├── shipment/
│   │   │   ├── test/
│   │   │   └── warehouse/
│   │   ├── types/            # Shared TypeScript types
│   │   └── utils/            # Utilities (logger, geo, etc)
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Migration history (9 migrations)
│   │   └── seed.ts           # Seed script
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                   # React Native App
│   ├── src/
│   │   ├── screens/          # Screen components (11 screens)
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── MachineListScreen.tsx
│   │   │   ├── MachineDetailScreen.tsx
│   │   │   ├── MapScreen.tsx
│   │   │   ├── ShipmentListScreen.tsx
│   │   │   ├── AddMachineScreen.tsx
│   │   │   ├── UserManagementScreen.tsx
│   │   │   ├── WarehouseManagementScreen.tsx
│   │   │   └── index.ts
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ActivityItem.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FAB.tsx
│   │   │   ├── FilterChip.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── MachineCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ShipmentCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── UserCard.tsx
│   │   │   └── index.ts
│   │   ├── navigation/       # Navigation setup
│   │   │   ├── AppNavigator.tsx
│   │   │   └── index.ts
│   │   ├── services/         # API & domain services (8 files)
│   │   │   ├── api.ts        # Axios HTTP client
│   │   │   ├── auth.ts
│   │   │   ├── client.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── installation.ts
│   │   │   ├── machine.ts
│   │   │   ├── notifications.ts
│   │   │   ├── shipment.ts
│   │   │   └── warehouse.ts
│   │   ├── store/            # State management
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/            # Custom hooks
│   │   │   └── useResponsive.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── index.ts
│   │   └── utils/            # Utilities
│   │       └── theme.ts
│   ├── assets/
│   ├── App.tsx               # App entry point
│   ├── app.json
│   ├── metro.config.js
│   ├── babel.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                     # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── README.md
│
├── GIT_WORKFLOW.md           # Git branching strategy
└── PROJECT_CONTEXT.md        # This file
```

---

## 💻 Tech Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | v18+ |
| **Framework** | Express | 4.18.2 |
| **Language** | TypeScript | 5.3.3 |
| **ORM** | Prisma | 5.7.1 |
| **Database** | PostgreSQL | (via Prisma) |
| **Authentication** | JWT | 9.0.3 |
| **Password Hashing** | bcryptjs | 3.0.3 |
| **Security** | Helmet | 7.1.0 |
| **CORS** | cors | 2.8.5 |
| **Logging** | morgan | 1.10.0 |
| **Dev Server** | nodemon | 3.0.2 |

### Frontend (Mobile)
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React Native | 0.81.5 |
| **Development** | Expo | 54.0.0 |
| **Language** | TypeScript | 5.3.3 |
| **Navigation** | React Navigation | 6.1.9 |
| **Tab Navigation** | react-native-bottom-tabs | 6.5.11 |
| **UI Library** | React Native Paper | 5.11.6 |
| **Icons** | MaterialCommunityIcons | 15.0.3 |
| **HTTP Client** | Axios | 1.6.2 |
| **Maps** | react-native-maps | 1.20.1 |
| **Safe Area** | react-native-safe-area-context | 5.6.0 |
| **Gesture** | react-native-gesture-handler | 2.28.0 |

---

## 🗄️ Database Schema

### Models & Relationships

#### 1. **User** (Authentication)
```prisma
User {
  id          String @id @default(uuid())
  email       String @unique
  password    String (bcrypted)
  role        UserRole (enum: SUPER_ADMIN, WAREHOUSE_MANAGER, SALES_OPS, TECHNICIAN)
  warehouseId String? (FK to Warehouse)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 2. **Warehouse** (Inventory Locations)
```prisma
Warehouse {
  id          String @id @default(uuid())
  name        String
  address     String
  city        String
  manager     String?
  contact     String?
  capacity    Int?
  users       User[] (one-to-many)
  machines    Machine[] (one-to-many)
  shipmentsFrom Shipment[] (one-to-many)
  shipmentsTo Shipment[] (one-to-many)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 3. **Machine** (Equipment)
```prisma
Machine {
  id              String @id @default(uuid())
  serialNumber    String @unique
  model           String
  category        String
  purchaseDate    DateTime?
  cost            Decimal?
  status          String @default("IN_WAREHOUSE")
  warehouseId     String (FK to Warehouse)
  clientId        String? (FK to Client)
  installationId  String? (FK to Installation - current active installation)
  installations   Installation[] (one-to-many - all installations)
  statusHistory   MachineStatusHistory[] (one-to-many)
  shipmentItems   ShipmentItem[] (one-to-many)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### 4. **Client** (Customers)
```prisma
Client {
  id          String @id @default(uuid())
  name        String
  contact     String?
  address     String?
  city        String?
  country     String?
  machines    Machine[] (one-to-many)
  shipments   Shipment[] (one-to-many)
  installations Installation[] (one-to-many)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 5. **Installation** (On-Site Equipment)
```prisma
Installation {
  id          String @id @default(uuid())
  machineId   String (FK to Machine)
  clientId    String? (FK to Client)
  installedBy String
  latitude    Float? (geographic coordinate)
  longitude   Float? (geographic coordinate)
  siteAddress String? (human-readable address)
  siteNotes   String?
  status      InstallationStatus (enum: ACTIVE, REMOVED, MAINTENANCE)
  installedAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 6. **Shipment** (Equipment Transfers)
```prisma
Shipment {
  id                   String @id @default(uuid())
  trackingId           String? @unique
  fromWarehouseId      String (FK to Warehouse)
  toWarehouseId        String? (FK to Warehouse - optional for client shipments)
  toClientId           String? (FK to Client)
  shipmentDate         DateTime @default(now())
  expectedDeliveryDate DateTime?
  status               ShipmentStatus (enum: CREATED, DISPATCHED, IN_TRANSIT, DELIVERED, CANCELLED)
  deliveryConfirmation String?
  updatedBy            String
  notes                String?
  items                ShipmentItem[] (one-to-many)
  statusHistory        ShipmentStatusHistory[] (one-to-many)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### 7. **ShipmentItem** (Shipment Line Items)
```prisma
ShipmentItem {
  id         String @id @default(uuid())
  shipmentId String (FK to Shipment)
  machineId  String (FK to Machine)
  createdAt  DateTime @default(now())
  @@unique([shipmentId, machineId])
}
```

#### 8. **MachineStatusHistory** (Audit Trail)
```prisma
MachineStatusHistory {
  id        String @id @default(uuid())
  machineId String (FK to Machine)
  fromStatus String
  toStatus   String
  changedBy  String
  comment    String?
  createdAt  DateTime @default(now())
}
```

#### 9. **ShipmentStatusHistory** (Audit Trail)
```prisma
ShipmentStatusHistory {
  id         String @id @default(uuid())
  shipmentId String (FK to Shipment)
  fromStatus ShipmentStatus
  toStatus   ShipmentStatus
  changedBy  String
  comment    String?
  createdAt  DateTime @default(now())
}
```

### Enums
- **UserRole**: SUPER_ADMIN, WAREHOUSE_MANAGER, SALES_OPS, TECHNICIAN
- **ShipmentStatus**: CREATED, DISPATCHED, IN_TRANSIT, DELIVERED, CANCELLED
- **InstallationStatus**: ACTIVE, REMOVED, MAINTENANCE

### Key Relationships Summary
```
User → Warehouse (many-to-one)
Machine → Warehouse (many-to-one)
Machine → Client (many-to-one)
Machine → Installation (current active installation, one-to-one optional)
Machine ← Installation (all installations, one-to-many)
Installation → Client (many-to-one, optional)
Shipment → Warehouse (from/to, many-to-one)
Shipment → Client (many-to-one, optional)
Shipment → ShipmentItem → Machine (many-to-many through junction)
```

---

## 🔌 Backend API Structure

### Base Configuration
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **Default Timeout**: 10 seconds

### Health & Test Endpoints
```
GET  /health                 # Health check
GET  /api/test               # API connectivity test
```

### Module: Auth (`/api/auth`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/register` | None | Register new user (with guard) |
| POST | `/login` | None | User login, returns JWT token |
| GET | `/me` | Required | Get current user profile |

**Login Response**:
```json
{
  "user": { "id", "email", "role", "warehouseId" },
  "token": "jwt-token-string"
}
```

### Module: Machine (`/api/machine`)
| Method | Endpoint | Auth | Roles | Purpose |
|--------|----------|------|-------|---------|
| GET | `/` | Required | SA, WM, SO | List all machines |
| GET | `/:id` | Required | SA, WM, SO | Get machine by ID |
| GET | `/:id/history` | Required | SA, WM, SO | Get machine status history |
| POST | `/` | Required | SA, WM | Create new machine |
| PUT | `/:id` | Required | SA, WM | Update machine |
| DELETE | `/:id` | Required | SA, WM | Delete machine |
| PATCH | `/:id/status` | Required | SA, WM | Update machine status |

### Module: Installation (`/api/installation`)
| Method | Endpoint | Auth | Roles | Purpose |
|--------|----------|------|-------|---------|
| GET | `/` | Required | SA, WM, SO, TECH | List all installations |
| GET | `/map` | Required | SA, WM, SO, TECH | List installations for map view (lat/lng) |
| GET | `/unmapped` | Required | SA, WM, SO, TECH | List installations without coordinates |
| GET | `/:id` | Required | SA, WM, SO, TECH | Get installation by ID |
| POST | `/` | Required | SA, WM, SO | Create new installation |
| PUT | `/:id` | Required | SA, WM, SO | Update installation |
| DELETE | `/:id` | Required | SA, WM, SO | Delete installation |

### Module: Shipment (`/api/shipment`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | Required | List all shipments |
| POST | `/` | Required | Create new shipment |
| GET | `/:id` | Required | Get shipment by ID |
| PUT | `/:id` | Required | Update shipment |
| DELETE | `/:id` | Required | Delete shipment |
| PATCH | `/:id/status` | Required | Update shipment status |

### Module: Warehouse (`/api/warehouse`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | Required | List all warehouses |
| POST | `/` | Required | Create warehouse |
| GET | `/:id` | Required | Get warehouse by ID |
| PUT | `/:id` | Required | Update warehouse |
| DELETE | `/:id` | Required | Delete warehouse |

### Module: Client (`/api/client`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | Required | List all clients |
| POST | `/` | Required | Create client |
| GET | `/:id` | Required | Get client by ID |
| PUT | `/:id` | Required | Update client |
| DELETE | `/:id` | Required | Delete client |

### Module: Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/stats` | Required | Get dashboard statistics |
| GET | `/overview` | Required | Get operational overview |

### Module: Notifications (`/api/notifications`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | Required | List notifications |
| POST | `/` | Required | Create notification |
| PATCH | `/:id/read` | Required | Mark notification as read |

### Role Abbreviations
- **SA** = SUPER_ADMIN
- **WM** = WAREHOUSE_MANAGER
- **SO** = SALES_OPS
- **TECH** = TECHNICIAN

### Error Response Format
```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2026-05-03T10:30:00Z"
}
```

---

## 📱 Mobile App Structure

### Navigation Hierarchy
```
Root Navigator (Stack)
├── Auth Stack (Unauthenticated)
│   ├── LoginScreen
│   └── SignupScreen
│
└── Main Stack (Authenticated)
    ├── Bottom Tab Navigator
    │   ├── Dashboard Tab
    │   │   └── DashboardScreen
    │   ├── Machines Tab
    │   │   ├── MachineListScreen
    │   │   └── MachineDetailScreen (modal/stack)
    │   ├── Shipments Tab
    │   │   └── ShipmentListScreen
    │   ├── Map Tab
    │   │   └── MapScreen
    │   └── Warehouses Tab
    │       └── WarehouseManagementScreen
    │
    └── Modal/Stack Screens
        ├── AddMachineScreen
        ├── UserManagementScreen
        └── (Additional detail screens)
```

### Custom Tab Bar
- **Tabs**: Dashboard, Machines, Shipments, Map, Warehouses
- **Icons**: MaterialCommunityIcons
- **Active Indicator**: Color change + background highlight
- **Safe Area**: Bottom padding respect for notches/home indicators

### Screens (11 Total)

| Screen | Purpose | Type | Auth |
|--------|---------|------|------|
| **LoginScreen** | User authentication | Stack | No |
| **SignupScreen** | User registration | Stack | No |
| **DashboardScreen** | Home/Overview | Tab | Yes |
| **MachineListScreen** | List all machines | Tab | Yes |
| **MachineDetailScreen** | Machine details & history | Stack Modal | Yes |
| **MapScreen** | Geographic installation view | Tab | Yes |
| **ShipmentListScreen** | Shipment tracking | Tab | Yes |
| **AddMachineScreen** | Create/edit machine | Modal | Yes |
| **UserManagementScreen** | User management | Stack | Yes |
| **WarehouseManagementScreen** | Warehouse operations | Tab | Yes |
| **Test Screen** | (if exists) | - | - |

### Reusable Components (14 Total)
- **ActivityItem**: History/activity list item
- **Button**: Custom action button
- **Card**: Generic content container
- **EmptyState**: Empty list placeholder
- **FAB**: Floating action button
- **FilterChip**: Filter selection chip (status, category, etc)
- **Header**: Screen header with title & actions
- **Input**: Text input field
- **MachineCard**: Machine info card
- **SearchBar**: Search input with filters
- **ShipmentCard**: Shipment info card
- **StatCard**: Statistics display card
- **StatusBadge**: Status indicator badge
- **UserCard**: User profile card

### Theme System
- **Primary Color**: Brand blue
- **Background**: Dark theme (#1a1a1a or similar)
- **Text Colors**: Primary, Secondary, Muted
- **Spacing**: Consistent scale (xs, sm, md, lg, xl)
- **Border Radius**: Consistent roundness
- **Font Sizes**: Fixed scale for typography

---

## 🔐 Authentication & Authorization

### JWT Token Flow
```
1. User Login (POST /auth/login)
   ├─ Validate email/password
   ├─ Hash comparison (bcryptjs)
   └─ Generate JWT Token
         ├─ Payload: { id, email, role, warehouseId }
         ├─ Secret: From env (HS256)
         └─ Expiry: Configurable

2. Mobile Storage
   └─ Store token in AsyncStorage (or secure storage)

3. API Requests
   ├─ Add to header: "Authorization: Bearer {token}"
   └─ Via: setAuthToken(token) in api.ts

4. Backend Verification
   ├─ authMiddleware (verify token)
   └─ rbac.middleware (check role permissions)
```

### RBAC (Role-Based Access Control)
```
Roles Hierarchy:
┌─ SUPER_ADMIN
│  └─ Can: Everything
├─ WAREHOUSE_MANAGER
│  └─ Can: Manage warehouse, machines, shipments, installations
├─ SALES_OPS
│  └─ Can: View/Create machines, shipments, installations
└─ TECHNICIAN
   └─ Can: View installations, machines, shipments
```

### Middleware Chain
```
Request
  ↓
  └─ CORS
  └─ Helmet (Security headers)
  └─ Morgan (HTTP Logging)
  └─ Body Parser
  └─ Routes
       ├─ authMiddleware (JWT verification)
       └─ requireAnyRole (role check)
  ↓
Controller (Process)
  ↓
Response/Error
```

### Register Guard
- Prevents registration if not explicitly allowed
- Can be enabled/disabled via environment variable
- Default: Disabled (registration by admin only)

---

## 🔧 Services & Business Logic

### Backend Services (Module Pattern)
Each module follows a 3-layer architecture:

```
Module Structure:
├── {module}.routes.ts       # Express routes
├── {module}.controller.ts   # Request handlers
├── {module}.service.ts      # Business logic
├── {module}.middleware.ts   # Module-specific middleware
└── types.ts                 # TypeScript interfaces
```

### Mobile Services (API Layer)
Located in `src/services/`:

- **api.ts**: HTTP client setup, interceptors, generic methods
- **auth.ts**: Auth endpoints & token management
- **machine.ts**: Machine CRUD & queries
- **installation.ts**: Installation CRUD & map data
- **shipment.ts**: Shipment tracking & updates
- **warehouse.ts**: Warehouse operations
- **client.ts**: Client management
- **dashboard.ts**: Analytics & statistics
- **notifications.ts**: Notification management

### Service Call Pattern
```typescript
// Example from machine.ts
export const getMachines = async (filters?: object) => {
  try {
    const response = await api.get('/machine', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch machines:', error);
    throw error;
  }
};
```

---

## 🔄 Development Workflow

### Git Branching Strategy
- **main**: Production releases (stable, never broken)
- **develop**: Daily development integration branch
- **hotfix/**: Emergency fixes from main

**Basic Workflow**:
```bash
# Always work on develop
git checkout develop

# Create feature work
git add .
git commit -m "feat: add shipment module"
git push origin develop

# When ready for production
git checkout main
git merge develop
git push origin main
```

### Development Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with DATABASE_URL
npx prisma migrate dev
npm run dev
# Runs on http://localhost:5000
```

#### Mobile
```bash
cd mobile
npm install
npm start
# Then press 'a' for Android or 'i' for iOS
```

### Available Scripts

**Backend**:
- `npm run dev`: Start dev server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run compiled server
- `npx prisma generate`: Generate Prisma client
- `npx prisma migrate dev`: Run migrations
- `npx prisma studio`: Web UI for database

**Mobile**:
- `npm start`: Start Expo dev server
- `npm run android`: Run on Android emulator
- `npm run ios`: Run on iOS simulator
- `npm run web`: Run in web browser

---

## ✅ Current Implementation Status

### Backend (90% Complete)
| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Done | JWT, bcrypt, roles |
| Machine Module | ✅ Done | CRUD, status tracking |
| Installation Module | ✅ Done | Geo-coordinates, status |
| Shipment Module | ✅ Done | Multi-status workflow |
| Warehouse Module | ✅ Done | Inventory locations |
| Client Module | ✅ Done | Customer management |
| Dashboard Stats | ✅ Done | Overview & analytics |
| Notifications | ✅ Done | Basic notification system |
| RBAC | ✅ Done | Role-based permissions |
| Database Migrations | ✅ Done | 9 migrations tracked |

### Mobile (70% Complete)
| Feature | Status | Notes |
|---------|--------|-------|
| Auth Screens | ✅ Done | Login, Signup forms |
| Navigation | ✅ Done | Bottom tabs, stack navigator |
| Dashboard Screen | ⚠️ Partial | UI done, analytics integration needed |
| Machine List | ✅ Done | List view with filters |
| Machine Detail | ⚠️ Partial | Detail view, modal done |
| Shipment List | ✅ Done | List view, status filtering |
| Map Screen | ❌ Not Started | Static mock, needs real integration |
| Warehouse Screen | ✅ Done | Basic UI |
| Components | ✅ Done | 14 reusable components |
| State Management | ✅ Done | AuthContext implemented |
| API Integration | ✅ Done | Axios client with interceptors |

### Documentation
| Item | Status |
|------|--------|
| README.md | ✅ Done |
| API.md | ✅ Done |
| DEPLOYMENT.md | ✅ Done |
| GIT_WORKFLOW.md | ✅ Done |
| PROJECT_CONTEXT.md | ✅ Done (this file) |

---

## ⚠️ Known Issues & TODOs

### Bugs/Issues
- [ ] MapScreen shows static mock data instead of real installations
- [ ] Installation service returns limited data (missing some fields)
- [ ] Map library not installed (react-native-maps is in package.json but integration incomplete)
- [ ] Dashboard analytics might not reflect all data correctly
- [ ] No offline support/caching strategy

### Features To Implement
- [ ] **Map Integration**: Real-time installation mapping with coordinates
  - Install expo-location for GPS
  - Implement map clustering
  - Add marker info windows
  
- [ ] **Push Notifications**: Real-time alerts for shipments/installations
  - Set up Expo Notifications
  - Backend notification service
  
- [ ] **Offline Support**: App works without internet
  - Implement Redux/Zustand for caching
  - Background sync strategy
  
- [ ] **Search & Filters**: Advanced filtering across all screens
  - Date range filters
  - Multi-select filters
  
- [ ] **Export/Reporting**: Generate reports (PDF, Excel)
  - Shipment reports
  - Machine inventory reports
  
- [ ] **Settings Screen**: User preferences & account settings
  - Language/theme
  - Notification preferences
  - Account management

### Performance Optimizations
- [ ] Implement pagination for large lists
- [ ] Add image caching for profile pictures
- [ ] Optimize list renders (FlatList virtualization)
- [ ] Bundle size reduction

### Security Enhancements
- [ ] Implement refresh token strategy
- [ ] Add request signing for sensitive operations
- [ ] Implement rate limiting on backend
- [ ] Add API request validation (Joi/Zod)

### Code Quality
- [ ] Add unit tests (backend & mobile)
- [ ] Add E2E tests
- [ ] Setup CI/CD pipeline
- [ ] Add error boundary components
- [ ] Improve error messages & user feedback

---

## 📞 Quick Reference

### Common API Calls
```bash
# Get all machines
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/machine

# Create shipment
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"fromWarehouseId":"...", "toClientId":"...", ...}' \
  http://localhost:5000/api/shipment

# Get installations for map
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/installation/map
```

### Environment Variables

**Backend (.env)**:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/tayyab_traders
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
ALLOW_REGISTRATION=false
```

**Mobile (.env.local or via Expo)**:
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### Database Commands
```bash
# Create migration
npx prisma migrate dev --name "add_feature"

# View database
npx prisma studio

# Generate client (if schema changed)
npx prisma generate

# Seed database
npx prisma db seed
```

---

## 📚 Additional Resources

- **Backend Docs**: See [docs/API.md](docs/API.md)
- **Deployment**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Git Workflow**: See [GIT_WORKFLOW.md](GIT_WORKFLOW.md)
- **Prisma Docs**: https://www.prisma.io/docs/
- **React Navigation**: https://reactnavigation.org/
- **Express Docs**: https://expressjs.com/

---

## 🎯 Next Steps

### Immediate Priorities
1. **Complete MapScreen Integration**
   - Real installation data fetching
   - Marker clustering
   - Location search & zoom
   
2. **Testing & QA**
   - Test all screens
   - Test API endpoints
   - Bug fixing
   
3. **Offline Support**
   - Data caching strategy
   - Background sync
   
4. **Deployment Preparation**
   - Environment configuration
   - API key management
   - Database backup strategy

---

**Document Maintenance**: Update this file when adding new features, modules, or making significant architectural changes. Keep it synchronized with the actual codebase.
