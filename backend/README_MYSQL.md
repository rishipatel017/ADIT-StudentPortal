# MySQL Setup for ADIT Campus ERP

This guide will help you set up MySQL database for the ADIT Campus ERP system.

## Prerequisites

1. **Install MySQL Server**
   - **Windows**: Download from [MySQL Official Website](https://dev.mysql.com/downloads/mysql/)
   - **macOS**: `brew install mysql`
   - **Linux (Ubuntu)**: `sudo apt-get install mysql-server`

2. **Start MySQL Service**
   - **Windows**: Start MySQL service from Services
   - **macOS**: `brew services start mysql`
   - **Linux**: `sudo systemctl start mysql`

3. **Set Root Password** (if not set during installation)
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
   FLUSH PRIVILEGES;
   ```

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run MySQL Setup Script
```bash
npm run mysql:setup
```

This script will:
- Connect to MySQL server
- Create the `erp_db` database
- Provide next steps for Prisma setup

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Push Database Schema
```bash
npm run prisma:push
```

### 5. (Optional) Seed Database
```bash
npm run prisma:seed
```

### 6. Start Development Server
```bash
npm run start:dev
```

## Manual Setup

If you prefer manual setup:

### 1. Create Database
```sql
mysql -u root -p
CREATE DATABASE erp_db;
EXIT;
```

### 2. Update .env File
Make sure your `.env` file has the correct MySQL connection string:
```
DATABASE_URL="mysql://root:password@localhost:3306/erp_db"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Push Schema to Database
```bash
npx prisma db push
```

## Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/erp_db"

# JWT
JWT_SECRET="69ad6814-2b9c-8323-ba96-74188e08c873"
JWT_EXPIRES_IN="7d"

# App
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

### Prisma Schema
The Prisma schema is already configured for MySQL in `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Make sure MySQL server is running
   - Check if MySQL is on default port 3306

2. **Access Denied**
   - Verify MySQL credentials in .env file
   - Ensure user has CREATE DATABASE permissions

3. **Database Already Exists**
   - The setup script handles this automatically
   - Or manually: `DROP DATABASE IF EXISTS erp_db;`

### Reset Database
```bash
npm run prisma:reset --force
```

### View Database
```bash
npm run prisma:studio
```

## Migration from PostgreSQL

If you're migrating from PostgreSQL:

1. **Backup existing data** (if any)
2. **Update .env file** with MySQL connection string
3. **Run setup script** above
4. **Recreate any test data** using seed scripts

## MySQL Commands Reference

```sql
-- Connect to MySQL
mysql -u root -p

-- Show databases
SHOW DATABASES;

-- Use database
USE erp_db;

-- Show tables
SHOW TABLES;

-- Describe table
DESCRIBE users;

-- Drop database (if needed)
DROP DATABASE erp_db;
```

## Support

If you encounter issues:

1. Check MySQL service status
2. Verify credentials in .env file
3. Ensure MySQL user has proper permissions
4. Check network connectivity to MySQL server

For additional help, refer to:
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Prisma MySQL Guide](https://www.prisma.io/docs/concepts/database-connectors/mysql)
