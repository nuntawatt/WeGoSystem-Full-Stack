import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Activity from '../models/activity.js';
import Chat from '../models/chat.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/activities'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, WebP)'));
    }
  }
});

// Upload cover image endpoint
router.post('/upload-cover', auth, upload.single('cover'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the URL to access the file
    const fileUrl = `/uploads/activities/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all events (alias for activities)
router.get('/', async (req, res) => {
  try {
    // Allow all activities, not just published ones
    const events = await Activity.find()
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
    
    // Don't add creator as participant - they have full access as creator
    // Participants are for people who JOIN the activity
    
    // Create group chat for this activity
    const chat = new Chat({
      type: 'group',
      name: event.title,
      participants: [
        { user: req.user._id, role: 'admin', joinedAt: new Date() }
      ],
      createdBy: req.user._id
    });
    await chat.save();
    
    // Update activity with chat reference
    event.chat = chat._id;
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
    
    // Add participant
    await event.addParticipant(req.user._id);
    
    // Create or get group chat for this activity
    let chat = await Chat.findById(event.chat);
    
    if (!chat) {
      // Create new group chat
      chat = new Chat({
        type: 'group',
        name: event.title,
        participants: [
          { user: event.createdBy, role: 'admin', joinedAt: new Date() },
          { user: req.user._id, role: 'member', joinedAt: new Date() }
        ],
        createdBy: event.createdBy
      });
      await chat.save();
      
      // Update activity with chat reference
      event.chat = chat._id;
      await event.save();
    } else {
      // Add user to existing chat if not already there
      const alreadyInChat = chat.participants.some(p => p.user.equals(req.user._id));
      if (!alreadyInChat) {
        chat.participants.push({
          user: req.user._id,
          role: 'member',
          joinedAt: new Date()
        });
        await chat.save();
      }
    }
    
    await event.populate('participants.user', 'email');
    
    res.json({ 
      message: 'Successfully joined event', 
      activity: event,
      chatId: chat._id 
    });
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
    
    res.json({ message: 'Successfully left event', activity: event });
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
