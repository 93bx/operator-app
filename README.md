# The Operator App

A comprehensive water services monitoring application for NGOs, supporting both mobile and web platforms with bilingual support (Arabic/English).

## 🏗️ Architecture

- **Mobile App**: React Native (Expo) - iOS & Android
- **Web Dashboard**: React.js - Admin interface
- **Backend API**: Node.js + Express + PostgreSQL
- **Database**: PostgreSQL with Docker
- **Deployment**: Dockerized for local and cloud deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Expo CLI (for mobile development)

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd operator-app
npm run setup
```

2. **Start with Docker**:
```bash
npm run docker:up
```

3. **Or run locally**:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Web Dashboard
npm run dev:web

# Terminal 3 - Mobile App
npm run dev:mobile
```

## 📱 Mobile App
- **Port**: Expo development server
- **Features**: Offline-first, bilingual, daily readings, fault reporting
- **Platforms**: iOS & Android

## 🌐 Web Dashboard
- **URL**: http://localhost:3000
- **Features**: Station map, fault management, user management, analytics
- **Languages**: Arabic (default) & English

## 🔧 Backend API
- **URL**: http://localhost:3001
- **Features**: Authentication, CRUD operations, file uploads, sync
- **Database**: PostgreSQL on port 5432

## 🗄️ Database
- **Host**: localhost:5432
- **Database**: operator_app
- **User**: operator
- **Password**: operator123

## 🔐 Default Credentials
- **Admin**: admin@operator.com / admin123
- **Operator**: operator@operator.com / operator123

## 📋 Features

### Mobile App (Operators)
- ✅ Bilingual login (Arabic default)
- ✅ Station dashboard with offline support
- ✅ Daily readings form (pH, TDS, temperature, pressure, tank level)
- ✅ Fault reporting with photo upload
- ✅ Offline-first architecture with SQLite
- ✅ Automatic data synchronization
- ✅ Push notifications
- ✅ Camera integration
- ✅ GPS location services
- ✅ Offline data storage

### Web Dashboard (Admin)
- ✅ Bilingual interface (Arabic/English)
- ✅ Interactive station map
- ✅ Fault management system
- ✅ Daily readings charts
- ✅ User & role management
- ✅ Real-time data updates
- ✅ Responsive design

### Backend API
- ✅ JWT authentication with refresh
- ✅ Role-based access control
- ✅ Complete CRUD operations
- ✅ File upload handling
- ✅ Offline sync endpoints
- ✅ Audit logging
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Database optimization

## 🐳 Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up --build
```

## 🧪 Testing

```bash
# Run backend tests
npm run test:backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Mobile App Guide](docs/MOBILE_APP_GUIDE.md) - Mobile development guide

## 📦 Deployment

The application is Docker-ready for deployment on AWS, DigitalOcean, or any Docker-compatible platform.

## 🌍 Internationalization

- **Default Language**: Arabic (RTL)
- **Secondary Language**: English (LTR)
- **Implementation**: i18next with react-i18next

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Data encryption at rest (AES-256)
- TLS in transit
- Audit logging

## 📊 Monitoring

- Centralized logging
- Error tracking
- Performance monitoring
- Health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
