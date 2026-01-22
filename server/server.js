const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '../client/build')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins since we serve from same domain
    methods: ["GET", "POST"]
  }
});

// Database Logic
let threads = {};
// Note: On Render free tier, this file wipes on restart. 
// Use MongoDB for permanent storage.
const DB_FILE = path.join(__dirname, 'database.json');

const saveThreadToDB = (threadId, data) => {
  let db = {};
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { db = {}; }
  
  db[threadId] = { ...data, closedAt: new Date().toISOString() };
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  socket.on('create_thread', () => {
    const threadId = Math.floor(1000 + Math.random() * 9000).toString();
    threads[threadId] = { active: true, messages: [], students: [] };
    socket.join(threadId);
    socket.emit('thread_created', threadId);
  });

  socket.on('join_thread', ({ threadId, name, email }) => {
    const thread = threads[threadId];
    if (thread && thread.active) {
      socket.join(threadId);
      thread.students.push({ name, email, socketId: socket.id });
      socket.emit('joined_success', thread.messages);
      io.to(threadId).emit('system_message', `> ${name} has jacked in.`);
    } else {
      socket.emit('error', 'Thread not found or closed.');
    }
  });

  socket.on('send_note', ({ threadId, name, text }) => {
    if (threads[threadId] && threads[threadId].active) {
      const note = {
        id: Date.now(),
        name,
        text,
        timestamp: new Date().toLocaleTimeString()
      };
      threads[threadId].messages.push(note);
      io.to(threadId).emit('receive_note', note);
    }
  });

  socket.on('close_thread', (threadId) => {
    if (threads[threadId]) {
      threads[threadId].active = false;
      io.to(threadId).emit('thread_closed');
      saveThreadToDB(threadId, threads[threadId]);
      delete threads[threadId];
    }
  });
});

// The "Catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});