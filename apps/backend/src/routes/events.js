import express from 'express';
import Activity from '../models/activity.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all events (alias for activities)
router.get('/', async (req, res) => {
  try {
    const events = await Activity.find({ 
      status: 'published', 
      visibility: 'public' 
    })
      .populate('createdBy', 'email')
      .sort({ date: 1 })
      .limit(50);
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event by id
router.get('/:id', async (req, res) => {
  try {
    const event = await Activity.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('participants.user', 'email');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (requires authentication)
router.post('/', auth, async (req, res) => {
  try {
    const event = new Activity({
      ...req.body,
      createdBy: req.user._id
    });
    
    await event.save();
    await event.populate('createdBy', 'email');
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Activity.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }
    
    Object.assign(event, req.body);
    await event.save();
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Activity.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join event
router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Activity.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.addParticipant(req.user._id);
    await event.populate('participants.user', 'email');
    
    res.json({ message: 'Successfully joined event', event });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave event
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const event = await Activity.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.removeParticipant(req.user._id);
    await event.populate('participants.user', 'email');
    
    res.json({ message: 'Successfully left event', event });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search/filter events
router.get('/search/filter', async (req, res) => {
  try {
    const { tags, category } = req.query;
    const filters = { status: 'published', visibility: 'public' };
    
    if (category) {
      filters.category = category;
    }
    
    if (tags) {
      filters.tags = { $in: tags.split(',') };
    }
    
    const events = await Activity.find(filters)
      .populate('createdBy', 'email')
      .sort({ date: 1 })
      .limit(50);
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
