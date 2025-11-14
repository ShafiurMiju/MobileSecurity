const config = require('./config');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Initialize database and create default user if needed
const initializeDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB Connected');
    
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('📝 No users found. Creating default admin user...');
      
      const defaultAdmin = new User({
        email: 'admin@admin.com',
        password: 'admin123',
        name: 'Admin'
      });
      
      await defaultAdmin.save();
      
      console.log('✅ Default admin user created successfully!');
      console.log('📧 Email: admin@admin.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login!');
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
};

initializeDatabase();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/events', require('./routes/events'));
app.use('/api/screenshots', require('./routes/screenshots'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Security Monitor API', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: config.isDevelopment ? err.message : 'Internal server error'
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
