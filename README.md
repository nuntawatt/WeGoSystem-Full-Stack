# 👋🏻 WeGo - Social Activity Platform

> Connect, plan, and explore activities with like-minded people

A full-stack social platform for discovering and organizing activities and events. Built with React, Node.js, and MongoDB.

---

## Features

- **Activities**: Create, browse, join events (playgame, outdoor, social, learning)
- **Real-time Chat**: Direct messages & group chats for activities
- **User Profiles**: Customizable profiles with avatars
- **Ratings**: Rate activities and provide feedback
- **Geolocation**: Find nearby activities
- **Media Upload**: Activity images and profile avatars
- **Secure Auth**: JWT authentication with bcrypt

---

## Tech Stack

**Backend**: Node.js, Express, MongoDB, JWT, Multer, Socket.io  
**Frontend**: React, TypeScript, Vite, TailwindCSS, React Query, Axios  
**Tools**: MongoDB Compass, Postman, Git

---

## Quick Start

### Prerequisites
- Node.js v22.17.0+
- MongoDB Atlas account
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/nuntawatt/WeGoSystem-Full-Stack.git
cd WeGo

# Backend setup
cd apps/backend
npm install
# Create .env file with MONGODB_URI, JWT_SECRET, PORT
npm run dev

# Frontend setup (new terminal)
cd apps/frontend
npm install
npm run dev
```

**Backend**: `http://localhost:5000`  
**Frontend**: `http://localhost:5173`

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (email/username + password)
- `GET /api/auth/me` - Get current user

### Activities
- `GET /api/activities` - List all activities (with filters)
- `POST /api/activities` - Create activity
- `GET /api/activities/:id` - Get activity details
- `POST /api/activities/:id/join` - Join activity
- `POST /api/activities/:id/rate` - Rate activity
- `POST /api/activities/:id/images` - Upload images
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Chat
- `POST /api/chats/direct` - Create direct chat
- `POST /api/chats/group` - Create group chat
- `GET /api/chats` - Get all user chats
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/chats/:id/read` - Mark as read
- `POST /api/chats/:id/participants` - Add member
- `DELETE /api/chats/:id/participants/:userId` - Remove member

### Profile
- `GET /api/profiles/:userId` - Get profile
- `POST /api/profiles` - Create/update profile
- `POST /api/profiles/avatar` - Upload avatar
---

## Acknowledgments

- Thanks to all contributors who helped build this platform
- Inspired by social activity platforms like Meetup and Eventbrite
- Built with using modern web technologies

---


