import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env at the very beginning
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGO_URI) {
  dotenv.config();
}

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/connectDB.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import roomRoutes from "./routes/rooms.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import visitRoutes from "./routes/visits.js";
import reviewRoutes from "./routes/reviews.js";
import analyticsRoutes from "./routes/analytics.js";
import locationRoutes from "./routes/locations.js";
import uploadRoutes from "./routes/upload.js";
import homeRoutes from "./routes/home.js";
import collegeRoutes from "./routes/colleges.js";
import supportRoutes from "./routes/support.js";
import notificationRoutes from "./routes/notifications.js";

// Final check for essential environment variables
if (!process.env.MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI is not defined in .env file!');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET is not defined in .env file!');
  process.exit(1);
}

const app = express();

// Trust proxy if behind Nginx/Cloudflare
app.set('trust proxy', 1);

const httpServer = createServer(app);


/* =========================
   CORS – SINGLE SOURCE OF TRUTH
   ========================= */
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173")
  .replace(/\/$/, ""); // remove trailing slash safely

/* =========================
   SOCKET.IO
   ========================= */
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  connectTimeout: 45000,
  transports: ['polling', 'websocket']
});

global.io = io;

/* =========================
   MIDDLEWARE
   ========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 Fix preflight requests
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   RATE LIMIT (PROD ONLY)
   ========================= */
if (process.env.NODE_ENV === "production") {
  app.use("/api", apiLimiter);
}

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   ROUTES
   ========================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", homeRoutes);

// SERVE STATIC ASSETS (for Mobile/Web shared images)
// SERVE STATIC ASSETS 
// 1. Backend uploads
app.use('/public/uploads', express.static(path.resolve(__dirname, './public/uploads')));
// 2. Main public folder (backend)
app.use('/public', express.static(path.resolve(__dirname, './public')));
// 3. Frontend public fallback (if needed for some old paths)
app.use('/frontend-public', express.static(path.resolve(__dirname, '../frontend/public')));

/* =========================
   SOCKET LOGIC
   ========================= */
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_online", (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId);
  });

  socket.on("send_message", (data) => {
    const recipientSocketId = connectedUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receive_message", data);
    }
  });

  socket.on("typing", (data) => {
    const recipientSocketId = connectedUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("user_typing", data);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

/* =========================
   ERROR HANDLING
   ========================= */
app.use(notFound);
app.use(errorHandler);

/* =========================
   SERVER START
   ========================= */
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`
╔═══════════════════════════════════════╗
║   🏠 HomeSarthi API Server Running      ║
║   Mode: ${process.env.NODE_ENV || "development"}
║   Port: ${PORT}
║   URL: http://localhost:${PORT}
╚═══════════════════════════════════════╝
`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

/* =========================
   SAFETY
   ========================= */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  httpServer.close(() => process.exit(1));
});

export default app;
