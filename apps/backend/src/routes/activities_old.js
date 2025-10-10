import express from 'express';
import Activity from '../models/activity.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all activities
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('participants', 'email')
      .sort({ date: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity by id
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('participants', 'email');
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create activity
router.post('/', auth, async (req, res) => {
  try {
    const activity = new Activity({
      ...req.body,
      createdBy: req.user._id
    });
    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update activity
router.patch('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join activity
router.post('/:id/join', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    if (activity.participants.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already joined' });
    }
    
    activity.participants.push(req.user._id);
    await activity.save();
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave activity
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    activity.participants = activity.participants.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await activity.save();
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete activity
router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;