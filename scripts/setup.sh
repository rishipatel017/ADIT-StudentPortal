#!/bin/bash

echo "🚀 Setting up IT Department ERP System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   You can install it using: brew install postgresql (macOS)"
    echo "   Or: sudo apt-get install postgresql postgresql-contrib (Ubuntu)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo "📦 Setting up backend..."
cd backend

# Install dependencies
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update your database credentials."
fi

# Generate Prisma client
npx prisma generate

# Setup database (if DATABASE_URL is configured)
if grep -q "your-database-credentials" .env; then
    echo "⚠️  Please update your database credentials in backend/.env file"
    echo "   Then run: cd backend && npx prisma migrate dev"
else
    echo "🗄️  Running database migrations..."
    npx prisma migrate dev --name init
fi

cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
    echo "📝 Created .env.local file"
fi

cd ..

echo "✅ Setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Update database credentials in backend/.env"
echo "2. Run database migrations: cd backend && npx prisma migrate dev"
echo "3. Start backend: cd backend && npm run start:dev"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   API Documentation: http://localhost:3001/api"
echo ""
echo "🐳 For Docker deployment:"
echo "   docker-compose up -d"
