require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const createAdmin = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB Connected');

    const adminEmail = 'admin@admin.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      process.exit(0);
    }

    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      name: adminName
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
