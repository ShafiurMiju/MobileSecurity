#!/bin/bash

echo "🚀 Security Monitor - Quick Setup Script"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "Backend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and update the configuration"
else
    echo ".env file already exists"
fi

cd ..
echo ""

# Check MongoDB
echo "🍃 Checking MongoDB..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is installed"
elif command -v brew &> /dev/null; then
    echo "MongoDB not found. Would you like to install it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        brew tap mongodb/brew
        brew install mongodb-community
        brew services start mongodb-community
        echo "✅ MongoDB installed and started"
    fi
else
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use MongoDB Atlas"
    echo "   Visit: https://www.mongodb.com/try/download/community"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env file with your configuration"
echo "   2. Start backend: cd backend && npm run dev"
echo "   3. Setup React Native apps (see monitoring-app/README.md and admin-app/README.md)"
echo ""
