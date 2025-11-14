const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ['unlock', 'lock', 'screen_on', 'app_open', 'app_close', 'screenshot'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    batteryLevel: Number,
    isCharging: Boolean,
    networkType: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  }
});

eventSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('Event', eventSchema);
