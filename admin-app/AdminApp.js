import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.0.106:3000'; // Your computer's IP

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsLoggedIn(false);
    setCurrentScreen('dashboard');
  };

  if (checking) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'events' && <EventsScreen />}
      {currentScreen === 'devices' && <DevicesScreen />}
      {currentScreen === 'settings' && <SettingsScreen onLogout={handleLogout} />}
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('dashboard')}>
          <Text style={[styles.navIcon, currentScreen === 'dashboard' && styles.navIconActive]}>📊</Text>
          <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('events')}>
          <Text style={[styles.navIcon, currentScreen === 'events' && styles.navIconActive]}>📋</Text>
          <Text style={[styles.navText, currentScreen === 'events' && styles.navTextActive]}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('devices')}>
          <Text style={[styles.navIcon, currentScreen === 'devices' && styles.navIconActive]}>📱</Text>
          <Text style={[styles.navText, currentScreen === 'devices' && styles.navTextActive]}>Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('settings')}>
          <Text style={[styles.navIcon, currentScreen === 'settings' && styles.navIconActive]}>⚙️</Text>
          <Text style={[styles.navText, currentScreen === 'settings' && styles.navTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Login Screen
const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        Alert.alert('Success', 'Logged in successfully!');
        onLoginSuccess();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>Admin Dashboard</Text>
      <Text style={styles.loginSubtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#a0aec0"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#a0aec0"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Dashboard Screen
const DashboardScreen = () => {
  const [stats, setStats] = useState({
    devices: 0,
    events: 0,
    screenshots: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [devicesRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/api/devices`, { headers }),
        axios.get(`${API_URL}/api/events?limit=1`, { headers }),
      ]);

      setStats({
        devices: devicesRes.data.devices.length,
        events: eventsRes.data.pagination.total,
        screenshots: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      <Text style={styles.screenTitle}>Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📱</Text>
          <Text style={styles.statValue}>{stats.devices}</Text>
          <Text style={styles.statLabel}>Active Devices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>{stats.events}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🖼️</Text>
          <Text style={styles.statValue}>{stats.screenshots}</Text>
          <Text style={styles.statLabel}>Screenshots</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 View All Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📱 Manage Devices</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Events Screen
const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/events?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const renderEvent = ({ item }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventType}>{getEventIcon(item.eventType)} {item.eventType}</Text>
      <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleString()}</Text>
      <Text style={styles.eventDevice}>Device: {item.deviceId}</Text>
    </View>
  );

  const getEventIcon = (type) => {
    const icons = {
      unlock: '🔓',
      lock: '🔒',
      screenshot: '📸',
      app_open: '📱',
      app_close: '❌',
    };
    return icons[type] || '📋';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.screenTitle}>Recent Events</Text>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events yet</Text>
        }
      />
    </View>
  );
};

// Devices Screen
const DevicesScreen = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceCard}>
      <View style={[styles.deviceStatus, item.isActive && styles.deviceStatusActive]} />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.deviceName}</Text>
        <Text style={styles.deviceModel}>{item.deviceModel}</Text>
        <Text style={styles.deviceTime}>
          Last active: {new Date(item.lastActive).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.screenTitle}>Devices</Text>
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No devices registered</Text>
        }
      />
    </View>
  );
};

// Settings Screen
const SettingsScreen = ({ onLogout }) => {
  return (
    <ScrollView style={styles.content}>
      <Text style={styles.screenTitle}>Settings</Text>
      
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingText}>👤 Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingText}>🔔 Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingText}>🔒 Privacy</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.settingItem, styles.logoutButton]} onPress={onLogout}>
        <Text style={[styles.settingText, styles.logoutText]}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a202c',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Login Styles
  loginContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#1a202c',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#a0aec0',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Screen Title
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    width: '31%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  // Cards
  card: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  // Events
  eventCard: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: 14,
    color: '#a0aec0',
    marginBottom: 4,
  },
  eventDevice: {
    fontSize: 12,
    color: '#718096',
  },
  // Devices
  deviceCard: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#718096',
    marginRight: 12,
  },
  deviceStatusActive: {
    backgroundColor: '#48bb78',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  deviceModel: {
    fontSize: 14,
    color: '#a0aec0',
    marginBottom: 4,
  },
  deviceTime: {
    fontSize: 12,
    color: '#718096',
  },
  // Settings
  settingItem: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#742a2a',
    marginTop: 20,
  },
  logoutText: {
    color: '#fc8181',
  },
  // Empty State
  emptyText: {
    color: '#a0aec0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    borderTopWidth: 1,
    borderTopColor: '#4a5568',
    paddingVertical: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIconActive: {
    fontSize: 28,
  },
  navText: {
    fontSize: 10,
    color: '#a0aec0',
  },
  navTextActive: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});

export default App;
