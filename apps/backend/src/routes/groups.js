import express from 'express';
import Group from '../models/group.js';
import Activity from '../models/activity.js';
import Review from '../models/review.js';
import Report from '../models/report.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get groups for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const groups = await Group.find({ eventId: req.params.eventId })
      .populate('members.userId', 'email')
      .populate('createdBy', 'email')
      .sort({ createdAt: 1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group by id
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.userId', 'email')
      .populate('createdBy', 'email')
      .populate('eventId');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create group for event
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, eventId, maxMembers } = req.body;
    
    // Verify event exists
    const event = await Activity.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const group = new Group({
      name,
      description,
      eventId,
      maxMembers: maxMembers || 10,
      createdBy: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'owner'
      }]
    });

    await group.save();
    await group.populate('members.userId', 'email');
    await group.populate('createdBy', 'email');
    
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    const existingMember = group.members.find(member => 
      member.userId.toString() === req.user._id.toString()
    );
    
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }

    group.members.push({
      userId: req.user._id,
      role: 'member'
    });

    await group.save();
    await group.populate('members.userId', 'email');
    
    res.json({ message: 'Successfully joined group', group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(member => 
      member.userId.toString() === req.user._id.toString()
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }

    // Check if user is owner
    const member = group.members[memberIndex];
    if (member.role === 'owner' && group.members.length > 1) {
      return res.status(400).json({ 
        error: 'Owner cannot leave group. Transfer ownership first or delete the group.' 
      });
    }

    group.members.splice(memberIndex, 1);
    await group.save();
    await group.populate('members.userId', 'email');
    
    res.json({ message: 'Successfully left group', group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update group
router.put('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is owner or admin
    const member = group.members.find(member => 
      member.userId.toString() === req.user._id.toString()
    );
    
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { name, description, maxMembers } = req.body;
    
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (maxMembers) group.maxMembers = maxMembers;

    await group.save();
    await group.populate('members.userId', 'email');
    await group.populate('createdBy', 'email');
    
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is owner
    const member = group.members.find(member => 
      member.userId.toString() === req.user._id.toString()
    );
    
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only group owner can delete the group' });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a group
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ groupId: req.params.id })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    res.json({
      reviews,
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update review for a group
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const groupId = req.params.id;
    const userId = req.user._id;

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user was/is a member of the group
    const isMember = group.members.some(member => 
      member.userId.toString() === userId.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ error: 'Only group members can review' });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if review already exists
    let review = await Review.findOne({ groupId, userId });
    
    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || review.comment;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        groupId,
        userId,
        rating,
        comment
      });
      await review.save();
    }

    await review.populate('userId', 'email');

    // Emit realtime event for group reviews so clients can refresh if needed
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('group:review', {
          groupId,
          review
        });
      }
    } catch (e) {
      console.warn('Failed to emit group:review event', e && e.message ? e.message : e);
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Report a group
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const groupId = req.params.id;
    const reportedBy = req.user._id;

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Validate reason
    const validReasons = ['spam', 'inappropriate_content', 'harassment', 'false_information', 'scam', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    // Validate details
    if (!details || details.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide detailed description (at least 10 characters)' });
    }

    // Create report
    const report = new Report({
      targetType: 'group',
      targetId: groupId,
      reportedBy,
      reason,
      details
    });

    await report.save();
    await report.populate('reportedBy', 'email');
    
    res.status(201).json({ 
      message: 'Report submitted successfully', 
      report 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

// Dev-only helper: create group from activity id (useful for testing)
// Accessible only when NODE_ENV !== 'production'
if (process.env.NODE_ENV !== 'production') {
  router.post('/__dev/create-from-activity/:activityId', async (req, res) => {
    try {
      const Activity = await import('../models/activity.js');
      const activity = await Activity.default.findById(req.params.activityId);
      if (!activity) return res.status(404).json({ error: 'Activity not found' });

      const Group = await import('../models/group.js');
      const group = new Group.default({
        name: `Group for: ${activity.title}`,
        owner: req.body.owner || activity.createdBy,
        members: [req.body.owner || activity.createdBy],
        isPrivate: false
      });
      await group.save();
      res.status(201).json(group);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}