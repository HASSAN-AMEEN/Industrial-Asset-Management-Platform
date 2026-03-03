# Deployment Guide

## Backend Deployment

### Production Environment Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=5000
   DATABASE_URL="postgresql://username:password@host:5432/database"
   JWT_SECRET=your-production-jwt-secret
   FRONTEND_URL=https://your-app.com
   ```

2. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   ```

3. **Build and Start**
   ```bash
   # Build the application
   npm run build
   
   # Start production server
   npm start
   ```

### Docker Deployment

Create a `Dockerfile` in the backend directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/server.js --name "backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Mobile Deployment

### App Store (iOS)

1. **Build for Production**
   ```bash
   cd mobile
   expo build:ios
   ```

2. **Requirements**
   - Apple Developer Account ($99/year)
   - Xcode
   - iOS device for testing

3. **Steps**
   - Configure app.json with iOS settings
   - Upload to App Store Connect
   - Submit for review

### Google Play Store (Android)

1. **Build for Production**
   ```bash
   cd mobile
   expo build:android
   ```

2. **Requirements**
   - Google Play Developer Account ($25 one-time)
   - Android Studio
   - Signing key

3. **Steps**
   - Configure app.json with Android settings
   - Generate signed APK/AAB
   - Upload to Google Play Console

### Expo Application Services (EAS)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   cd mobile
   eas build:configure
   ```

3. **Build**
   ```bash
   # Build for all platforms
   eas build --platform all
   
   # Build for specific platform
   eas build --platform ios
   eas build --platform android
   ```

## Environment-Specific Configurations

### Development
- Use local database
- Enable debug logging
- Hot reload enabled

### Staging
- Use staging database
- Enable debug logging
- Test production-like environment

### Production
- Use production database
- Minimal logging
- Optimized builds
- Security headers enabled

## Security Considerations

### Backend
1. **Environment Variables**
   - Never commit `.env` files
   - Use strong secrets
   - Rotate keys regularly

2. **Database**
   - Use SSL connections
   - Implement proper indexing
   - Regular backups

3. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration
   - HTTPS only

### Mobile
1. **Code Security**
   - Obfuscate production builds
   - Remove debug code
   - Secure API keys

2. **Data Protection**
   - Encrypt sensitive data
   - Secure storage
   - Certificate pinning

## Monitoring and Logging

### Backend Monitoring
```bash
# PM2 Monitoring
pm2 monit

# Log files
tail -f logs/combined.log
tail -f logs/error.log
```

### Mobile Analytics
- Firebase Analytics
- Sentry for error tracking
- Custom analytics endpoints

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      run: |
        # Your deployment script here
        echo "Deploying to production..."
```

## Backup Strategy

### Database Backups
```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Application Backups
- Version control (Git)
- Environment configurations
- Build artifacts

## Troubleshooting

### Common Issues

1. **Database Connection**
   - Check connection string
   - Verify network connectivity
   - Check database credentials

2. **Port Conflicts**
   - Use different ports
   - Check for running processes
   - Configure firewall rules

3. **Build Failures**
   - Clear node_modules
   - Update dependencies
   - Check environment variables

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Database connection
npx prisma db pull

# Mobile build
expo doctor
```
