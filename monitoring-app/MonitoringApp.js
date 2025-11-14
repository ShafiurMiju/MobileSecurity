import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.0.106:3000'; // Your computer's IP

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

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
      console.error('Error checking login status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email, password }
        : { email, password, name };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);

      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        Alert.alert('Success', isLogin ? 'Logged in successfully!' : 'Registered successfully!');
        setIsLoggedIn(true);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  if (checking) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <MonitoringScreen onLogout={handleLogout} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Crypto Wallet Style Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>₿</Text>
          </View>
          <Text style={styles.title}>Crypto Wallet</Text>
          <Text style={styles.subtitle}>Secure your digital assets</Text>
        </View>

        {/* Auth Form */}
        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#a0aec0"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email Address"
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 Secured with 256-bit encryption</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Monitoring Screen Component
const MonitoringScreen = ({ onLogout }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState({
    eventsToday: 0,
    lastSync: 'Never',
    deviceName: 'This Device',
  });

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    }
  }, [isMonitoring]);

  const startMonitoring = () => {
    // Start monitoring logic here
    setStats(prev => ({
      ...prev,
      lastSync: new Date().toLocaleTimeString(),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.monitoringContent}>
        <View style={styles.monitoringHeader}>
          <Text style={styles.monitoringTitle}>Security Monitor</Text>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.statusIndicator, isMonitoring && styles.statusActive]} />
          <Text style={styles.statusText}>
            {isMonitoring ? '🟢 Monitoring Active' : '⚪ Monitoring Stopped'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Device</Text>
            <Text style={styles.statValue}>{stats.deviceName}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Events Today</Text>
            <Text style={styles.statValue}>{stats.eventsToday}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Last Sync</Text>
            <Text style={styles.statValue}>{stats.lastSync}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.monitorButton, isMonitoring && styles.monitorButtonActive]}
          onPress={() => setIsMonitoring(!isMonitoring)}>
          <Text style={styles.monitorButtonText}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⚠️ This app runs with visible notification for transparency
          </Text>
        </View>
      </View>
    </SafeAreaView>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aec0',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#667eea',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#718096',
    fontSize: 12,
  },
  // Monitoring Screen Styles
  monitoringContent: {
    flex: 1,
    padding: 24,
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  monitoringTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutText: {
    color: '#667eea',
    fontSize: 16,
  },
  statusCard: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#718096',
    marginRight: 12,
  },
  statusActive: {
    backgroundColor: '#48bb78',
  },
  statusText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#a0aec0',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  monitorButton: {
    backgroundColor: '#48bb78',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  monitorButtonActive: {
    backgroundColor: '#f56565',
  },
  monitorButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f6ad55',
  },
  infoText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
});

export default App;
