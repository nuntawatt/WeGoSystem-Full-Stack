import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastRead: {
      type: Date,
      default: Date.now
    },
    isMuted: {
      type: Boolean,
      default: false
    }
  }],
  messages: [messageSchema],
  groupInfo: {
    name: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    },
    relatedActivity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, isActive: 1 });
chatSchema.index({ 'groupInfo.relatedActivity': 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ 'participants.user': 1, lastMessageAt: -1 });

// Index for direct messages (find chat between two users)
chatSchema.index({ 
  type: 1, 
  'participants.user': 1 
}, { 
  name: 'direct_chat_index' 
});

// Instance Methods

// Add a message to the chat
chatSchema.methods.addMessage = async function(senderId, content, type = 'text', fileUrl = null) {
  const message = {
    sender: senderId,
    content: content,
    type: type,
    fileUrl: fileUrl,
    readBy: [{ user: senderId }]
  };
  
  this.messages.push(message);
  this.lastMessage = this.messages[this.messages.length - 1]._id;
  this.lastMessageAt = new Date();
  
  return await this.save();
};

// Add a participant to the chat
chatSchema.methods.addParticipant = async function(userId, role = 'member') {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(p => p.user && p.user.equals(userId));
  
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  this.participants.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    lastRead: new Date()
  });
  
  return await this.save();
};

// Remove a participant from the chat
chatSchema.methods.removeParticipant = async function(userId) {
  const index = this.participants.findIndex(p => p.user && p.user.equals(userId));
  
  if (index === -1) {
    throw new Error('User is not a participant');
  }
  
  this.participants.splice(index, 1);
  
  // If no participants left and it's not a group chat, mark as inactive
  if (this.participants.length === 0 && this.type !== 'group') {
    this.isActive = false;
  }
  
  return await this.save();
};

// Mark messages as read by a user
chatSchema.methods.markAsRead = async function(userId, messageIds = []) {
  if (messageIds.length === 0) {
    // Mark all messages as read
    this.messages.forEach(msg => {
      if (!msg.readBy.some(r => r.user.equals(userId))) {
        msg.readBy.push({ user: userId, readAt: new Date() });
      }
    });
  } else {
    // Mark specific messages as read
    messageIds.forEach(msgId => {
      const message = this.messages.id(msgId);
      if (message && !message.readBy.some(r => r.user.equals(userId))) {
        message.readBy.push({ user: userId, readAt: new Date() });
      }
    });
  }
  
  // Update participant's lastRead
  const participant = this.participants.find(p => p.user && p.user.equals(userId));
  if (participant) {
    participant.lastRead = new Date();
  }
  
  return await this.save();
};

// Get unread message count for a user
chatSchema.methods.getUnreadCount = function(userId) {
  const participant = this.participants.find(p => p.user && p.user.equals(userId));
  if (!participant) return 0;
  
  return this.messages.filter(msg => 
    msg.createdAt > participant.lastRead && 
    !msg.sender.equals(userId) &&
    !msg.isDeleted
  ).length;
};

// Static Methods

// Create a direct chat between two users
chatSchema.statics.createDirectChat = async function(user1Id, user2Id) {
  // Check if chat already exists
  const existingChat = await this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] }
  });
  
  if (existingChat) {
    return existingChat;
  }
  
  // Create new direct chat
  const chat = new this({
    type: 'direct',
    participants: [
      { user: user1Id, role: 'member' },
      { user: user2Id, role: 'member' }
    ],
    createdBy: user1Id
  });
  
  return await chat.save();
};

// Create a group chat
chatSchema.statics.createGroupChat = async function(data) {
  const { participants, groupInfo, createdBy } = data;
  
  const chat = new this({
    type: 'group',
    participants: participants || [{ user: createdBy, role: 'admin' }],
    groupInfo: groupInfo || {},
    createdBy: createdBy
  });
  
  return await chat.save();
};

// Find chats for a user
chatSchema.statics.findUserChats = function(userId) {
  return this.find({
    'participants.user': userId,
    isActive: true
  })
    .populate('participants.user', 'email')
    .populate('messages.sender', 'email')
    .populate('groupInfo.relatedActivity', 'title')
    .sort({ lastMessageAt: -1 });
};

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
