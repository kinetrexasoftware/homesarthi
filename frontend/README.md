 📁 Complete StayHome File Structure

## 🌳 Full Project Tree

```
stayhome-project/
│
├── backend/
│   ├── config/
│   │   ├── db.js                      # MongoDB connection configuration
│   │   ├── cloudinary.js              # Cloudinary setup & helper functions
│   │   └── socket.js                  # Socket.IO configuration (optional)
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT authentication middleware
│   │   ├── roleCheck.js               # RBAC middleware (optional)
│   │   ├── upload.js                  # Multer file upload configuration
│   │   ├── rateLimiter.js             # API rate limiting
│   │   └── errorHandler.js            # Global error handling
│   │
│   ├── models/
│   │   ├── User.js                    # User schema (Student/Owner/Admin)
│   │   ├── Room.js                    # Room listing schema
│   │   ├── Message.js                 # Chat message schema
│   │   ├── Review.js                  # Room review schema
│   │   ├── Visit.js                   # Visit request schema
│   │   ├── Report.js                  # User report schema
│   │   └── Analytics.js               # Analytics tracking schema
│   │
│   ├── controllers/
│   │   ├── authController.js          # Auth logic (register, login, profile)
│   │   ├── roomController.js          # Room CRUD operations
│   │   ├── adminController.js         # Admin approval & moderation
│   │   ├── chatController.js          # Chat/messaging logic
│   │   └── analyticsController.js     # Analytics & stats
│   │
│   ├── routes/
│   │   ├── auth.js                    # Auth routes (/api/auth/*)
│   │   ├── rooms.js                   # Room routes (/api/rooms/*)
│   │   ├── admin.js                   # Admin routes (/api/admin/*)
│   │   ├── chat.js                    # Chat routes (/api/chat/*)
│   │   ├── visits.js                  # Visit routes (/api/visits/*)
│   │   ├── reviews.js                 # Review routes (/api/reviews/*)
│   │   └── analytics.js               # Analytics routes (/api/analytics/*)
│   │
│   ├── utils/
│   │   ├── validators.js              # Input validation functions
│   │   ├── aiRecommendation.js        # AI recommendation logic
│   │   ├── fraudDetection.js          # Fraud detection helpers
│   │   └── seedAdmin.js               # Admin user seeding script
│   │
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Environment template
│   ├── .gitignore                     # Git ignore file
│   ├── server.js                      # Express server entry point
│   ├── package.json                   # Dependencies & scripts
│   └── README.md                      # Backend documentation
│
└── frontend/
    ├── public/
    │   ├── vite.svg                   # Default Vite logo
    │   └── favicon.ico                # App favicon
    │
    ├── src/
    │   ├── assets/
    │   │   ├── logo.svg               # App logo
    │   │   └── images/                # Static images folder
    │   │
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Navbar.jsx         # Navigation bar component
    │   │   │   ├── Footer.jsx         # Footer component
    │   │   │   ├── ProtectedRoute.jsx # Route protection wrapper
    │   │   │   ├── Loader.jsx         # Loading spinner
    │   │   │   ├── EmptyState.jsx     # Empty state component
    │   │   │   └── Modal.jsx          # Reusable modal
    │   │   │
    │   │   ├── auth/
    │   │   │   ├── LoginForm.jsx      # Login form component
    │   │   │   └── RegisterForm.jsx   # Registration form component
    │   │   │
    │   │   ├── rooms/
    │   │   │   ├── RoomCard.jsx       # Room listing card
    │   │   │   ├── RoomFilters.jsx    # Search filters component
    │   │   │   ├── RoomForm.jsx       # Room creation/edit form
    │   │   │   ├── ImageUploader.jsx  # Image upload component
    │   │   │   └── MapView.jsx        # Map display component
    │   │   │
    │   │   ├── chat/
    │   │   │   ├── ChatList.jsx       # Conversations list
    │   │   │   ├── ChatWindow.jsx     # Chat window container
    │   │   │   ├── MessageBubble.jsx  # Individual message
    │   │   │   └── ChatInput.jsx      # Message input field
    │   │   │
    │   │   ├── dashboard/
    │   │   │   ├── StatsCard.jsx      # Statistics card
    │   │   │   ├── AnalyticsChart.jsx # Chart component
    │   │   │   └── RecentActivity.jsx # Activity feed
    │   │   │
    │   │   └── admin/
    │   │       ├── PendingRooms.jsx   # Pending room approvals
    │   │       ├── PendingOwners.jsx  # Owner verification queue
    │   │       ├── ReportsList.jsx    # Reports management
    │   │       └── UserManagement.jsx # User list & moderation
    │   │
    │   ├── pages/
    │   │   ├── HomePage.jsx           # Landing page
    │   │   ├── LoginPage.jsx          # Login page
    │   │   ├── RegisterPage.jsx       # Registration page
    │   │   ├── RoomsPage.jsx          # Room listings with filters
    │   │   ├── RoomDetailPage.jsx     # Single room detail view
    │   │   ├── ProfilePage.jsx        # User profile page
    │   │   ├── ChatPage.jsx           # Chat/messaging page
    │   │   ├── StudentDashboard.jsx   # Student dashboard
    │   │   ├── OwnerDashboard.jsx     # Owner dashboard
    │   │   ├── AdminDashboard.jsx     # Admin panel
    │   │   ├── CreateRoomPage.jsx     # Create room listing
    │   │   ├── EditRoomPage.jsx       # Edit room listing
    │   │   ├── MyRoomsPage.jsx        # Owner's room management
    │   │   ├── VisitsPage.jsx         # Visit requests page
    │   │   └── NotFoundPage.jsx       # 404 error page
    │   │
    │   ├── store/
    │   │   ├── useAuthStore.js        # Auth state (Zustand)
    │   │   ├── useRoomStore.js        # Room state (Zustand)
    │   │   └── useChatStore.js        # Chat state (Zustand)
    │   │
    │   ├── utils/
    │   │   ├── api.js                 # Axios instance & interceptors
    │   │   ├── socket.js              # Socket.IO client setup
    │   │   ├── helpers.js             # Helper functions
    │   │   └── constants.js           # App constants
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.js             # Auth custom hook
    │   │   ├── useRooms.js            # Rooms custom hook
    │   │   └── useChat.js             # Chat custom hook
    │   │
    │   ├── App.jsx                    # Main app component
    │   ├── main.jsx                   # React entry point
    │   └── index.css                  # Global styles (Tailwind)
    │
    ├── .env                           # Environment variables
    ├── .env.example                   # Environment template
    ├── .env.production                # Production env variables
    ├── .gitignore                     # Git ignore file
    ├── index.html                     # HTML template
    ├── package.json                   # Dependencies & scripts
    ├── postcss.config.js              # PostCSS configuration
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── vite.config.js                 # Vite configuration
    └── README.md                      # Frontend documentation
```

---

## 📝 File-by-File Checklist

### ✅ Backend Files (19 files)

#### Config (3 files)
- [ ] `config/db.js`
- [ ] `config/cloudinary.js`
- [ ] `config/socket.js` (optional)

#### Middleware (5 files)
- [ ] `middleware/auth.js`
- [ ] `middleware/roleCheck.js` (optional)
- [ ] `middleware/upload.js`
- [ ] `middleware/rateLimiter.js`
- [ ] `middleware/errorHandler.js`

#### Models (7 files)
- [ ] `models/User.js`
- [ ] `models/Room.js`
- [ ] `models/Message.js`
- [ ] `models/Review.js`
- [ ] `models/Visit.js`
- [ ] `models/Report.js`
- [ ] `models/Analytics.js`

#### Controllers (5 files)
- [ ] `controllers/authController.js`
- [ ] `controllers/roomController.js`
- [ ] `controllers/adminController.js`
- [ ] `controllers/chatController.js`
- [ ] `controllers/analyticsController.js`

#### Routes (7 files)
- [ ] `routes/auth.js`
- [ ] `routes/rooms.js`
- [ ] `routes/admin.js`
- [ ] `routes/chat.js`
- [ ] `routes/visits.js`
- [ ] `routes/reviews.js`
- [ ] `routes/analytics.js`

#### Utils (4 files)
- [ ] `utils/validators.js` (optional)
- [ ] `utils/aiRecommendation.js` (optional)
- [ ] `utils/fraudDetection.js` (optional)
- [ ] `utils/seedAdmin.js`

#### Root Files (4 files)
- [ ] `.env`
- [ ] `.gitignore`
- [ ] `server.js`
- [ ] `package.json`

---

### ✅ Frontend Files (41+ files)

#### Components - Common (6 files)
- [ ] `components/common/Navbar.jsx`
- [ ] `components/common/Footer.jsx`
- [ ] `components/common/ProtectedRoute.jsx`
- [ ] `components/common/Loader.jsx`
- [ ] `components/common/EmptyState.jsx`
- [ ] `components/common/Modal.jsx`

#### Components - Auth (2 files)
- [ ] `components/auth/LoginForm.jsx` (optional)
- [ ] `components/auth/RegisterForm.jsx` (optional)

#### Components - Rooms (5 files)
- [ ] `components/rooms/RoomCard.jsx`
- [ ] `components/rooms/RoomFilters.jsx`
- [ ] `components/rooms/RoomForm.jsx` (optional)
- [ ] `components/rooms/ImageUploader.jsx`
- [ ] `components/rooms/MapView.jsx` (optional)

#### Components - Chat (4 files)
- [ ] `components/chat/ChatList.jsx`
- [ ] `components/chat/ChatWindow.jsx`
- [ ] `components/chat/MessageBubble.jsx`
- [ ] `components/chat/ChatInput.jsx` (optional)

#### Components - Dashboard (3 files)
- [ ] `components/dashboard/StatsCard.jsx` (optional)
- [ ] `components/dashboard/AnalyticsChart.jsx` (optional)
- [ ] `components/dashboard/RecentActivity.jsx` (optional)

#### Components - Admin (4 files)
- [ ] `components/admin/PendingRooms.jsx` (optional)
- [ ] `components/admin/PendingOwners.jsx` (optional)
- [ ] `components/admin/ReportsList.jsx` (optional)
- [ ] `components/admin/UserManagement.jsx` (optional)

#### Pages (14 files)
- [ ] `pages/HomePage.jsx`
- [ ] `pages/LoginPage.jsx`
- [ ] `pages/RegisterPage.jsx`
- [ ] `pages/RoomsPage.jsx`
- [ ] `pages/RoomDetailPage.jsx`
- [ ] `pages/ProfilePage.jsx`
- [ ] `pages/ChatPage.jsx`
- [ ] `pages/StudentDashboard.jsx`
- [ ] `pages/OwnerDashboard.jsx`
- [ ] `pages/AdminDashboard.jsx`
- [ ] `pages/CreateRoomPage.jsx`
- [ ] `pages/EditRoomPage.jsx` (optional)
- [ ] `pages/MyRoomsPage.jsx`
- [ ] `pages/VisitsPage.jsx`
- [ ] `pages/NotFoundPage.jsx` (optional)

#### Store (3 files)
- [ ] `store/useAuthStore.js`
- [ ] `store/useRoomStore.js`
- [ ] `store/useChatStore.js`

#### Utils (4 files)
- [ ] `utils/api.js`
- [ ] `utils/socket.js`
- [ ] `utils/helpers.js`
- [ ] `utils/constants.js`

#### Hooks (3 files - optional)
- [ ] `hooks/useAuth.js`
- [ ] `hooks/useRooms.js`
- [ ] `hooks/useChat.js`

#### Root Files (9 files)
- [ ] `App.jsx`
- [ ] `main.jsx`
- [ ] `index.css`
- [ ] `.env`
- [ ] `.gitignore`
- [ ] `index.html`
- [ ] `package.json`
- [ ] `postcss.config.js`
- [ ] `tailwind.config.js`
- [ ] `vite.config.js`

---

## 🚀 Quick Setup Commands

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create all directories
mkdir -p config middleware models controllers routes utils

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
EOF

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Create directory structure
mkdir -p src/{components/{common,auth,rooms,chat,dashboard,admin},pages,store,utils,hooks,assets}

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
EOF

# Start development server
npm run dev
```

---

## 📦 Package Dependencies Summary

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "dotenv": "^16.3.1",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "cloudinary": "^1.41.0",
  "express-validator": "^7.0.1",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "socket.io": "^4.6.0",
  "nodemailer": "^6.9.7"
}
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "axios": "^1.6.2",
  "zustand": "^4.4.7",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.298.0",
  "socket.io-client": "^4.6.0",
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4",
  "date-fns": "^3.0.6",
  "framer-motion": "^10.16.16",
  "recharts": "^2.10.3",
  "tailwindcss": "^3.4.0"
}
```

---

## 🔍 File Locations Reference

### Need to find a specific file?

**Authentication Logic** → `backend/controllers/authController.js`  
**Room CRUD** → `backend/controllers/roomController.js`  
**Database Models** → `backend/models/`  
**API Routes** → `backend/routes/`  
**React Pages** → `frontend/src/pages/`  
**Reusable Components** → `frontend/src/components/common/`  
**State Management** → `frontend/src/store/`  
**API Configuration** → `frontend/src/utils/api.js`  
**Styles** → `frontend/src/index.css`  
**Environment Variables** → `.env` (both backend & frontend)

---

## ✨ Next Steps

1. ✅ Copy all files from artifacts to respective folders
2. ✅ Install dependencies in both backend and frontend
3. ✅ Configure `.env` files with your credentials
4. ✅ Start backend server: `npm run dev`
5. ✅ Start frontend server: `npm run dev`
6. ✅ Create admin user using seed script
7. ✅ Test the application
8. ✅ Deploy using deployment guide

---

## 🎯 Total File Count

- **Backend**: ~30 files
- **Frontend**: ~50 files
- **Documentation**: 4 files
- **Total**: ~84 files

All code is production-ready, fully co#   H o m e S a r t h i - F r o n t e n d -  
 