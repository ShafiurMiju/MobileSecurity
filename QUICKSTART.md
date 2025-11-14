# 🚀 Quick Start Guide

## What You Have

A complete security monitoring system with:
1. ✅ **Backend API** - Already created and ready
2. ✅ **Monitoring App** - Template ready (React Native)
3. ✅ **Admin Dashboard App** - Template ready (React Native)

## Step-by-Step Setup (30 minutes)

### Step 1: Backend Setup (10 min)

1. **Run setup script:**
```bash
cd /Users/aryanemon/Desktop/App/security-monitor
./setup.sh
```

2. **Edit configuration:**
```bash
cd backend
nano .env
```

Update these values:
- `JWT_SECRET` - Change to any random long string
- `MONGODB_URI` - Keep default if MongoDB is local

3. **Start backend:**
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

Keep this terminal open!

### Step 2: Create Admin Account

Open a new terminal:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","name":"Admin User"}'
```

Save the token returned for testing.

### Step 3: Monitoring App Setup (10 min)

Open a **new terminal**:

```bash
cd /Users/aryanemon/Desktop/App/security-monitor/monitoring-app

# Initialize React Native project
npx react-native@latest init MonitoringApp

cd MonitoringApp

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios react-native-device-info
npm install @react-native-community/netinfo
```

**Get your computer's IP:**
```bash
# macOS
ipconfig getifaddr en0
# or
ifconfig | grep "inet "
```

Create config file:
```bash
mkdir -p src/config
cat > src/config/api.ts << 'EOF'
export const API_URL = 'http://YOUR_IP_HERE:5000';
// Replace YOUR_IP_HERE with your actual IP from above
EOF
```

Edit the file and replace `YOUR_IP_HERE` with your actual IP.

### Step 4: Admin App Setup (10 min)

Open another **new terminal**:

```bash
cd /Users/aryanemon/Desktop/App/security-monitor/admin-app

# Initialize React Native project
npx react-native@latest init AdminApp

cd AdminApp

# Install dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios react-native-vector-icons
```

Create config file:
```bash
mkdir -p src/config
cat > src/config/api.ts << 'EOF'
export const API_URL = 'http://YOUR_IP_HERE:5000';
// Replace YOUR_IP_HERE with your actual IP
EOF
```

Edit the file and replace `YOUR_IP_HERE` with your actual IP.

## Testing the System

### Test Backend API

```bash
# Health check
curl http://localhost:5000/

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Run Monitoring App

```bash
cd /Users/aryanemon/Desktop/App/security-monitor/monitoring-app/MonitoringApp

# For Android (connect device or start emulator first)
npx react-native run-android

# For iOS (macOS only)
npx react-native run-ios
```

### Run Admin App

```bash
cd /Users/aryanemon/Desktop/App/security-monitor/admin-app/AdminApp

# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

## What Happens Next?

1. **Monitoring App** will:
   - Show login screen
   - After login, register the device
   - Start monitoring service (visible notification)
   - Log unlock/lock events to backend

2. **Admin App** will:
   - Show login screen
   - After login, show dashboard
   - Display all devices and events
   - Show screenshots (if any)

## Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

### Can't connect from app
- Check firewall settings
- Ensure backend is running
- Verify IP address in config
- Both devices must be on same WiFi

### React Native errors
```bash
# Clear cache
npx react-native start --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..

# Reinstall dependencies
rm -rf node_modules && npm install
```

## Next Steps

### Customize the Apps

I've created the backend and structure. To create full functional apps, you need to:

1. **Monitoring App** - Create UI screens:
   - Login/Register screen
   - Monitoring status screen
   - Settings screen
   - Background service implementation

2. **Admin App** - Create UI screens:
   - Login screen
   - Dashboard with statistics
   - Device list
   - Events list
   - Screenshots gallery
   - Settings

Would you like me to create these React Native screens and components now?

## Important Reminders

⚠️ **Legal Use Only**
- Read `LEGAL.md` carefully
- Only use on devices you own
- Inform all device users
- Comply with local laws

✅ **Features Included**
- User authentication
- Device management
- Event logging
- Screenshot upload/viewing
- Real-time monitoring
- Secure API

📚 **Documentation**
- `README.md` - Overview
- `backend/README.md` - Backend setup
- `monitoring-app/README.md` - Monitoring app
- `admin-app/README.md` - Admin app
- `DEPLOYMENT.md` - Production deployment
- `LEGAL.md` - Legal compliance

## Getting Help

If you need help:
1. Check README files
2. Review API documentation
3. Check terminal for errors
4. Verify all services are running
5. Ask specific questions

Ready to build the React Native UI components? Let me know!
