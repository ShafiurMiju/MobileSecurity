# Security Monitor - Complete Setup Guide

This project consists of 3 parts:
1. **Backend API** (Node.js/Express/MongoDB)
2. **Monitoring App** (React Native - runs on target device)
3. **Admin App** (React Native - dashboard to view logs)

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- React Native development environment setup
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

## Setup Order

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file
npm run dev
```
Backend will run on http://localhost:5000

### 2. Monitoring App Setup
```bash
cd monitoring-app
npx react-native init MonitoringApp --template react-native-template-typescript
# Follow instructions in monitoring-app/README.md
```

### 3. Admin App Setup
```bash
cd admin-app
npx react-native init AdminApp --template react-native-template-typescript
# Follow instructions in admin-app/README.md
```

## Important Notes

### Legal & Ethical Use
⚠️ **This system is designed for TRANSPARENT monitoring with user awareness:**
- Shows visible notification when monitoring is active
- User can see when app is running
- Clearly labeled as a security monitoring tool
- Should only be used on devices you own
- Inform anyone who uses the monitored device

### Features
✅ **Monitoring App:**
- Logs phone unlock/lock events
- Captures screenshots (with permission)
- Sends data to backend
- Shows persistent notification (user awareness)
- Requires explicit permissions

✅ **Admin App:**
- View all logged events
- View screenshots
- See device status
- Filter by date/device
- Real-time updates

✅ **Backend API:**
- Secure authentication (JWT)
- Device management
- Event logging
- Screenshot storage
- RESTful API

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Monitoring App │────────▶│ Backend API  │◀────────│   Admin App     │
│  (Target Phone) │         │ (Node.js +   │         │  (Admin Phone)  │
│                 │         │  MongoDB)    │         │                 │
└─────────────────┘         └──────────────┘         └─────────────────┘
      Logs events                Stores data              Views data
      Sends screenshots          Manages auth             Dashboard
```

## Next Steps

1. Set up the backend first (see `backend/README.md`)
2. Test API endpoints with Postman
3. Set up monitoring app (see `monitoring-app/README.md`)
4. Set up admin app (see `admin-app/README.md`)
5. Configure API URL in both apps to point to your backend

## Support

For detailed setup instructions, see individual README files in each folder.
