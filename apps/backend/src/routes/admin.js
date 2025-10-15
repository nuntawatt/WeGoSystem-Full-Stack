import express from 'express';
import User from '../models/user.js';
import Activity from '../models/activity.js';
import Group from '../models/group.js';
import Event from '../models/event.js';
import Chat from '../models/chat.js';
import Profile from '../models/profile.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log('Checking admin access for user:', req.user?.email, 'role:', req.user?.role);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      message: 'Access denied. Admin only.',
      error: 'Forbidden',
      userRole: req.user?.role
    });
  }
};

// Apply authentication and admin check to all routes
router.use(auth);
router.use(isAdmin);

// ===============================
// Users Stats
// ===============================
router.get('/users/stats', async (req, res) => {
  try {
    const total = await User.countDocuments();
    const recent = await User.find()
      .select('email username role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      total,
      recent
    });
  } catch (error) {
    console.error('Error getting users stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// User Management
// ===============================

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('email username role isBlocked isOnline lastActive createdAt')
      .sort({ createdAt: -1 });

    // Fetch profiles for all users
    const userIds = users.map(user => user._id);
    const profiles = await Profile.find({ userId: { $in: userIds } })
      .select('userId name avatar');

    // Map profiles to users
    const usersWithProfiles = users.map(user => {
      const profile = profiles.find(p => p.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        profile: profile ? { name: profile.name, avatar: profile.avatar } : null
      };
    });

    res.status(200).json({
      users: usersWithProfiles
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Block/Unblock user
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    // ห้าม Admin block ตัวเอง
    if (id === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'Cannot block yourself',
        error: 'You cannot block your own account'
      });
    }

    // หา user ที่จะ block
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // อัพเดทสถานะ block
    user.isBlocked = isBlocked;
    await user.save();

    console.log(`User ${user.email} ${isBlocked ? 'blocked' : 'unblocked'} by admin ${req.user.email}`);

    res.status(200).json({
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('email username role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Activities Stats
// ===============================
router.get('/activities/stats', async (req, res) => {
  try {
    const total = await Activity.countDocuments();
    const recent = await Activity.find()
      .select('title category status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      total,
      recent
    });
  } catch (error) {
    console.error('Error getting activities stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all activities
router.get('/activities', async (req, res) => {
  try {
    let activities = await Activity.find()
      .populate('createdBy', 'email username')
      .populate('participants.user', 'email username')
      .sort({ createdAt: -1 })
      .lean();

    // If some creators don't have username set, try to fill from Profile.name
    try {
      const missingCreatorIds = activities
        .filter(a => a.createdBy && !a.createdBy.username)
        .map(a => String(a.createdBy._id));

      if (missingCreatorIds.length > 0) {
        const profiles = await Profile.find({ userId: { $in: missingCreatorIds } }).select('userId name');
        const profileMap = new Map(profiles.map(p => [String(p.userId), p.name]));
        activities = activities.map(a => {
          if (a.createdBy && !a.createdBy.username) {
            const name = profileMap.get(String(a.createdBy._id));
            if (name) {
              a.createdBy.username = name;
            }
          }
          return a;
        });
      }
    } catch (pfErr) {
      console.warn('Could not attach profile names to activities:', pfErr.message);
    }

    res.status(200).json({
      activities
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete activity
router.delete('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByIdAndDelete(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json({
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Groups Stats
// ===============================
router.get('/groups/stats', async (req, res) => {
  try {
    const total = await Group.countDocuments();
    const recent = await Group.find()
      .select('name category members createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      total,
      recent
    });
  } catch (error) {
    console.error('Error getting groups stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    console.log('Fetching groups...');
    
    const groupsCount = await Group.countDocuments();
    console.log('Total groups:', groupsCount);
    
    if (groupsCount === 0) {
      return res.status(200).json({ groups: [] });
    }
    
    const groups = await Group.find()
      .populate({
        path: 'createdBy',
        select: 'email username',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'members.user',
        select: 'email username',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log('Groups fetched successfully:', groups.length);
    res.status(200).json({
      groups
    });
  } catch (error) {
    console.error('Error getting groups:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete group
router.delete('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByIdAndDelete(id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Events Stats
// ===============================
router.get('/events/stats', async (req, res) => {
  try {
    const total = await Event.countDocuments();
    const recent = await Event.find()
      .select('title activityId date createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      total,
      recent
    });
  } catch (error) {
    console.error('Error getting events stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    console.log('Fetching events...');
    
    const eventsCount = await Event.countDocuments();
    console.log('Total events:', eventsCount);
    
    if (eventsCount === 0) {
      return res.status(200).json({ events: [] });
    }
    
    const events = await Event.find()
      .populate({
        path: 'createdBy',
        select: 'email username',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log('Events fetched successfully:', events.length);
    res.status(200).json({
      events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Chats Stats
// ===============================
router.get('/chats/stats', async (req, res) => {
  try {
    const total = await Chat.countDocuments();
    const recent = await Chat.find()
      .select('type participants messages createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      total,
      recent
    });
  } catch (error) {
    console.error('Error getting chats stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all chats
router.get('/chats', async (req, res) => {
  try {
    console.log('Fetching chats...');
    
    // Try to get chats without populate first
    const chatsCount = await Chat.countDocuments();
    console.log('Total chats:', chatsCount);
    
    if (chatsCount === 0) {
      return res.status(200).json({ chats: [] });
    }
    
    // Try with selective populate
    const chats = await Chat.find()
      .populate({
        path: 'participants.user',
        select: 'email username',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'groupInfo.relatedActivity',
        select: 'title',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'createdBy',
        select: 'email username',
        options: { strictPopulate: false }
      })
      .sort({ updatedAt: -1 })
      .lean();

    console.log('Chats fetched successfully:', chats.length);
    res.status(200).json({
      chats
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete chat
router.delete('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdAndDelete(id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.status(200).json({
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Dashboard Overview (all stats at once)
// ===============================
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalActivities,
      totalGroups,
      totalEvents,
      totalChats,
      recentUsers,
      recentActivities
    ] = await Promise.all([
      User.countDocuments(),
      Activity.countDocuments(),
      Group.countDocuments(),
      Event.countDocuments(),
      Chat.countDocuments(),
      User.find().select('email username role createdAt').sort({ createdAt: -1 }).limit(5),
      Activity.find().select('title category status createdAt').sort({ createdAt: -1 }).limit(5)
    ]);

    res.status(200).json({
      stats: {
        totalUsers,
        totalActivities,
        totalGroups,
        totalEvents,
        totalChats
      },
      recentUsers,
      recentActivities
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
