const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  imageBase64: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  imagePath: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    screenWidth: Number,
    screenHeight: Number,
    fileSize: Number,
    imageSize: Number
  }
});

screenshotSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('Screenshot', screenshotSchema);
