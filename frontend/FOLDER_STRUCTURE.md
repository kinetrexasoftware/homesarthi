# Frontend Folder Structure

This document provides a detailed overview of the directory structure and file organization of the **Roomate** frontend application.

## 📂 Detailed Directory Tree

```text
frontend/
├── 📁 public/
│   └── 📄 vite.svg
├── 📁 src/
│   ├── 📁 assets/
│   │   └── 📄 react.svg
│   ├── 📁 components/
│   │   ├── 📁 admin/
│   │   │   ├── 📄 AdminLayout.jsx
│   │   │   ├── � AdminStatCard.jsx
│   │   │   ├── 📄 DashboardCharts.jsx
│   │   │   ├── � PendingOwners.jsx
│   │   │   ├── 📄 PendingRooms.jsx
│   │   │   ├── 📄 ReportsList.jsx
│   │   │   ├── 📄 ReportsManagement.jsx
│   │   │   └── 📄 UserManagement.jsx
│   │   ├── 📁 auth/
│   │   │   ├── 📄 LoginForm.jsx
│   │   │   └── 📄 RegisterForm.jsx
│   │   ├── 📁 chat/
│   │   │   ├── 📄 ChatInput.jsx
│   │   │   ├── 📄 ChatList.jsx
│   │   │   ├── 📄 ChatWindow.jsx
│   │   │   └── 📄 MessageBubble.jsx
│   │   ├── 📁 common/
│   │   │   ├── 📄 EmptyState.jsx
│   │   │   ├── 📄 Footer.jsx
│   │   │   ├── 📄 Loader.jsx
│   │   │   ├── 📄 LocationSearch.jsx
│   │   │   ├── 📄 Modal.jsx
│   │   │   ├── 📄 Navbar.jsx
│   │   │   ├── 📄 ProfileCompletion.jsx
│   │   │   └── 📄 ProtectedRoute.jsx
│   │   ├── 📁 dashboard/
│   │   │   ├── 📄 AnalyticsChart.jsx
│   │   │   ├── 📄 RecentActivity.jsx
│   │   │   └── 📄 StatsCard.jsx
│   │   ├── 📁 owner/
│   │   │   ├── 📄 LocationSettings.jsx
│   │   │   └── 📄 MapPicker.jsx
│   │   ├── 📁 rooms/
│   │   │   ├── 📄 ImageUploader.jsx
│   │   │   ├── 📄 LocationSearch.jsx
│   │   │   ├── 📄 MapLocationPicker.jsx
│   │   │   ├── 📄 MapView.jsx
│   │   │   ├── 📄 RoomCard.jsx
│   │   │   ├── 📄 RoomFilters.jsx
│   │   │   ├── 📄 RoomForm.jsx
│   │   │   ├── � RoomMapView.jsx
│   │   │   └── 📄 RoutePreview.jsx
│   │   └── 📄 ExampleMapComponent.jsx
│   ├── 📁 hooks/
│   │   ├── 📄 useAuth.js
│   │   ├── 📄 useChat.js
│   │   ├── 📄 useGoogleMaps.js
│   │   └── 📄 useRooms.js
│   ├── 📁 pages/
│   │   ├── 📄 AdminAuditPage.jsx
│   │   ├── 📄 AdminDashboard.jsx
│   │   ├── 📄 AdminReportsPage.jsx
│   │   ├── 📄 AdminRoomsPage.jsx
│   │   ├── � AdminUsersPage.jsx
│   │   ├── 📄 ChatPage.jsx
│   │   ├── 📄 CreateRoomPage.jsx
│   │   ├── 📄 EditRoomPage.jsx
│   │   ├── � ForgotPasswordPage.jsx
│   │   ├── 📄 HomePage.jsx
│   │   ├── 📄 LoginPage.jsx
│   │   ├── 📄 MyRoomsPage.jsx
│   │   ├── 📄 NotFoundPage.jsx
│   │   ├── 📄 OnboardingPage.jsx
│   │   ├── 📄 OwnerDashboard.jsx
│   │   ├── 📄 ProfilePage.jsx
│   │   ├── 📄 RegisterPage.jsx
│   │   ├── 📄 ResetPasswordPage.jsx
│   │   ├── 📄 RoomDetailPage.jsx
│   │   ├── 📄 RoomsPage.jsx
│   │   ├── 📄 StudentDashboard.jsx
│   │   └── 📄 VisitsPage.jsx
│   ├── 📁 store/
│   │   ├── 📄 useAuthStore.js
│   │   ├── 📄 useChatStore.js
│   │   └── 📄 useRoomStore.js
│   ├── 📁 utils/
│   │   ├── 📄 api.js
│   │   ├── 📄 constants.js
│   │   ├── 📄 helpers.js
│   │   ├── 📄 imageCompression.js
│   │   ├── 📄 locationData.js
│   │   └── 📄 socket.js
│   ├── 📄 App.jsx
│   ├── 📄 index.css
│   └── 📄 main.jsx
├── 📄 .env
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 FOLDER_STRUCTURE.md
├── 📄 index.html
├── 📄 package.json
├── 📄 postcss.config.js
├── 📄 tailwind.config.js
└── 📄 vite.config.js
```

## 🔑 Key Components & Logic

### 1. State Management (`src/store/`)
Uses **Zustand** for lightweight and scalable state.
- `useAuthStore.js`: Handles user session, login/logout, and profile data.
- `useRoomStore.js`: Manages room listings, filtering, and search results.
- `useChatStore.js`: Handles real-time messaging state.

### 2. Custom Hooks (`src/hooks/`)
Encapsulates complex logic for cleaner components.
- `useAuth.js`: Core authentication logic and redirection.
- `useRooms.js`: Data fetching and filtering logic for room listings.
- `useGoogleMaps.js`: Integration logic for location services.

### 3. Utilities (`src/utils/`)
- `api.js`: Axios instance with request/reponse interceptors for JWT handling.
- `socket.js`: Socket.io client configuration for real-time chat.
- `helpers.js`: Shared utility functions for formatting and validation.

### 4. Common Components (`src/components/common/`)
- `LocationSearch.jsx`: Sophisticated Google Maps Autocomplete integration.
- `Navbar.jsx`: Responsive navigation with role-based links.
- `ProtectedRoute.jsx`: Guards routes based on authentication status.
