import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Profile from '../models/profile.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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

// Get profile by userId
router.get('/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update profile
router.post('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      profile = new Profile({
        ...req.body,
        userId: req.user._id
      });
      await profile.save();
    }
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('Please upload a file');
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Delete old avatar if exists
    if (profile.avatar) {
      const oldAvatarPath = path.join('uploads', path.basename(profile.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update profile with new avatar URL
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    profile.avatar = avatarUrl;
    await profile.save();

    res.json({ avatarUrl });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete avatar
router.delete('/avatar', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile || !profile.avatar) {
      throw new Error('No avatar found');
    }

    const avatarPath = path.join('uploads', path.basename(profile.avatar));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    profile.avatar = '';
    await profile.save();

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete profile
router.delete('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;