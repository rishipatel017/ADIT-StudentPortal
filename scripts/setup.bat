@echo off
echo 🚀 Setting up IT Department ERP System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo    Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup backend
echo 📦 Setting up backend...
cd backend

REM Install dependencies
call npm install

REM Create environment file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo 📝 Created .env file. Please update your database credentials.
)

REM Generate Prisma client
call npx prisma generate

REM Check if database credentials are updated
findstr /C:"your-database-credentials" .env >nul
if %errorlevel% equ 0 (
    echo ⚠️  Please update your database credentials in backend\.env file
    echo    Then run: cd backend ^&^& npx prisma migrate dev
) else (
    echo 🗄️  Running database migrations...
    call npx prisma migrate dev --name init
)

cd ..

REM Setup frontend
echo 🎨 Setting up frontend...
cd frontend

REM Install dependencies
call npm install

REM Create environment file if it doesn't exist
if not exist .env.local (
    echo NEXT_PUBLIC_API_URL=http://localhost:3001 > .env.local
    echo 📝 Created .env.local file
)

cd ..

echo ✅ Setup completed!
echo.
echo 🎯 Next steps:
echo 1. Update database credentials in backend\.env
echo 2. Run database migrations: cd backend ^&^& npx prisma migrate dev
echo 3. Start backend: cd backend ^&^& npm run start:dev
echo 4. Start frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 Application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    API Documentation: http://localhost:3001/api
echo.
echo 🐳 For Docker deployment:
echo    docker-compose up -d
pause
