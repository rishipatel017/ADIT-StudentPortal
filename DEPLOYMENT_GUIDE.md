# ADIT Campus ERP - Deployment Guide

## System Overview
This is a fully functional, deployable ERP system for IT Department management with proper database integration and authentication.

## Fixed Issues ✅
- ❌ **Removed hardcoded mock data** → ✅ **Real database integration**
- ❌ **Fixed login authentication** → ✅ **Proper database authentication**
- ❌ **Fixed navigation routing** → ✅ **Role-based page routing**
- ❌ **Fixed API endpoints** → ✅ **Proper API integration**
- ❌ **Fixed dependency injection** → ✅ **All NestJS modules working**

## Database Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Configuration
Ensure you have MySQL running and update your `.env` file:
```env
DATABASE_URL="mysql://username:password@localhost:3306/erp_database"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
```

### 3. Database Migration & Seeding
```bash
cd backend

# Setup database (generate client, run migrations, seed data)
npm run db:setup

# Or step by step:
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Default Login Credentials
After seeding, you can login with:

### Admin User
- **Email**: admin@itcollege.edu
- **Password**: admin123
- **Role**: ADMIN

### Faculty User
- **Email**: hod@itcollege.edu
- **Password**: faculty123
- **Role**: FACULTY

### Student User
- **Email**: rahul@itcollege.edu
- **Password**: student123
- **Role**: STUDENT

## Running the Application

### Backend Server
```bash
cd backend
npm run start:dev
```
Backend will run on: `http://localhost:3001`

### Frontend Application
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:3000`

## Features Implemented

### 🔐 Authentication System
- JWT-based authentication
- Role-based access control (ADMIN, FACULTY, STUDENT)
- Protected routes with proper guards
- Session management with auto-logout

### 📊 Dashboard System
- **Admin Dashboard**: Manage students, faculty, subjects, divisions
- **Faculty Dashboard**: Attendance, assignments, marks management
- **Student Dashboard**: View attendance, assignments, marks

### 🗄️ Database Integration
- Real data from MySQL database
- Proper relationships between entities
- Seeded with initial data for testing

### 🎨 Modern UI/UX
- Responsive design
- Professional interface
- Error handling and loading states
- Toast notifications

### 🚀 Performance Optimizations
- Virtual scrolling for large datasets
- Caching strategies
- Optimized API calls
- Error boundaries

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Admin Routes
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/students` - All students
- `GET /admin/faculty` - All faculty
- `GET /admin/subjects` - All subjects
- `GET /admin/divisions` - All divisions

### Academic Routes
- `GET /academic/semesters` - All semesters
- `GET /academic/divisions?semesterId=X` - Divisions by semester
- `GET /academic/subjects?semesterId=X` - Subjects by semester
- `GET /academic/students?semesterId=X&divisionId=Y` - Students by semester/division

## Deployment Notes

### Environment Variables
Required for production:
```env
DATABASE_URL="mysql://user:pass@host:3306/dbname"
JWT_SECRET="production-secret-key"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_API_URL="https://your-backend-domain.com"
```

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Limit database user permissions

### Production Build
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL format
2. **Authentication Failures**: Verify seeded users exist
3. **API Errors**: Check backend logs for dependency issues
4. **Frontend Errors**: Verify NEXT_PUBLIC_API_URL is correct

### Reset Database
```bash
cd backend
npm run prisma:reset --force
npm run prisma:seed
```

## System Architecture
- **Backend**: NestJS with Prisma ORM
- **Frontend**: Next.js with TypeScript
- **Database**: MySQL
- **Authentication**: JWT with bcrypt
- **Styling**: Tailwind CSS

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- SQL injection prevention (Prisma ORM)

This is now a production-ready, deployable ERP system with proper database integration and authentication!
