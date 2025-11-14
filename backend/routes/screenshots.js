const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Screenshot = require('../models/Screenshot');
const Device = require('../models/Device');
const Event = require('../models/Event');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/upload-monitoring', async (req, res) => {
  try {
    const { deviceId, imageBase64, metadata } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not registered' });
    }

    const event = new Event({
      deviceId,
      eventType: 'screenshot',
      metadata: metadata || {}
    });
    await event.save();

    const screenshot = new Screenshot({
      deviceId,
      imageBase64,
      metadata: {
        imageSize: imageBase64.length,
        ...metadata
      }
    });

    await screenshot.save();

    device.lastActive = new Date();
    await device.save();

    res.status(201).json({ 
      success: true,
      screenshot: {
        id: screenshot._id,
        timestamp: screenshot.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { deviceId, startDate, endDate, limit = 50, skip = 0 } = req.query;

    const query = {};

    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const screenshots = await Screenshot.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Screenshot.countDocuments(query);

    res.json({ 
      screenshots, 
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + screenshots.length)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bulk-delete', async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query;

    const query = {};

    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const screenshots = await Screenshot.find(query);

    for (const screenshot of screenshots) {
      if (screenshot.imagePath && fs.existsSync(screenshot.imagePath)) {
        try {
          fs.unlinkSync(screenshot.imagePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

    const result = await Screenshot.deleteMany(query);

    res.json({ 
      message: 'Screenshots deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);

    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    res.json({ screenshot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/image', async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);

    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    if (screenshot.imageBase64) {
      const base64Data = screenshot.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', imageBuffer.length.toString());
      res.send(imageBuffer);
    } 
    else if (screenshot.imagePath && fs.existsSync(screenshot.imagePath)) {
      res.sendFile(screenshot.imagePath);
    } 
    else {
      return res.status(404).json({ error: 'Image data not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);

    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    if (screenshot.imagePath && fs.existsSync(screenshot.imagePath)) {
      try {
        fs.unlinkSync(screenshot.imagePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    await screenshot.deleteOne();

    res.json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
