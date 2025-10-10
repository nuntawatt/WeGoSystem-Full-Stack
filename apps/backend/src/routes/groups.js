import express from 'express';
import Group from '../models/group.js';
import Activity from '../models/activity.js';
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

export default router;