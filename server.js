import userRoute from "./routes/userRoute.js";
import authRoutes from './routes/authRoutes.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server } from 'socket.io';
import { oauth2Auth } from './middleware/oauth2Auth.js';
import { UserModel } from "./models/userModel.js";
import { v4 as uuidv4 } from "uuid";

// import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express'

const app = express();
const server = http.createServer(app); // ⬅️ create http server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.1.4:3000', 'https://hushar-spreadsheet.vercel.app', 'https://vortexly.space'],
    methods: ['GET', 'POST']
  }
});

const userCollection = UserModel.getCollection();

app.use(express.json());
// app.use(firebaseAuth());
app.use(cors({
  origin: ['http://localhost:2008', 'http://192.168.1.4:2008', 'http://localhost:3000'],
  // credentials: true // ✅ MUST set this to allow HttpOnly cookies
}));

// connect to DB
connectDB();

// attach io globally (optional)
app.set('io', io);

app.use("/user", userRoute);
app.use('/auth', authRoutes);

// test route
app.get('/', (req, res) => {
  res.json({ message: 'API version 1.0.1!' });
});

/* ===========================================
   TASK API ROUTE
=========================================== */
app.post('/task', async (req, res) => {
  try {
    const { accessKey } = req.body;

    if (!accessKey) {
      return res.status(400).json({ error: "accessKey missing" });
    }

    // get user
    const user = await userCollection.findOne({ accessKey });

    if (!user || !user.socketId) {
      return res.status(404).json({ error: "User not connected via socket" });
    }

    const socketId = user.socketId;

    // create a task
    const taskId = uuidv4();

    const task = {
      taskId,
      metadata: {
        headers: req.headers,
        route: req.originalUrl,
        body: req.body,
        method: req.method,
        query: req.query,
        params: req.params,
      }
    };

    // send task to socket client
    io.to(socketId).emit("task", task);

    console.log(`📤 Task sent to ${socketId}:`, taskId);

    // wait for client response
    const TIMEOUT = 60_000; // 1 minute

    const response = await new Promise((resolve, reject) => {
      // listen for response
      const handler = (data) => {
        if (data.taskId === taskId) {
          resolve(data);
          clearTimeout(timeout);
          socket.off("task-response", handler);
        }
      };

      const socket = io.sockets.sockets.get(socketId);
      if (!socket) return reject("Socket not found");

      socket.on("task-response", handler);

      const timeout = setTimeout(() => {
        socket.off("task-response", handler);
        reject("Client did not respond within 1 minute");
      }, TIMEOUT);
    });

    // send the result to the API caller
    return res.json({
      success: true,
      taskId,
      response
    });

  } catch (err) {
    console.error("❌ Task error:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

// socket logic
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  // Join "room" (1 db-host, many clients or 1-to-1 pair)
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit("peer-joined", socket.id);
  });

  // Relay ICE candidates
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", {
      from: socket.id,
      candidate
    });
  });

  // Relay SDP offer
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", {
      from: socket.id,
      offer
    });
  });

  // Relay SDP answer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", {
      from: socket.id,
      answer
    });
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    socket.broadcast.emit("peer-left", socket.id);
    // Remove user from activeUsers
    const user = await userCollection.findOne({ socketId: socket.id });
    if (user) {
      userCollection.updateOne(
        { userID: user.userID },
        { $set: { socketId: null, status: 'offline' } }
      );
    }
    console.log('🔴 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
export { io };  // Add this line to export io