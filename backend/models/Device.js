const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceModel: String,
  osVersion: String,
  appVersion: String,
  screenshotInterval: {
    type: Number,
    default: 10000, // 10 seconds in milliseconds
    min: 5000, // minimum 5 seconds
    max: 300000 // maximum 5 minutes
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Device', deviceSchema);
