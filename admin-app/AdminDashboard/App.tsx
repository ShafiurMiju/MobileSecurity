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
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

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
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛡️</Text>
        </View>
        <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }} />
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
      {currentScreen === 'screenshots' && <ScreenshotsScreen />}
      {currentScreen === 'settings' && <SettingsScreen onLogout={handleLogout} />}
      
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('dashboard')}>
          <View style={[styles.navIconContainer, currentScreen === 'dashboard' && styles.navIconContainerActive]}>
            <Text style={styles.navIcon}>📊</Text>
          </View>
          <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('events')}>
          <View style={[styles.navIconContainer, currentScreen === 'events' && styles.navIconContainerActive]}>
            <Text style={styles.navIcon}>📋</Text>
          </View>
          <Text style={[styles.navText, currentScreen === 'events' && styles.navTextActive]}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('devices')}>
          <View style={[styles.navIconContainer, currentScreen === 'devices' && styles.navIconContainerActive]}>
            <Text style={styles.navIcon}>📱</Text>
          </View>
          <Text style={[styles.navText, currentScreen === 'devices' && styles.navTextActive]}>Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('screenshots')}>
          <View style={[styles.navIconContainer, currentScreen === 'screenshots' && styles.navIconContainerActive]}>
            <Text style={styles.navIcon}>📷</Text>
          </View>
          <Text style={[styles.navText, currentScreen === 'screenshots' && styles.navTextActive]}>Screenshots</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('settings')}>
          <View style={[styles.navIconContainer, currentScreen === 'settings' && styles.navIconContainerActive]}>
            <Text style={styles.navIcon}>⚙️</Text>
          </View>
          <Text style={[styles.navText, currentScreen === 'settings' && styles.navTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
        Alert.alert('Success', 'Welcome to Security Vault!');
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
      <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.loginHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🛡️</Text>
          </View>
          <Text style={styles.loginTitle}>Security Vault</Text>
          <Text style={styles.loginSubtitle}>Admin Dashboard</Text>
        </View>

        <View style={styles.loginForm}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#718096"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#718096"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Access Dashboard</Text>
                <Text style={styles.loginButtonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.loginFooter}>
          <Text style={styles.footerText}>🔒 Secured with end-to-end encryption</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    devices: 0,
    events: 0,
    screenshots: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [devicesRes, eventsRes, screenshotsRes] = await Promise.all([
        axios.get(`${API_URL}/api/devices`, { headers }),
        axios.get(`${API_URL}/api/events?limit=1`, { headers }),
        axios.get(`${API_URL}/api/screenshots?limit=1`, { headers }),
      ]);

      setStats({
        devices: devicesRes.data.devices.length,
        events: eventsRes.data.pagination.total,
        screenshots: screenshotsRes.data.pagination.total,
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
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Text style={styles.headerIcon}>🛡️</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Monitored Events</Text>
        <Text style={styles.balanceValue}>{stats.events}</Text>
        <View style={styles.balanceChange}>
          <Text style={styles.balanceChangeText}>📈 Real-time monitoring</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconBox}>
            <Text style={styles.statEmoji}>📱</Text>
          </View>
          <Text style={styles.statValue}>{stats.devices}</Text>
          <Text style={styles.statLabel}>Active Devices</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconBox}>
            <Text style={styles.statEmoji}>📊</Text>
          </View>
          <Text style={styles.statValue}>{stats.events}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconBox}>
            <Text style={styles.statEmoji}>📷</Text>
          </View>
          <Text style={styles.statValue}>{stats.screenshots}</Text>
          <Text style={styles.statLabel}>Screenshots</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconBox}>
            <Text style={styles.statEmoji}>🔒</Text>
          </View>
          <Text style={styles.statValue}>100%</Text>
          <Text style={styles.statLabel}>Secure</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconBox}>
            <Text style={styles.actionEmoji}>📋</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View All Events</Text>
            <Text style={styles.actionSubtitle}>See complete activity log</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconBox}>
            <Text style={styles.actionEmoji}>📱</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Devices</Text>
            <Text style={styles.actionSubtitle}>Control monitored devices</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

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

  const getEventIcon = (type) => {
    const icons = {
      unlock: '🔓',
      lock: '🔒',
      screen_on: '💡',
      screenshot: '📸',
      app_open: '📱',
      app_close: '❌',
    };
    return icons[type] || '📋';
  };

  const renderEvent = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventIconBox}>
        <Text style={styles.eventEmoji}>{getEventIcon(item.eventType)}</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventType}>
          {item.eventType === 'screen_on' ? 'Screen On' : item.eventType.replace('_', ' ')}
        </Text>
        <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleString()}</Text>
        <Text style={styles.eventDevice}>Device: {item.deviceId}</Text>
        {(item.eventType === 'lock' || item.eventType === 'unlock' || item.eventType === 'screen_on') && item.metadata?.batteryLevel !== undefined && (
          <View style={styles.eventBatteryContainer}>
            <Text style={styles.eventBattery}>
              🔋 {item.metadata.batteryLevel}%
              {item.metadata.isCharging && ' ⚡ Charging'}
            </Text>
          </View>
        )}
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
      <Text style={styles.screenTitle}>Activity Log</Text>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No events yet</Text>
          </View>
        }
      />
    </View>
  );
};

const DevicesScreen = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [intervalInput, setIntervalInput] = useState('');
  const [updatingInterval, setUpdatingInterval] = useState(false);

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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const deleteDevice = async (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete "${deviceName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/devices/${deviceId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Device deleted successfully');
              setLoading(true);
              await fetchDevices();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete device');
            }
          }
        }
      ]
    );
  };

  const openIntervalModal = (device: any) => {
    setSelectedDevice(device);
    setIntervalInput(String((device.screenshotInterval || 10000) / 1000));
    setShowIntervalModal(true);
  };

  const updateInterval = async () => {
    if (!selectedDevice) return;
    
    try {
      const seconds = parseInt(intervalInput);
      if (isNaN(seconds) || seconds < 5 || seconds > 300) {
        Alert.alert('Invalid Input', 'Please enter a value between 5 and 300 seconds');
        return;
      }
      
      setUpdatingInterval(true);
      const milliseconds = seconds * 1000;
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/devices/${selectedDevice.deviceId}/interval`,
        { screenshotInterval: milliseconds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowIntervalModal(false);
      Alert.alert('Success', `Interval updated to ${seconds} seconds`);
      setLoading(true);
      await fetchDevices();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update interval');
    } finally {
      setUpdatingInterval(false);
    }
  };

  const renderDevice = ({ item }: any) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceIconBox}>
        <Text style={styles.deviceEmoji}>📱</Text>
      </View>
      <View style={styles.deviceContent}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>{item.deviceName}</Text>
          <View style={styles.deviceBadgeContainer}>
            <View style={[styles.deviceBadge, item.isActive && styles.deviceBadgeActive]}>
              <Text style={styles.deviceBadgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <TouchableOpacity
              style={styles.deviceDeleteButton}
              onPress={() => deleteDevice(item.deviceId, item.deviceName)}>
              <Text style={styles.deviceDeleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.deviceModel}>{item.deviceModel}</Text>
        <Text style={styles.deviceTime}>
          Last active: {new Date(item.lastActive).toLocaleString()}
        </Text>
        <View style={styles.deviceIntervalContainer}>
          <Text style={styles.deviceIntervalLabel}>
            📸 Interval: {(item.screenshotInterval || 10000) / 1000}s
          </Text>
          <TouchableOpacity
            style={styles.deviceIntervalButton}
            onPress={() => openIntervalModal(item)}>
            <Text style={styles.deviceIntervalButtonText}>⚙️ Change</Text>
          </TouchableOpacity>
        </View>
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
      <Text style={styles.screenTitle}>Connected Devices</Text>
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📱</Text>
            <Text style={styles.emptyText}>No devices registered</Text>
          </View>
        }
      />

      {/* Interval Change Modal */}
      <Modal
        visible={showIntervalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIntervalModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Screenshot Interval</Text>
            <Text style={styles.modalText}>
              Set interval for "{selectedDevice?.deviceName}"
            </Text>
            
            <View style={styles.intervalInfoBox}>
              <Text style={styles.intervalInfoText}>⏱ Minimum: 5 seconds</Text>
              <Text style={styles.intervalInfoText}>⏱ Maximum: 300 seconds (5 min)</Text>
              <Text style={styles.intervalInfoText}>
                📸 Current: {(selectedDevice?.screenshotInterval || 10000) / 1000}s
              </Text>
            </View>

            <Text style={styles.inputLabel}>Interval (seconds)</Text>
            <TextInput
              style={styles.intervalInput}
              placeholder="Enter seconds"
              placeholderTextColor="#718096"
              value={intervalInput}
              onChangeText={setIntervalInput}
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowIntervalModal(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalUpdateButton]}
                onPress={updateInterval}
                disabled={updatingInterval}>
                {updatingInterval ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ScreenshotsScreen = () => {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchScreenshots();
  }, [currentPage, perPage, selectedDevice, startDate, endDate]);

  const fetchDevices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchScreenshots = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const skip = (currentPage - 1) * perPage;
      let url = `${API_URL}/api/screenshots?limit=${perPage}&skip=${skip}`;
      
      if (selectedDevice !== 'all') {
        url += `&deviceId=${selectedDevice}`;
      }
      
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      
      if (endDate) {
        url += `&endDate=${endDate}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setScreenshots(response.data.screenshots);
      setTotalCount(response.data.pagination.total);
      setTotalPages(Math.ceil(response.data.pagination.total / perPage));
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      Alert.alert('Error', 'Failed to load screenshots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchScreenshots();
  };

  const openImage = (screenshot) => {
    setSelectedImage(screenshot);
    setModalVisible(true);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setLoading(true);
    }
  };

  const changePerPage = (value) => {
    setPerPage(value);
    setCurrentPage(1);
    setLoading(true);
  };

  const changeDeviceFilter = (deviceId) => {
    setSelectedDevice(deviceId);
    setCurrentPage(1);
    setLoading(true);
  };

  const deleteScreenshot = async (id) => {
    Alert.alert(
      'Delete Screenshot',
      'Are you sure you want to delete this screenshot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/screenshots/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Screenshot deleted');
              setLoading(true);
              await fetchScreenshots();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete screenshot');
            }
          }
        }
      ]
    );
  };

  const deleteCurrentPage = async () => {
    Alert.alert(
      'Delete Page',
      `Delete all ${screenshots.length} screenshots on this page?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await AsyncStorage.getItem('token');
              const deletePromises = screenshots.map(ss => 
                axios.delete(`${API_URL}/api/screenshots/${ss._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
              );
              await Promise.all(deletePromises);
              Alert.alert('Success', `Deleted ${screenshots.length} screenshots`);
              
              // If current page is now empty and not first page, go back one page
              if (screenshots.length === totalCount % perPage && currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
              
              setLoading(true);
              await fetchScreenshots();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some screenshots');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const deleteAllFiltered = async () => {
    Alert.alert(
      'Delete All',
      `Delete all ${totalCount} screenshots matching current filters?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await AsyncStorage.getItem('token');
              let url = `${API_URL}/api/screenshots/bulk-delete?`;
              
              if (selectedDevice !== 'all') {
                url += `deviceId=${selectedDevice}&`;
              }
              if (startDate) {
                url += `startDate=${startDate}&`;
              }
              if (endDate) {
                url += `endDate=${endDate}&`;
              }
              
              await axios.delete(url, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              Alert.alert('Success', `Deleted all filtered screenshots`);
              setCurrentPage(1);
              setLoading(true);
              await fetchScreenshots();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete screenshots');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const renderScreenshot = ({ item }) => (
    <TouchableOpacity 
      style={styles.screenshotCard}
      onPress={() => openImage(item)}>
      <View style={styles.screenshotImageContainer}>
        {item.imageBase64 ? (
          <Image
            source={{ uri: `data:image/png;base64,${item.imageBase64.replace(/^data:image\/\w+;base64,/, '')}` }}
            style={styles.screenshotThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.screenshotPlaceholder}>
            <Text style={styles.screenshotPlaceholderText}>📷</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.deleteIconButton}
          onPress={() => deleteScreenshot(item._id)}>
          <Text style={styles.deleteIconText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.screenshotInfo}>
        <Text style={styles.screenshotDevice}>Device: {item.deviceId}</Text>
        <Text style={styles.screenshotTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
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
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Screenshots</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filterButtonText}>🔍 Filter</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Device:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, selectedDevice === 'all' && styles.filterChipActive]}
                onPress={() => changeDeviceFilter('all')}>
                <Text style={[styles.filterChipText, selectedDevice === 'all' && styles.filterChipTextActive]}>
                  All Devices
                </Text>
              </TouchableOpacity>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.deviceId}
                  style={[styles.filterChip, selectedDevice === device.deviceId && styles.filterChipActive]}
                  onPress={() => changeDeviceFilter(device.deviceId)}>
                  <Text style={[styles.filterChipText, selectedDevice === device.deviceId && styles.filterChipTextActive]}>
                    {device.deviceName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Per Page:</Text>
            <View style={styles.perPageContainer}>
              {[10, 15, 20, 30].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.perPageButton, perPage === value && styles.perPageButtonActive]}
                  onPress={() => changePerPage(value)}>
                  <Text style={[styles.perPageText, perPage === value && styles.perPageTextActive]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date Range:</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor="#64748b"
                value={startDate}
                onChangeText={setStartDate}
              />
              <Text style={styles.dateToText}>to</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor="#64748b"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
            {(startDate || endDate) && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => {
                  setStartDate('');
                  setEndDate('');
                }}>
                <Text style={styles.clearDateText}>Clear Dates</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={deleteCurrentPage}
          disabled={deleting || screenshots.length === 0}>
          <Text style={styles.deleteButtonText}>🗑️ Delete Page</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.deleteButton, styles.deleteAllButton]}
          onPress={deleteAllFiltered}
          disabled={deleting || totalCount === 0}>
          <Text style={styles.deleteButtonText}>🗑️ Delete All ({totalCount})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          Showing {screenshots.length > 0 ? ((currentPage - 1) * perPage + 1) : 0}-{Math.min(currentPage * perPage, totalCount)} of {totalCount}
        </Text>
        <Text style={styles.statsText}>Page {currentPage} of {totalPages}</Text>
      </View>

      <FlatList
        data={screenshots}
        renderItem={renderScreenshot}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.screenshotRow}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyText}>No screenshots yet</Text>
          </View>
        }
      />

      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => goToPage(1)}
            disabled={currentPage === 1}>
            <Text style={styles.paginationButtonText}>⏮</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}>
            <Text style={styles.paginationButtonText}>◀</Text>
          </TouchableOpacity>

          <View style={styles.pageNumbers}>
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = index + 1;
              } else if (currentPage <= 3) {
                pageNum = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + index;
              } else {
                pageNum = currentPage - 2 + index;
              }
              
              return (
                <TouchableOpacity
                  key={pageNum}
                  style={[styles.pageButton, currentPage === pageNum && styles.pageButtonActive]}
                  onPress={() => goToPage(pageNum)}>
                  <Text style={[styles.pageButtonText, currentPage === pageNum && styles.pageButtonTextActive]}>
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}>
            <Text style={styles.paginationButtonText}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}>
            <Text style={styles.paginationButtonText}>⏭</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.screenshotModalContainer}>
          <TouchableOpacity 
            style={styles.screenshotModalOverlay}
            onPress={() => setModalVisible(false)}>
            <View style={styles.screenshotModalContent}>
              {selectedImage?.imageBase64 && (
                <Image
                  source={{ uri: `data:image/png;base64,${selectedImage.imageBase64.replace(/^data:image\/\w+;base64,/, '')}` }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
              <View style={styles.modalInfo}>
                <Text style={styles.modalDeviceText}>Device: {selectedImage?.deviceId}</Text>
                <Text style={styles.modalTimeText}>
                  {selectedImage && new Date(selectedImage.timestamp).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const SettingsScreen = ({ onLogout }) => {
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Settings</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>ACCOUNT</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingEmoji}>👤</Text>
          <Text style={styles.settingText}>Profile Settings</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingEmoji}>🔑</Text>
          <Text style={styles.settingText}>Change Password</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>PREFERENCES</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingEmoji}>🔔</Text>
          <Text style={styles.settingText}>Notifications</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingEmoji}>🔒</Text>
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>🚪 Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.versionBox}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Login Screen
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loginScroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 50,
  },
  loginTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  loginForm: {
    marginBottom: 32,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loginButtonIcon: {
    color: '#fff',
    fontSize: 20,
  },
  loginFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },

  // Dashboard
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
  },
  balanceCard: {
    backgroundColor: '#667eea',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#e0e7ff',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  balanceChange: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  balanceChangeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  actionArrow: {
    fontSize: 20,
    color: '#667eea',
  },

  // Events
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  eventDevice: {
    fontSize: 12,
    color: '#64748b',
  },
  eventBatteryContainer: {
    marginTop: 6,
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  eventBattery: {
    fontSize: 11,
    color: '#a0d911',
    fontWeight: '600',
  },

  // Devices
  deviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceEmoji: {
    fontSize: 28,
  },
  deviceContent: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  deviceBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deviceBadgeActive: {
    backgroundColor: '#10b981',
  },
  deviceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  deviceDeleteButton: {
    backgroundColor: '#dc2626',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceDeleteIcon: {
    fontSize: 16,
  },
  deviceModel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  deviceTime: {
    fontSize: 12,
    color: '#64748b',
  },
  deviceIntervalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  deviceIntervalLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  deviceIntervalButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deviceIntervalButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Settings
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  settingArrow: {
    fontSize: 18,
    color: '#667eea',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    color: '#64748b',
    fontSize: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconContainerActive: {
    backgroundColor: '#667eea',
  },
  navIcon: {
    fontSize: 22,
  },
  navText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#667eea',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Filters
  filtersContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  perPageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  perPageButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  perPageButtonActive: {
    backgroundColor: '#667eea',
  },
  perPageText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  perPageTextActive: {
    color: '#fff',
  },

  // Date Inputs
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 12,
  },
  dateToText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  clearDateButton: {
    marginTop: 8,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteAllButton: {
    backgroundColor: '#991b1b',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statsText: {
    color: '#94a3b8',
    fontSize: 12,
  },

  // Screenshots
  screenshotRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenshotCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  screenshotImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  screenshotThumbnail: {
    width: '100%',
    height: '100%',
  },
  screenshotPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  screenshotPlaceholderText: {
    fontSize: 48,
  },
  deleteIconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    fontSize: 16,
  },
  screenshotInfo: {
    padding: 12,
  },
  screenshotDevice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  screenshotTime: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // Screenshot Modal
  screenshotModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  screenshotModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenshotModalContent: {
    width: '100%',
    alignItems: 'center',
  },

  // Modal (for interval change)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#a0aec0',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  intervalInfoBox: {
    backgroundColor: '#1a202c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  intervalInfoText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 6,
  },
  intervalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#334155',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalUpdateButton: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.7,
    borderRadius: 12,
  },
  modalInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalDeviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  modalTimeText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  closeButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paginationButton: {
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 6,
  },
  pageButton: {
    backgroundColor: '#1e293b',
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pageButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  pageButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  pageButtonTextActive: {
    color: '#fff',
  },
});

export default App;
