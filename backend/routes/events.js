const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Device = require('../models/Device');

router.post('/monitoring', async (req, res) => {
  try {
    const { deviceId, eventType, metadata } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const event = new Event({
      deviceId,
      eventType,
      metadata
    });

    await event.save();

    device.lastActive = new Date();
    await device.save();

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { deviceId, eventType, startDate, endDate, limit = 100, skip = 0 } = req.query;

    const query = {};

    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Event.countDocuments(query);

    res.json({ 
      events, 
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + events.length)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { deviceId, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = {
      timestamp: { $gte: startDate }
    };

    if (deviceId) {
      query.deviceId = deviceId;
    }

    const stats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalEvents = await Event.countDocuments(query);

    res.json({ stats, totalEvents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
