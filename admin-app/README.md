# Admin App Setup

This is the dashboard app to view monitoring logs and screenshots.

## Setup Steps

### 1. Initialize React Native Project
```bash
cd admin-app
npx react-native init AdminApp --template react-native-template-typescript
cd AdminApp
```

### 2. Install Dependencies
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios
npm install react-native-vector-icons
npm install @react-native-community/datetimepicker
npm install react-native-image-viewing
npm install react-native-chart-kit react-native-svg

# For Android - Link native dependencies
npx react-native link
```

### 3. Configure API URL

Create `src/config/api.ts`:
```typescript
export const API_URL = 'http://YOUR_COMPUTER_IP:5000';
// Replace YOUR_COMPUTER_IP with your computer's local IP
// e.g., 'http://192.168.1.100:5000'
```

### 4. Build and Run

**Android:**
```bash
npx react-native run-android
```

**iOS:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## Features

### Dashboard
- 📊 Event statistics
- 📱 Device list with status
- 📈 Activity charts
- 🔔 Real-time updates

### Events View
- 📋 List all events
- 🔍 Filter by device/type/date
- 📅 Date range picker
- ♻️ Pull to refresh

### Screenshots View
- 🖼️ Gallery view
- 🔍 Full-screen preview
- 📅 Filter by date
- 🗑️ Delete screenshots

### Devices View
- 📱 All registered devices
- ✅ Active/inactive status
- ℹ️ Device information
- 🔄 Last activity time

### Settings
- 👤 Profile management
- 🔐 Change password
- 🚪 Logout

## Navigation Structure

```
┌─────────────────────────────────┐
│         Bottom Tabs             │
├─────────────────────────────────┤
│  📊 Dashboard  │  📋 Events     │
│  🖼️ Screenshots │  📱 Devices   │
│  ⚙️ Settings    │               │
└─────────────────────────────────┘
```

## Screenshots

The admin app provides a clean, intuitive interface to:
1. Monitor all connected devices
2. View event logs in real-time
3. Browse and review screenshots
4. Analyze usage patterns
5. Manage device permissions

## Security

- 🔐 Secure JWT authentication
- 🔒 Token storage in AsyncStorage
- 🚪 Auto-logout on token expiry
- 🔑 Password protection

## Next Steps

1. Run the app
2. Login with admin credentials
3. View dashboard
4. Check devices
5. Browse events and screenshots
