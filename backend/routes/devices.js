const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

router.get('/check/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });

    res.json({ 
      registered: !!device,
      device: device ? {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceModel: device.deviceModel,
        isActive: device.isActive,
        lastActive: device.lastActive
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register-monitoring', async (req, res) => {
  try {
    const { deviceId, deviceName, deviceModel, osVersion, appVersion } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    let device = await Device.findOne({ deviceId });

    if (device) {
      device.deviceName = deviceName || device.deviceName;
      device.deviceModel = deviceModel || device.deviceModel;
      device.osVersion = osVersion || device.osVersion;
      device.appVersion = appVersion || device.appVersion;
      device.lastActive = new Date();
      device.isActive = true;
      await device.save();
    } else {
      device = new Device({
        deviceId,
        deviceName: deviceName || 'Monitoring Device',
        deviceModel: deviceModel || 'Unknown',
        osVersion: osVersion || 'Unknown',
        appVersion: appVersion || '1.0.0',
        isActive: true
      });
      await device.save();
    }

    res.json({ 
      success: true,
      device: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceModel: device.deviceModel,
        isActive: device.isActive
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const device = await Device.findOne({ deviceId: req.body.deviceId });
      return res.json({ 
        success: true,
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          deviceModel: device.deviceModel,
          isActive: device.isActive
        }
      });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastActive: -1 });
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:deviceId/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { isActive, lastActive: new Date() },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:deviceId', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    
    const device = await Device.findOneAndDelete({ deviceId });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const Event = require('../models/Event');
    const Screenshot = require('../models/Screenshot');
    
    await Promise.all([
      Event.deleteMany({ deviceId }),
      Screenshot.deleteMany({ deviceId })
    ]);
    
    res.json({ 
      success: true, 
      message: 'Device and all related data deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get screenshot interval for a device
router.get('/:deviceId/interval', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ 
      deviceId: device.deviceId,
      screenshotInterval: device.screenshotInterval || 10000
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update screenshot interval for a device
router.put('/:deviceId/interval', async (req, res) => {
  try {
    const { screenshotInterval } = req.body;

    if (!screenshotInterval || typeof screenshotInterval !== 'number') {
      return res.status(400).json({ error: 'Valid screenshot interval is required' });
    }

    if (screenshotInterval < 5000 || screenshotInterval > 300000) {
      return res.status(400).json({ 
        error: 'Screenshot interval must be between 5 seconds (5000ms) and 5 minutes (300000ms)' 
      });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { screenshotInterval, lastActive: new Date() },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ 
      success: true,
      device: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        screenshotInterval: device.screenshotInterval
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
