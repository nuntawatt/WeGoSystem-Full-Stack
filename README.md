# WeGo - Social Activity Platform

WeGo is a full-stack social activity platform for discovering and organizing activities with real-time chat, profiles, reviews, reporting, and an admin dashboard.

## Repository Structure

- apps/backend - Express API + MongoDB + Socket.io
- apps/frontend - React (Vite) + TypeScript + Tailwind

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), Socket.io, JWT, Multer
- Frontend: React, TypeScript, Vite, TailwindCSS, Axios, SweetAlert2, TanStack Query

## Quick Start (Local)

### Prerequisites

- Node.js 20+ (recommended)
- MongoDB (Atlas or local)

### Backend

```bash
cd apps/backend
npm install
npm run dev
```

Backend default port is 10000 (see apps/backend/src/index.js).

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend dev server: http://localhost:5173

## Environment Variables

### Backend (apps/backend/.env)

Required:

- MONGODB_URI
- JWT_SECRET
- FRONTEND_URL=http://localhost:5173

Optional (email/OTP/reset):

- RESEND_API_KEY (preferred)
- or EMAIL_USER + EMAIL_PASSWORD (or EMAIL_PASS)
- EMAIL_FROM (optional)

Optional (Google sign-in validation):

- GOOGLE_CLIENT_ID

Optional (debug):

- SHOW_ERROR_DETAILS=true

### Frontend (apps/frontend/.env)

- VITE_API_URL=http://localhost:10000
- VITE_GOOGLE_CLIENT_ID=...
- VITE_GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback (optional)

Note: Do not put secrets in the frontend env. Keep secrets in backend env or secret manager.

## API Routes (Backend)

Base path: /api (see apps/backend/src/index.js)

Auth header (for protected routes):

- Authorization: Bearer <token>

### Auth (/api/auth)

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | /api/auth/register | No | Register user (auto-creates profile) |
| POST | /api/auth/login | No | Login with email/username + password |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/logout | Yes | Logout (optional) |
| POST | /api/auth/forgot-password | No | Request OTP reset |
| POST | /api/auth/forgot-password-link | No | Request reset link |
| POST | /api/auth/reset-password | No | Reset password using OTP |
| POST | /api/auth/verify-reset-token | No | Verify reset token |
| POST | /api/auth/reset-password-confirm | No | Reset password using token |
| POST | /api/auth/google-login | No | Login using Google ID token |
| GET | /api/auth/_email_test | No | Diagnostic (SMTP) |

### Profiles (/api/profiles)

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/profiles | No | List profiles (supports q + paging) |
| GET | /api/profiles/:userId | No | Get profile by user id (returns default if missing) |
| POST | /api/profiles | Yes | Create/update my profile |
| POST | /api/profiles/avatar | Yes | Upload avatar (Cloudinary) |
| DELETE | /api/profiles/avatar | Yes | Delete avatar |
| DELETE | /api/profiles | Yes | Delete my profile |

### Activities (/api/activities)

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/activities | No | List activities (filters + pagination) |
| GET | /api/activities/nearby | No | Nearby search (lat,lng,radius) |
| GET | /api/activities/by-chat/:chatId | No | Resolve activity by chat id |
| GET | /api/activities/:id | No* | Get activity (private may require auth) |
| GET | /api/activities/:id/has-reported | Yes | Check if user already reported |
| POST | /api/activities | Yes | Create activity |
| PUT | /api/activities/:id | Yes | Update activity |
| DELETE | /api/activities/:id | Yes | Delete activity |
| POST | /api/activities/:id/images | Yes | Upload images |
| POST | /api/activities/:id/join | Yes | Join |
| POST | /api/activities/:id/leave | Yes | Leave |
| POST | /api/activities/:id/rate | Yes | Rate |
| POST | /api/activities/:id/cancel | Yes | Cancel |
| POST | /api/activities/:id/complete | Yes | Mark complete |
| GET | /api/activities/user/me | Yes | Get my activities |
| POST | /api/activities/:id/report | Yes | Report activity |
| GET | /api/activities/:id/reviews | No | List reviews |
| POST | /api/activities/:id/reviews | Yes | Create review |

### Events (/api/events)

Events are implemented as an alias around the Activity model.

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/events | No | List events |
| GET | /api/events/:id | No | Get event |
| POST | /api/events | Yes | Create event (creates chat) |
| PUT | /api/events/:id | Yes | Update event (owner) |
| DELETE | /api/events/:id | Yes | Delete event (owner) |
| POST | /api/events/:id/join | Yes | Join event + add to chat |
| POST | /api/events/:id/leave | Yes | Leave event + remove from chat |
| GET | /api/events/search/filter | No | Filter/search |
| POST | /api/events/upload-cover | Yes | Upload cover (Cloudinary) |

### Chats (/api/chats)

All chat routes require auth (router-level auth middleware).

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | /api/chats/direct | Yes | Create/get direct chat |
| POST | /api/chats/group | Yes | Create group chat |
| GET | /api/chats | Yes | List my chats |
| GET | /api/chats/:id | Yes | Get chat + messages |
| POST | /api/chats/:id/messages | Yes | Send message |
| PUT | /api/chats/:id/read | Yes | Mark as read |
| POST | /api/chats/:id/participants | Yes | Add participant |
| DELETE | /api/chats/:id/participants/:userId | Yes | Remove participant |
| PUT | /api/chats/:id/participants/:userId/role | Yes | Update participant role |
| PUT | /api/chats/:id/mute | Yes | Mute chat |
| DELETE | /api/chats/:id | Yes | Delete/leave chat |

### Direct Messages (/api/directmessages)

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/directmessages/conversation/:userId | Yes | Get DM conversation |
| POST | /api/directmessages/send | Yes | Send DM |
| PUT | /api/directmessages/read/:senderId | Yes | Mark read |
| GET | /api/directmessages/unread/count | Yes | Unread count |
| GET | /api/directmessages/recent | Yes | Recent conversations |
| DELETE | /api/directmessages/:messageId | Yes | Delete message |

### Uploads (/api/uploads)

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | /api/uploads | Yes | Upload a file (Cloudinary; form field: file) |

### Groups (/api/groups)

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/groups/event/:eventId | No | List groups for event |
| GET | /api/groups/:id | No | Get group |
| POST | /api/groups | Yes | Create group |
| POST | /api/groups/:id/join | Yes | Join group |
| POST | /api/groups/:id/leave | Yes | Leave group |
| PUT | /api/groups/:id | Yes | Update group |
| DELETE | /api/groups/:id | Yes | Delete group |
| GET | /api/groups/:id/reviews | No | List reviews |
| POST | /api/groups/:id/reviews | Yes | Create/update review |
| POST | /api/groups/:id/report | Yes | Report group |
| POST | /api/groups/__dev/create-from-activity/:activityId | No | Dev helper |

### Reports (/api/reports)

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/reports | Admin | List reports |
| GET | /api/reports/:id | Admin | Get report |
| PATCH | /api/reports/:id | Admin | Update status/notes |
| DELETE | /api/reports/:id | Admin | Delete report |

### Admin (/api/admin)

All admin routes require auth + role admin.

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | /api/admin/users/stats | Admin | Users stats |
| GET | /api/admin/users | Admin | List users |
| PUT | /api/admin/users/:id/block | Admin | Block/unblock user |
| PUT | /api/admin/users/:id/role | Admin | Update role |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| GET | /api/admin/activities/stats | Admin | Activities stats |
| GET | /api/admin/activities | Admin | List activities |
| DELETE | /api/admin/activities/:id | Admin | Delete activity |
| GET | /api/admin/groups/stats | Admin | Groups stats |
| GET | /api/admin/groups | Admin | List groups |
| DELETE | /api/admin/groups/:id | Admin | Delete group |
| GET | /api/admin/events/stats | Admin | Events stats |
| GET | /api/admin/events | Admin | List events |
| DELETE | /api/admin/events/:id | Admin | Delete event |
| GET | /api/admin/chats/stats | Admin | Chats stats |
| GET | /api/admin/chats | Admin | List chats |
| DELETE | /api/admin/chats/:id | Admin | Delete chat |
| GET | /api/admin/dashboard | Admin | Dashboard summary |
| GET | /api/admin/reports | Admin | List reports |
| GET | /api/admin/reports/:id | Admin | Get report |
| PUT | /api/admin/reports/:id | Admin | Update report |
| POST | /api/admin/reports/:id/action | Admin | Moderation action |

## Frontend Routes (SPA)

| Route | Auth | Page |
|---|---:|---|
| / | No | Home |
| /explore | No | Explore |
| /groups/:id | Yes | Group detail |
| /groups/:id/schedule | Yes | Schedule |
| /create | Yes | Create |
| /profile | Yes | Profile |
| /dm/:uid | Yes | Chat |
| /auth/signin | No | Sign in |
| /auth/signup | No | Sign up |
| /auth/forgot-password | No | Forgot password |
| /auth/google/callback | No | Google callback |
| /auth/reset | No | Reset password |
| /admin/* | Yes | Admin dashboard |

---
