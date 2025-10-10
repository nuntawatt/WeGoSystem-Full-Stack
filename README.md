# 🌍 WeGo - Social Activity & Event Planning Platform

> **Connect, Plan, and Explore Activities Together**

WeGo is a full-stack social platform that enables users to discover, create, and join activities and events with like-minded people. Built with modern web technologies to provide seamless real-time communication and collaboration.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 **Core Features**
- **Activity Management**: Create, browse, and join various activities (sports, outdoor, social, learning, etc.)
- **Event Planning**: Organize events with detailed information (location, time, requirements, cost)
- **Group System**: Form groups around shared interests and activities
- **Real-time Chat**: Direct messaging and group chats with Socket.io
- **User Profiles**: Customizable profiles with avatars and bio
- **Rating & Reviews**: Rate activities and provide feedback
- **Geolocation**: Find nearby activities using location-based search

### 💬 **Chat Features**
- Direct messaging (1-on-1)
- Group chat for activities
- Message read status
- Message editing and deletion
- Participant management (add/remove members)
- Mute notifications
- System messages for group events

### 🔐 **Authentication**
- JWT-based authentication
- Login with email or username
- Secure password hashing with bcrypt
- Protected routes with middleware

### 🖼️ **Media Upload**
- Activity image uploads (multiple images per activity)
- Profile avatar uploads
- File storage with Multer
- Automatic file cleanup on deletion

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime**: Node.js v22.17.0
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Real-time**: Socket.io (planned)
- **Validation**: Custom validators

### **Frontend**
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router
- **State Management**: React Query
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client (planned)

### **Development Tools**
- **Package Manager**: npm
- **Linting**: ESLint
- **Version Control**: Git
- **Database GUI**: MongoDB Compass
- **API Testing**: Postman

---

## 📁 Project Structure

```
WeGo/
├── apps/
│   ├── backend/                 # Backend API Server
│   │   ├── src/
│   │   │   ├── index.js        # Server entry point
│   │   │   ├── middleware/
│   │   │   │   └── auth.js     # JWT authentication middleware
│   │   │   ├── models/         # Mongoose schemas
│   │   │   │   ├── user.js
│   │   │   │   ├── activity.js
│   │   │   │   ├── profile.js
│   │   │   │   ├── chat.js
│   │   │   │   ├── group.js
│   │   │   │   └── event.js
│   │   │   └── routes/         # API endpoints
│   │   │       ├── auth.js
│   │   │       ├── activities.js
│   │   │       ├── profiles.js
│   │   │       ├── chats.js
│   │   │       ├── groups.js
│   │   │       └── events.js
│   │   ├── uploads/            # File storage
│   │   │   ├── avatar-*.png
│   │   │   └── activities/
│   │   ├── package.json
│   │   └── .env
│   │
│   └── frontend/               # React Frontend
│       ├── src/
│       │   ├── main.tsx        # App entry point
│       │   ├── App.tsx         # Root component
│       │   ├── components/     # Reusable components
│       │   ├── pages/          # Page components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities & API clients
│       │   ├── types/          # TypeScript types
│       │   └── styles/         # Global styles
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── package.json                # Root workspace config
└── README.md
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js v22.17.0 or higher
- npm or yarn
- MongoDB Atlas account or local MongoDB instance
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/nuntawatt/WeGoSystem-Full-Stack.git
   cd WeGo
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd apps/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   Create `.env` file in `apps/backend/`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/WeGo
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=development
   ```

4. **Run the application**

   **Backend (Terminal 1):**
   ```bash
   cd apps/backend
   npm run dev
   ```
   Server runs on `http://localhost:5000`

   **Frontend (Terminal 2):**
   ```bash
   cd apps/frontend
   npm run dev
   ```
   App runs on `http://localhost:5173`

---

## 📚 API Documentation

### **Base URL**
```
http://localhost:5000/api
```

### **Authentication Endpoints**

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

---

### **Activity Endpoints**

#### Get All Activities
```http
GET /activities?category=outdoor&tags=hiking&limit=10&page=1
Authorization: Bearer {token}
```

#### Create Activity
```http
POST /activities
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Weekend Hiking Trip",
  "description": "Join us for a scenic mountain hike!",
  "category": "outdoor",
  "location": "Doi Suthep, Chiang Mai",
  "date": "2025-10-15T08:00:00Z",
  "maxParticipants": 10,
  "tags": ["hiking", "nature", "exercise"]
}
```

#### Join Activity
```http
POST /activities/:id/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed",
  "note": "Looking forward to it!"
}
```

#### Rate Activity
```http
POST /activities/:id/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "review": "Amazing experience!"
}
```

#### Upload Activity Images
```http
POST /activities/:id/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

images: [file1.jpg, file2.jpg]
```

---

### **Chat Endpoints**

#### Create Direct Chat
```http
POST /chats/direct
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "user_id_here"
}
```

#### Create Group Chat
```http
POST /chats/group
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Activity Planning Group",
  "description": "Let's plan our next adventure!",
  "participantIds": ["user1_id", "user2_id"],
  "relatedActivityId": "activity_id"
}
```

#### Send Message
```http
POST /chats/:id/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello everyone!",
  "type": "text"
}
```

#### Mark Messages as Read
```http
PUT /chats/:id/read
Authorization: Bearer {token}
Content-Type: application/json

{
  "messageIds": []
}
```

#### Add Participant to Group
```http
POST /chats/:id/participants
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_id_here",
  "role": "member"
}
```

---

### **Profile Endpoints**

#### Get Profile
```http
GET /profiles/:userId
Authorization: Bearer {token}
```

#### Create/Update Profile
```http
POST /profiles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Adventure seeker and outdoor enthusiast"
}
```

#### Upload Avatar
```http
POST /profiles/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: file.jpg
```

---

## 🗄️ Database Schema

### **User Model**
```javascript
{
  username: String (unique, optional),
  email: String (required, unique),
  password: String (hashed),
  role: String (default: 'user'),
  createdAt: Date
}
```

### **Activity Model**
```javascript
{
  title: String (required),
  description: String,
  category: String (sports|outdoor|social|learning|food|entertainment|other),
  location: {
    address: String,
    coordinates: {
      type: Point,
      coordinates: [longitude, latitude]
    }
  },
  date: Date,
  endTime: Date,
  maxParticipants: Number,
  participants: [{
    user: ObjectId,
    status: String (pending|confirmed|cancelled),
    joinedAt: Date,
    note: String
  }],
  images: [{
    url: String,
    description: String,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],
  ratings: [{
    user: ObjectId,
    rating: Number (1-5),
    review: String,
    createdAt: Date
  }],
  averageRating: Number,
  tags: [String],
  difficulty: String (easy|moderate|hard),
  cost: {
    amount: Number,
    currency: String
  },
  requirements: [String],
  status: String (draft|published|completed|cancelled),
  visibility: String (public|private),
  chat: ObjectId (ref: Chat),
  creator: ObjectId (ref: User),
  createdAt: Date
}
```

### **Chat Model**
```javascript
{
  type: String (direct|group),
  participants: [{
    user: ObjectId,
    role: String (admin|member),
    joinedAt: Date,
    lastRead: Date,
    isMuted: Boolean
  }],
  messages: [{
    sender: ObjectId,
    content: String,
    type: String (text|image|file|system),
    fileUrl: String,
    readBy: [{
      user: ObjectId,
      readAt: Date
    }],
    isEdited: Boolean,
    editedAt: Date,
    isDeleted: Boolean,
    deletedAt: Date,
    createdAt: Date
  }],
  groupInfo: {
    name: String,
    description: String,
    avatar: String,
    relatedActivity: ObjectId
  },
  lastMessage: ObjectId,
  lastMessageAt: Date,
  createdBy: ObjectId,
  isActive: Boolean
}
```

### **Profile Model**
```javascript
{
  userId: ObjectId (ref: User),
  name: String (required),
  avatar: String,
  bio: String,
  updatedAt: Date
}
```

---

## 🧪 Testing

### **API Testing with Postman**

1. Import the Postman collection (coming soon)
2. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: Your JWT token from login

### **Test Coverage**

- ✅ Authentication (Register, Login, Get User)
- ✅ Activities CRUD (Create, Read, Update, Delete)
- ✅ Activity Features (Join, Leave, Rate, Report)
- ✅ Activity Images (Upload, View, Delete)
- ✅ Profile Management (Create, Update, Avatar Upload)
- ✅ Chat System (Direct Chat, Group Chat)
- ✅ Messages (Send, Edit, Delete, Mark as Read)
- ✅ Participants (Add, Remove, Update Role)
- ⏳ Socket.io Real-time (Planned)

---

## 🎯 Roadmap

### **Phase 1: Core Features** ✅ (Completed)
- [x] User authentication
- [x] Activity management
- [x] Profile system
- [x] Basic chat functionality

### **Phase 2: Enhanced Features** 🚧 (In Progress)
- [x] Image uploads
- [x] Rating system
- [x] Group management
- [ ] Real-time notifications (Socket.io)
- [ ] Email notifications

### **Phase 3: Advanced Features** 📅 (Planned)
- [ ] Payment integration
- [ ] Calendar sync
- [ ] Mobile app (React Native)
- [ ] Social media sharing
- [ ] Advanced search & filters
- [ ] Activity recommendations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Team

- **Developer**: Nuntawat ([@nuntawatt](https://github.com/nuntawatt))
- **Project**: WeGo - Social Activity Platform
- **Repository**: [WeGoSystem-Full-Stack](https://github.com/nuntawatt/WeGoSystem-Full-Stack)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **GitHub Issues**: [Report a bug or request a feature](https://github.com/nuntawatt/WeGoSystem-Full-Stack/issues)
- **Email**: support@wego.com (coming soon)

---

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this platform
- Inspired by social activity platforms like Meetup and Eventbrite
- Built with ❤️ using modern web technologies

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Nuntawat](https://github.com/nuntawatt)

</div>
