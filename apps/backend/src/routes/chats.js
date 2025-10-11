import express from 'express';
import Chat from '../models/chat.js';
import User from '../models/user.js';
import Activity from '../models/activity.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// ===============================
// Chat Management Routes
// ===============================

/**
 * @route   POST /api/chats/direct
 * @desc    Create or get existing direct chat between two users
 * @access  Private
 * @body    { recipientId: String }
 */
router.post('/direct', async (req, res) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    // Can't create chat with yourself
    if (currentUserId.equals(recipientId)) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Use static method to create or get existing direct chat
    const chat = await Chat.createDirectChat(currentUserId, recipientId);
    
    // Populate user details
    await chat.populate('participants.user', 'email username');

    res.status(200).json({
      message: 'Direct chat created/retrieved successfully',
      chat
    });
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chats/group
 * @desc    Create a new group chat
 * @access  Private
 * @body    { name: String, description: String, participantIds: [String], relatedActivityId: String }
 */
router.post('/group', async (req, res) => {
  try {
    const { name, description, participantIds = [], relatedActivityId } = req.body;
    const currentUserId = req.user._id;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Prepare participants array (creator is admin, others are members)
    const participants = [
      { user: currentUserId, role: 'admin' }
    ];

    // Add other participants as members
    for (const userId of participantIds) {
      if (!userId.equals || !currentUserId.equals(userId)) {
        const user = await User.findById(userId);
        if (user) {
          participants.push({ user: userId, role: 'member' });
        }
      }
    }

    // Validate related activity if provided
    let relatedActivity = null;
    if (relatedActivityId) {
      relatedActivity = await Activity.findById(relatedActivityId);
      if (!relatedActivity) {
        return res.status(404).json({ message: 'Related activity not found' });
      }
    }

    // Create group chat using static method
    const groupInfo = {
      name: name.trim(),
      description: description?.trim() || '',
      relatedActivity: relatedActivityId || null
    };

    const chat = await Chat.createGroupChat({
      participants,
      groupInfo,
      createdBy: currentUserId
    });

    // Update activity's chat reference if related
    if (relatedActivity) {
      relatedActivity.chat = chat._id;
      await relatedActivity.save();
    }

    // Populate user details
    await chat.populate('participants.user', 'email username');
    await chat.populate('groupInfo.relatedActivity', 'title category');

    res.status(201).json({
      message: 'Group chat created successfully',
      chat
    });
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/chats
 * @desc    Get all chats for the current user with last message preview
 * @access  Private
 * @query   ?type=direct|group&limit=20&page=1
 */
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { type, limit = 20, page = 1 } = req.query;

    // Build query
    const query = {
      'participants.user': currentUserId,
      isActive: true
    };

    if (type && ['direct', 'group'].includes(type)) {
      query.type = type;
    }

    // Get total count
    const total = await Chat.countDocuments(query);

    // Get chats with pagination
    const chats = await Chat.find(query)
      .populate('participants.user', 'email username')
      .populate('groupInfo.relatedActivity', 'title category')
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Add unread count and last message preview for each chat
    const chatsWithInfo = chats.map(chat => {
      const chatObj = chat.toObject();
      
      // Get unread count
      chatObj.unreadCount = chat.getUnreadCount(currentUserId);
      
      // Get last message preview
      if (chat.messages.length > 0) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        chatObj.lastMessagePreview = {
          content: lastMsg.isDeleted ? '[Message deleted]' : lastMsg.content,
          type: lastMsg.type,
          sender: lastMsg.sender,
          createdAt: lastMsg.createdAt
        };
      } else {
        chatObj.lastMessagePreview = null;
      }

      return chatObj;
    });

    res.status(200).json({
      chats: chatsWithInfo,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/chats/:id
 * @desc    Get specific chat with all messages
 * @access  Private
 * @query   ?limit=50&page=1
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;
    const { limit = 50, page = 1 } = req.query;

    // Find chat
    const chat = await Chat.findById(id)
      .populate('participants.user', 'email username')
      .populate('messages.sender', 'email username')
      .populate('groupInfo.relatedActivity', 'title category location');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // If this chat is linked to an activity, enforce activity capacity rules:
    const relatedActivity = chat.groupInfo?.relatedActivity;
    if (relatedActivity) {
      const ActivityModel = Activity; // imported at top
      const activity = await ActivityModel.findById(relatedActivity._id);
      if (activity) {
        // compute effective count: participants.length + (creator occupies slot if not already in participants)
        const storedParticipants = activity.participants.length;
        const creatorId = activity.createdBy ? activity.createdBy.toString() : null;
        const creatorInParticipants = creatorId ? activity.participants.some(p => p.user && p.user.toString() === creatorId) : false;
        const creatorOccupiesSlot = creatorId && !creatorInParticipants;
        const effectiveCount = storedParticipants + (creatorOccupiesSlot ? 1 : 0);

        const isActivityFull = activity.maxParticipants && effectiveCount >= activity.maxParticipants;

        // check if current user is listed as a participant in the activity
        const userIsActivityParticipant = activity.participants.some(p => p.user && p.user.equals(currentUserId));

        if (isActivityFull && !userIsActivityParticipant) {
          return res.status(403).json({ message: 'Activity is full - access to chat is restricted to participants' });
        }
      }
    }

    // Check if user is a participant in chat (existing rule)
    const isParticipant = chat.participants.some(p => p.user._id.equals(currentUserId));
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Prepare chat object
    const chatObj = chat.toObject();

    // Paginate messages (newest first, then reverse for display)
    const totalMessages = chat.messages.filter(m => !m.isDeleted).length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get messages (excluding deleted ones)
    const messages = chat.messages
      .filter(m => !m.isDeleted)
      .slice(-parseInt(limit) - skip)
      .slice(-parseInt(limit));

    chatObj.messages = messages;
    chatObj.messagesPagination = {
      total: totalMessages,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalMessages / parseInt(limit)),
      hasMore: skip + parseInt(limit) < totalMessages
    };

    // Get unread count for current user
    chatObj.unreadCount = chat.getUnreadCount(currentUserId);

    res.status(200).json({ chat: chatObj });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Message Management Routes
// ===============================

/**
 * @route   POST /api/chats/:id/messages
 * @desc    Send a new message to a chat
 * @access  Private
 * @body    { content: String, type: String, fileUrl: String }
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type = 'text', fileUrl } = req.body;
    const currentUserId = req.user._id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Validate type
    if (!['text', 'image', 'file', 'system'].includes(type)) {
      return res.status(400).json({ message: 'Invalid message type' });
    }

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // If this chat is linked to an activity, enforce activity capacity rules (same as GET)
    if (chat.groupInfo && chat.groupInfo.relatedActivity) {
      const activity = await Activity.findById(chat.groupInfo.relatedActivity);
      if (activity) {
        const storedParticipants = activity.participants.length;
        const creatorId = activity.createdBy ? activity.createdBy.toString() : null;
        const creatorInParticipants = creatorId ? activity.participants.some(p => p.user && p.user.toString() === creatorId) : false;
        const creatorOccupiesSlot = creatorId && !creatorInParticipants;
        const effectiveCount = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
        const isActivityFull = activity.maxParticipants && effectiveCount >= activity.maxParticipants;
        const userIsActivityParticipant = activity.participants.some(p => p.user && p.user.equals(currentUserId));

        if (isActivityFull && !userIsActivityParticipant) {
          return res.status(403).json({ message: 'Activity is full - access to chat is restricted to participants' });
        }
      }
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(p => p.user.equals(currentUserId));
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Add message using instance method
    await chat.addMessage(currentUserId, content.trim(), type, fileUrl);

    // Populate the last message
    await chat.populate('messages.sender', 'email username');

    // Get the newly added message
    const newMessage = chat.messages[chat.messages.length - 1];

    // Emit Socket.io event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${id}`).emit('message:receive', {
        chatId: id,
        message: newMessage
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/chats/:id/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 * @body    { content: String }
 */
router.put('/:id/messages/:messageId', async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Find message
    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (!message.sender.equals(currentUserId)) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit a deleted message' });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await chat.save();

    res.status(200).json({
      message: 'Message updated successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/chats/:id/messages/:messageId
 * @desc    Delete a message (soft delete)
 * @access  Private
 */
router.delete('/:id/messages/:messageId', async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const currentUserId = req.user._id;

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Find message
    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender or chat admin
    const participant = chat.participants.find(p => p.user.equals(currentUserId));
    const isAdmin = participant && participant.role === 'admin';
    const isSender = message.sender.equals(currentUserId);

    if (!isSender && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own messages or be an admin' });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Message deleted]';

    // Update lastMessage if this was the last message
    if (chat.lastMessage && chat.lastMessage.equals(messageId)) {
      // Find the last non-deleted message
      const lastActiveMessage = chat.messages
        .filter(m => !m.isDeleted)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      
      chat.lastMessage = lastActiveMessage ? lastActiveMessage._id : null;
    }

    await chat.save();

    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/chats/:id/read
 * @desc    Mark messages as read
 * @access  Private
 * @body    { messageIds: [String] } (optional - if empty, marks all as read)
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { messageIds = [] } = req.body;
    const currentUserId = req.user._id;

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(p => p.user.equals(currentUserId));
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Mark messages as read using instance method
    await chat.markAsRead(currentUserId, messageIds);

    res.status(200).json({
      message: messageIds.length > 0 
        ? `${messageIds.length} messages marked as read` 
        : 'All messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================
// Participant Management Routes
// ===============================

/**
 * @route   POST /api/chats/:id/participants
 * @desc    Add a participant to a group chat
 * @access  Private (Admin only)
 * @body    { userId: String, role: String }
 */
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;
    const currentUserId = req.user._id;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only group chats can add participants
    if (chat.type !== 'group') {
      return res.status(400).json({ message: 'Can only add participants to group chats' });
    }

    // Check if current user is admin
    const currentParticipant = chat.participants.find(p => p.user.equals(currentUserId));
    if (!currentParticipant || currentParticipant.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add participants' });
    }

    // Add participant using instance method
    await chat.addParticipant(userId, role);

    // Add system message
    await chat.addMessage(
      currentUserId, 
      `${user.email} has been added to the chat`, 
      'system'
    );

    // Populate user details
    await chat.populate('participants.user', 'email username');

    res.status(200).json({
      message: 'Participant added successfully',
      chat
    });
  } catch (error) {
    if (error.message === 'User is already a participant') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/chats/:id/participants/:userId
 * @desc    Remove a participant from a group chat
 * @access  Private (Admin only or self)
 */
router.delete('/:id/participants/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user._id;

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only group chats can remove participants
    if (chat.type !== 'group') {
      return res.status(400).json({ message: 'Can only remove participants from group chats' });
    }

    // Check permissions (admin or removing self)
    const currentParticipant = chat.participants.find(p => p.user.equals(currentUserId));
    const isAdmin = currentParticipant && currentParticipant.role === 'admin';
    const isSelf = currentUserId.toString() === userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Only admins can remove other participants' });
    }

    // Get user details before removal
    const userToRemove = await User.findById(userId);

    // Remove participant using instance method
    await chat.removeParticipant(userId);

    // Add system message
    if (isSelf) {
      await chat.addMessage(
        currentUserId, 
        `${userToRemove?.email || 'User'} has left the chat`, 
        'system'
      );
    } else {
      await chat.addMessage(
        currentUserId, 
        `${userToRemove?.email || 'User'} has been removed from the chat`, 
        'system'
      );
    }

    // Populate user details
    await chat.populate('participants.user', 'email username');

    res.status(200).json({
      message: 'Participant removed successfully',
      chat
    });
  } catch (error) {
    if (error.message === 'User is not a participant') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/chats/:id/participants/:userId/role
 * @desc    Update participant role in group chat
 * @access  Private (Admin only)
 * @body    { role: String }
 */
router.put('/:id/participants/:userId/role', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user._id;

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin or member' });
    }

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only group chats have roles
    if (chat.type !== 'group') {
      return res.status(400).json({ message: 'Can only update roles in group chats' });
    }

    // Check if current user is admin
    const currentParticipant = chat.participants.find(p => p.user.equals(currentUserId));
    if (!currentParticipant || currentParticipant.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update participant roles' });
    }

    // Find target participant
    const targetParticipant = chat.participants.find(p => p.user.equals(userId));
    if (!targetParticipant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update role
    targetParticipant.role = role;
    await chat.save();

    // Populate user details
    await chat.populate('participants.user', 'email username');

    res.status(200).json({
      message: 'Participant role updated successfully',
      chat
    });
  } catch (error) {
    console.error('Error updating participant role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/chats/:id/mute
 * @desc    Mute/unmute a chat for current user
 * @access  Private
 * @body    { isMuted: Boolean }
 */
router.put('/:id/mute', async (req, res) => {
  try {
    const { id } = req.params;
    const { isMuted } = req.body;
    const currentUserId = req.user._id;

    // Validate isMuted
    if (typeof isMuted !== 'boolean') {
      return res.status(400).json({ message: 'isMuted must be a boolean value' });
    }

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Find current participant
    const participant = chat.participants.find(p => p.user.equals(currentUserId));
    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Update mute status
    participant.isMuted = isMuted;
    await chat.save();

    res.status(200).json({
      message: isMuted ? 'Chat muted successfully' : 'Chat unmuted successfully',
      isMuted
    });
  } catch (error) {
    console.error('Error updating mute status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/chats/:id
 * @desc    Delete/leave a chat
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    // Find chat
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const participant = chat.participants.find(p => p.user.equals(currentUserId));
    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    if (chat.type === 'direct') {
      // For direct chats, just remove the participant
      await chat.removeParticipant(currentUserId);
      res.status(200).json({ message: 'Left chat successfully' });
    } else {
      // For group chats
      if (participant.role === 'admin') {
        // Check if there are other admins
        const adminCount = chat.participants.filter(p => p.role === 'admin').length;
        
        if (adminCount === 1 && chat.participants.length > 1) {
          return res.status(400).json({ 
            message: 'Cannot leave as the only admin. Promote another member to admin first.' 
          });
        }

        // If last participant or multiple admins, can leave
        await chat.removeParticipant(currentUserId);
        res.status(200).json({ message: 'Left group chat successfully' });
      } else {
        // Regular member can leave anytime
        await chat.removeParticipant(currentUserId);
        res.status(200).json({ message: 'Left group chat successfully' });
      }
    }
  } catch (error) {
    console.error('Error deleting/leaving chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
