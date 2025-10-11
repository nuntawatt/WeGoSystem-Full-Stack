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
import Chat from './models/chat.js';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
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
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ===============================
// Socket.io Configuration
// ===============================

// Store active users
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // User authentication and join
  socket.on('user:join', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${userId} joined with socket ${socket.id}`);
    
    // Notify user is online
    io.emit('user:online', { userId, socketId: socket.id });
  });

  // Join chat room
  socket.on('chat:join', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`💬 Socket ${socket.id} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`🚪 Socket ${socket.id} left chat ${chatId}`);
  });

  // Send message (save to DB and broadcast)
  socket.on('message:send', async (data) => {
    const { chatId, userId, sender, content, type = 'text', fileUrl } = data;
    const senderId = userId || sender; // Support both field names
    
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
      const newMessage = chat.messages[chat.messages.length - 1];

      // Broadcast to all users in the chat room (including sender)
      io.to(`chat:${chatId}`).emit('message:receive', newMessage);
      
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

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      io.emit('user:offline', { userId: socket.userId });
      console.log(`❌ User ${socket.userId} disconnected`);
    } else {
      console.log(`❌ Socket ${socket.id} disconnected`);
    }
  });
});

// Make io accessible to routes
app.set('io', io);

httpServer.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`⚡ Socket.io is ready for connections`);
});