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

import { uploadBuffer } from '../lib/cloudinary.js';

// Use memoryStorage to upload buffers to Cloudinary
const storage = multer.memoryStorage();
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
router.post('/upload-cover', auth, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = req.file.buffer;
    try {
      const pub = `events/cover-${Date.now()}-${Math.round(Math.random()*1e6)}`;
      const uploaded = await uploadBuffer(buffer, { public_id: pub, folder: 'wego/events', resource_type: 'image' });
      return res.json({ url: uploaded.secure_url, public_id: uploaded.public_id });
    } catch (upErr) {
      console.error('Cloudinary upload error for cover:', upErr);
      return res.status(500).json({ error: 'Failed to upload cover image' });
    }
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
    // Prepare event data
    const eventData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Handle location field - convert string to object if needed
    if (req.body.location) {
      if (typeof req.body.location === 'string') {
        eventData.location = {
          address: req.body.location,
          coordinates: {
            type: 'Point',
            coordinates: [0, 0] // Default coordinates
          }
        };
      } else if (typeof req.body.location === 'object' && !req.body.location.address) {
        // If location is object but doesn't have address field
        eventData.location = {
          address: req.body.location.address || '',
          coordinates: req.body.location.coordinates || {
            type: 'Point',
            coordinates: [0, 0]
          }
        };
      }
    }
    
    const event = new Activity(eventData);
    
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
    // Emit updated participants to the chat room so connected clients refresh member lists in real time
    try {
      const io = req.app.get('io');
      if (io && chat) {
        // repopulate to ensure user info is available
        await chat.populate('participants.user', 'email username isOnline');
        const parts = chat.participants
          .filter(p => p.user)
          .map(p => ({ id: p.user._id, email: p.user.email, username: p.user.username, role: p.role, isOnline: !!p.user.isOnline }));
        io.to(`chat:${chat._id}`).emit('chat:participants', { participants: parts });
      }
    } catch (emitErr) {
      console.error('Failed to emit chat:participants after event join:', emitErr);
    }

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
    // If this event has a linked chat, remove the user from the chat participants and emit update
    try {
      if (event.chat) {
        const chat = await Chat.findById(event.chat);
        if (chat) {
          // Remove participant entries that match this user (safe guards for nulls)
          chat.participants = chat.participants.filter(p => !(p.user && p.user.toString() === req.user._id.toString()));
          await chat.save();

          // Emit updated participants
          const io = req.app.get('io');
          if (io) {
            await chat.populate('participants.user', 'email username isOnline');
            const parts = chat.participants
              .filter(p => p.user)
              .map(p => ({ id: p.user._id, email: p.user.email, username: p.user.username, role: p.role, isOnline: !!p.user.isOnline }));
            io.to(`chat:${chat._id}`).emit('chat:participants', { participants: parts });
          }
        }
      }
    } catch (emitErr) {
      console.error('Failed to update chat participants after leaving event:', emitErr);
    }

    res.json({ message: 'Successfully left event', activity: event });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search/filter events
router.get('/search/filter', async (req, res) => {
  try {
    const { tags } = req.query;
    const filters = { status: 'published', visibility: 'public' };

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
