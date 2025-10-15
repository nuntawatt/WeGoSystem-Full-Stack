import express from 'express';
import Activity from '../models/activity.js';
import Chat from '../models/chat.js';
import User from '../models/user.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadBuffer, cloudinary } from '../lib/cloudinary.js';

const router = express.Router();

// Use memoryStorage for uploading buffers to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get all activities with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = { status: 'published', visibility: 'public' };
    
    // Add filters
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filters.tags = { $in: tags };
    }
    
    if (req.query.location) {
      filters['location.address'] = { $regex: req.query.location, $options: 'i' };
    }
    
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filters.date = { $gte: startDate, $lt: endDate };
    }

    if (req.query.difficulty) {
      filters.difficulty = req.query.difficulty;
    }

    if (req.query.maxCost) {
      filters['cost.amount'] = { $lte: parseInt(req.query.maxCost) };
    }

    // Sorting
    let sortOptions = {};
    switch (req.query.sort) {
      case 'date':
        sortOptions = { date: 1 };
        break;
      case 'popularity':
        sortOptions = { 'participants.length': -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { date: 1 };
    }

    const activities = await Activity.find(filters)
      .populate('createdBy', 'email')
      .populate('participants.user', 'email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Activity.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search activities near location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const activities = await Activity.findNearby(
      parseFloat(lat), 
      parseFloat(lng), 
      parseInt(radius)
    ).populate('createdBy', 'email')
     .populate('participants.user', 'email');

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity by id
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('participants.user', 'email')
      .populate('ratings.user', 'email')
      .populate('chat');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check visibility
    if (activity.visibility === 'private' && 
        !activity.participants.some(p => p.user._id.equals(req.user?._id)) &&
        !activity.createdBy._id.equals(req.user?._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Get activity by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create activity
router.post('/', auth, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Parse location if provided as string (backward compatibility)
    if (typeof activityData.location === 'string') {
      activityData.location = { 
        address: activityData.location,
        coordinates: {
          type: 'Point',
          coordinates: [0, 0] // Default coordinates
        }
      };
    } else if (activityData.location && !activityData.location.coordinates) {
      // Add default coordinates if not provided
      activityData.location.coordinates = {
        type: 'Point',
        coordinates: [0, 0]
      };
    }

    const activity = new Activity(activityData);
    await activity.save();

    // Create associated chat
    const chat = await Chat.createGroupChat({
      participants: [{ user: req.user._id, role: 'admin' }],
      groupInfo: {
        name: `${activity.title} - Chat`,
        description: `Discussion for ${activity.title}`,
        relatedActivity: activity._id
      },
      createdBy: req.user._id
    });

    activity.chat = chat._id;
    await activity.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.activitiesCreated': 1 }
    });

    await activity.populate('createdBy', 'email');
    res.status(201).json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Upload activity images
router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (!activity.createdBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Upload each file to Cloudinary
    const uploaded = [];
    for (const file of req.files) {
      try {
        const pub = `activities/${activity._id}/${Date.now()}-${Math.round(Math.random()*1e6)}`;
        const resUpload = await uploadBuffer(file.buffer, { public_id: pub, folder: 'wego/activities', resource_type: 'image' });
        uploaded.push({
          url: resUpload.secure_url,
          public_id: resUpload.public_id,
          description: req.body.description || '',
          uploadedBy: req.user._id
        });
      } catch (uErr) {
        console.error('Failed to upload activity image to Cloudinary:', uErr);
      }
    }

    activity.images.push(...uploaded);
    
    // Set first image as cover if no cover exists
    if (!activity.cover && images.length > 0) {
      activity.cover = images[0].url;
    }

    await activity.save();
    res.json({ images, activity });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update activity
router.put('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    // Don't allow updates if activity is completed or cancelled
    if (['completed', 'cancelled'].includes(activity.status)) {
      return res.status(400).json({ error: 'Cannot update completed or cancelled activity' });
    }

    const allowedUpdates = [
      'title', 'description', 'location', 'date', 'time', 'endTime',
      'tags', 'maxParticipants', 'category', 'difficulty', 'cost',
      'cover', 'requirements', 'visibility'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(activity, updates);
    await activity.save();

    // Notify participants about updates
    const io = req.app.get('io');
    if (io && activity.chat) {
      io.to(activity.chat.toString()).emit('activityUpdated', {
        activityId: activity._id,
        updates: Object.keys(updates)
      });
    }

    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join activity
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { status = 'joined', note = '' } = req.body;
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (!activity.canUserJoin(req.user._id)) {
      return res.status(400).json({ error: 'Cannot join this activity' });
    }

    await activity.addParticipant(req.user._id, status, note);

    // Add user to activity chat
    if (activity.chat && status === 'joined') {
      const chat = await Chat.findById(activity.chat);
      if (chat) {
        await chat.addParticipant(req.user._id, 'member');
      }
    }

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.activitiesJoined': 1 }
    });

    // Notify other participants
    const io = req.app.get('io');
    if (io && activity.chat) {
      io.to(activity.chat.toString()).emit('participantJoined', {
        activityId: activity._id,
        userId: req.user._id,
        status: status
      });
    }

    await activity.populate('participants.user', 'email');
    res.json({ message: 'Successfully joined activity', activity });
  } catch (error) {
    console.error('Join activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Leave activity
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await activity.removeParticipant(req.user._id);

    // Remove user from activity chat
    if (activity.chat) {
      const chat = await Chat.findById(activity.chat);
      if (chat) {
        await chat.removeParticipant(req.user._id);
      }
    }

    // Notify other participants
    const io = req.app.get('io');
    if (io && activity.chat) {
      io.to(activity.chat.toString()).emit('participantLeft', {
        activityId: activity._id,
        userId: req.user._id
      });
    }

    await activity.populate('participants.user', 'email');
    res.json({ message: 'Successfully left activity', activity });
  } catch (error) {
    console.error('Leave activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rate activity
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, review = '' } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if user participated in the activity
    const participated = activity.participants.some(
      p => p.user.equals(req.user._id) && p.status === 'joined'
    );

    if (!participated) {
      return res.status(403).json({ error: 'Only participants can rate activities' });
    }

    await activity.addRating(req.user._id, rating, review);
    res.json({ message: 'Rating added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Report activity
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description = '' } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if user already reported this activity
    const existingReport = activity.reports.find(r => r.user.equals(req.user._id));
    
    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this activity' });
    }

    activity.reports.push({
      user: req.user._id,
      reason,
      description
    });

    await activity.save();
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel activity (by creator)
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const activity = await Activity.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    if (activity.status === 'cancelled') {
      return res.status(400).json({ error: 'Activity is already cancelled' });
    }

    activity.status = 'cancelled';
    await activity.save();

    // Notify all participants
    const io = req.app.get('io');
    if (io && activity.chat) {
      io.to(activity.chat.toString()).emit('activityCancelled', {
        activityId: activity._id,
        reason
      });
    }

    res.json({ message: 'Activity cancelled successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark activity as completed
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    if (activity.status === 'completed') {
      return res.status(400).json({ error: 'Activity is already completed' });
    }

    activity.status = 'completed';
    await activity.save();

    res.json({ message: 'Activity marked as completed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete activity
router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    // Delete associated chat
    if (activity.chat) {
      await Chat.findByIdAndDelete(activity.chat);
    }

    // Delete activity images from Cloudinary if possible
    if (activity.images && activity.images.length > 0) {
      for (const image of activity.images) {
        try {
          if (image.public_id) {
            await cloudinary.uploader.destroy(image.public_id, { resource_type: 'image' });
          } else if (image.url && image.url.includes('res.cloudinary.com')) {
            const parts = image.url.split('/');
            const idx = parts.findIndex(p => p === 'upload');
            if (idx > -1 && parts.length > idx + 1) {
              const publicWithExt = parts.slice(idx + 1).join('/');
              const publicId = publicWithExt.replace(/\.[a-zA-Z0-9]+$/, '');
              await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            }
          }
        } catch (delErr) {
          console.error('Failed to delete activity image from Cloudinary:', delErr);
        }
      }
    }

    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's activities
router.get('/user/me', auth, async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    
    let query = {};
    
    switch (type) {
      case 'created':
        query = { createdBy: req.user._id };
        break;
      case 'joined':
        query = { 'participants.user': req.user._id };
        break;
      default:
        query = {
          $or: [
            { createdBy: req.user._id },
            { 'participants.user': req.user._id }
          ]
        };
    }

    const activities = await Activity.find(query)
      .populate('createdBy', 'email')
      .populate('participants.user', 'email')
      .sort({ date: 1 });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;