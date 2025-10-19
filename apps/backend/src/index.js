import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import activityRoutes from './routes/activities.js';
import groupRoutes from './routes/groups.js';
import eventRoutes from './routes/events.js';
import chatRoutes from './routes/chats.js';
import adminRoutes from './routes/admin.js';
import directMessageRoutes from './routes/directmessages.js';
import uploadsRoutes from './routes/uploads.js';
import reportsRoutes from './routes/reports.js';
import Chat from './models/chat.js';
import User from './models/user.js';
import Profile from './models/profile.js';
import DirectMessage from './models/directmessage.js';

dotenv.config();

// Validate email env for developer clarity
if (process.env.EMAIL_USER && !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️ EMAIL_USER is set but EMAIL_PASSWORD is missing. If using Gmail, create an App Password and set EMAIL_PASSWORD to that value.');
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log('CORS/Frontend origin configured as:', frontendOrigin);

const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Port selection logic:
// - When deployed on Render, Render sets PORT and we should use it.
// - For local testing you can set LOCAL_PORT to override the default local port.
// - FALLBACK: 10000
const port = process.env.PORT || process.env.LOCAL_PORT || 10000;

// Middleware
app.use(cors({
  origin: frontendOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/directmessages', directMessageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/reports', reportsRoutes);

// Simple health check
app.get('/_health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), commit: process.env.COMMIT_ID || null });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ===============================
// Socket.io Configuration
// ===============================


// Store active users: map userId -> Set of socketIds
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // User authentication and join
  socket.on('user:join', async (userId) => {
    try {
        // Avoid processing if this same socket already registered with this userId
        if (socket.userId && socket.userId === userId) {
          // already joined on this socket for this user
          return;
        }

        let sockets = activeUsers.get(userId);
        if (!sockets) sockets = new Set();
        sockets.add(socket.id);
        activeUsers.set(userId, sockets);
        socket.userId = userId;
        console.log(`👤 User ${userId} joined with socket ${socket.id}`);

      // Only update DB and emit if this is the first active socket for the user
      const currentSockets = activeUsers.get(userId);
      if (currentSockets && currentSockets.size === 1) {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastActive: new Date()
        });
        io.emit('userStatusChanged', { userId, isOnline: true });
        console.log(`🟢 User ${userId} is now ONLINE`);
      }
    } catch (error) {
      console.error('Error handling user:join:', error);
    }
  });

  // Join chat room
  socket.on('chat:join', async (chatId) => {
    try {
      socket.join(`chat:${chatId}`);
      console.log(`💬 Socket ${socket.id} joined chat ${chatId}`);

      // Send current participant snapshot to the joining socket so their UI can render members immediately
      const chat = await Chat.findById(chatId).populate({
        path: 'participants.user',
        select: 'email username isOnline createdAt',
        populate: {
          path: 'profile',
          select: 'avatar bio'
        }
      });
      if (chat) {
        const parts = chat.participants
          .filter(p => p.user)
          .map(p => ({
            id: p.user._id,
            email: p.user.email,
            username: p.user.username,
            isOnline: !!p.user.isOnline,
            role: p.role,
            avatar: p.user.profile?.avatar || '',
            bio: p.user.profile?.bio || '',
            createdAt: p.user.createdAt
          }));
        socket.emit('chat:participants', { participants: parts });
      }
    } catch (err) {
      console.error('Error in chat:join handler:', err);
    }
  });

  // Leave chat room
  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`🚪 Socket ${socket.id} left chat ${chatId}`);
  });

  // Send message (save to DB and broadcast)
  socket.on('message:send', async (data) => {
    const { chatId, userId, sender, content, type = 'text', fileUrl } = data;
    // Support both field names and normalize senderId to a string id when possible
    let senderId = userId || sender; // can be string or object
    if (senderId && typeof senderId === 'object') {
      if (senderId._id) senderId = senderId._id.toString();
      else if (senderId.userId) senderId = senderId.userId.toString();
      else if (senderId.id) senderId = senderId.id.toString();
      else senderId = String(senderId);
    }
    
    try {
      // Find chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.log(`❌ Chat ${chatId} not found`);
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Check if sender is a participant
      const isParticipant = chat.participants.some(p => 
        p.user.toString() === senderId || p.user.equals(senderId)
      );
      if (!isParticipant) {
        console.log(`❌ User ${senderId} is not a participant in chat ${chatId}`);
        socket.emit('error', { message: 'You are not a participant in this chat' });
        return;
      }

      // Add message to database
      await chat.addMessage(senderId, content.trim(), type, fileUrl);
      await chat.populate('messages.sender', 'email username');

      // Get the newly added message
      let newMessage = chat.messages[chat.messages.length - 1];

      // Enrich sender with profile avatar if exists
      try {
        const prof = await Profile.findOne({ userId: senderId });
        const nm = newMessage.toObject ? newMessage.toObject() : { ...newMessage };
        nm.sender = nm.sender || {};
        nm.sender.avatar = (prof && prof.avatar) ? prof.avatar : '';
        newMessage = nm;
      } catch (profErr) {
        console.error('Failed to attach profile avatar to message:', profErr);
      }

      // Broadcast to all users in the chat room EXCEPT the sender
      socket.to(`chat:${chatId}`).emit('message:receive', newMessage);
      
      // Also send back to sender for confirmation (optional)
      socket.emit('message:sent', newMessage);

      console.log(`📤 Message sent to chat ${chatId} by user ${senderId}`);
    } catch (err) {
      console.error('❌ Socket message:send error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing:start', (data) => {
    const { chatId, userId, username } = data;
    socket.to(`chat:${chatId}`).emit('user:typing', { userId, username });
  });

  socket.on('typing:stop', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat:${chatId}`).emit('user:stop_typing', { userId });
  });

  // Message read status
  socket.on('message:read', (data) => {
    const { chatId, messageIds, userId } = data;
    socket.to(`chat:${chatId}`).emit('message:read_update', { messageIds, userId });
  });

  // Activity notifications
  socket.on('activity:update', (data) => {
    const { activityId, type, message } = data;
    io.emit('activity:notification', { activityId, type, message });
  });

  // Direct Message (DM) support
  socket.on('dm:send', async (data) => {
    const { from, to, text, at } = data;
    console.log(`💌 DM from ${from} to ${to}: ${text}`);
    
    try {
      // Save to DirectMessage collection
      const dm = new DirectMessage({
        from,
        to,
        text
      });
      await dm.save();
      
      // Populate sender and receiver with profiles
      await dm.populate([
        { path: 'from', select: 'username email' },
        { path: 'to', select: 'username email' }
      ]);

      // Enrich with profile avatars
      const [fromProfile, toProfile] = await Promise.all([
        Profile.findOne({ userId: dm.from._id }),
        Profile.findOne({ userId: dm.to._id })
      ]);

      const enrichedMessage = {
        _id: dm._id,
        from: {
          _id: dm.from._id,
          username: dm.from.username,
          email: dm.from.email,
          avatar: fromProfile?.avatar || null
        },
        to: {
          _id: dm.to._id,
          username: dm.to.username,
          email: dm.to.email,
          avatar: toProfile?.avatar || null
        },
        text: dm.text,
        isRead: dm.isRead,
        createdAt: dm.createdAt,
        updatedAt: dm.updatedAt
      };
      
      // Find recipient's sockets and send to them
      const recipientSockets = activeUsers.get(to);
      if (recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach((socketId) => {
          io.to(socketId).emit('dm:receive', enrichedMessage);
        });
        console.log(`✅ DM delivered to ${to} (${recipientSockets.size} sockets)`);
      } else {
        console.log(`⚠️ Recipient ${to} is offline, DM saved but not delivered`);
      }
      
      // Echo back to sender for confirmation with enriched data
      socket.emit('dm:sent', enrichedMessage);
    } catch (error) {
      console.error('❌ Error saving DM:', error);
      socket.emit('dm:error', { error: 'Failed to send message' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        const userId = socket.userId;
        const sockets = activeUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            activeUsers.delete(userId);
            // Update user offline status in database and notify
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastActive: new Date()
            });
            io.emit('userStatusChanged', { userId, isOnline: false });
            console.log(`⚫ User ${userId} is now OFFLINE`);
          } else {
            // Still has other active sockets; do nothing
            activeUsers.set(userId, sockets);
            console.log(`🔌 Socket ${socket.id} disconnected for user ${userId}, still online on other sockets`);
          }
        }
      } else {
        console.log(`❌ Socket ${socket.id} disconnected`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Make io accessible to routes
app.set('io', io);

// Bind to 0.0.0.0 so Render can route traffic properly
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`⚡ Socket.io is ready for connections`);
});