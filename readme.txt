# Retro In-Class Chat App (v1.0)

A distraction-free, real-time chat application for classrooms, styled like a 1980s CRT terminal.

## 📺 Project Overview

This app allows instructors to create temporary, unique chat "threads" for a class session. Students log in using the thread ID to ask questions, share notes, or discuss topics in real-time. The interface is designed to reduce modern UI distractions by mimicking a vintage command-line environment.

**Key Features:**
* **Instant Setup:** Instructors generate a 4-digit code to start a session.
* **Real-Time Messaging:** Powered by Socket.io for zero-latency communication.
* **Data Persistence:** Chat logs are automatically saved to `server/database.json` when the session is terminated.
* **Retro Aesthetics:** CSS-based CRT scanlines, phosphor glow, and terminal fonts.

---

## 📂 File Structure

The project is set up as a **monorepo** (client and server in one place) for easy deployment.

```text
/retro-chat-app
├── package.json           # Root configuration for deployment (Render/Heroku)
├── /client                # React Frontend
│   ├── /public            # Static assets (index.html)
│   └── /src               # Source code
│       ├── App.js         # Main UI logic & Socket.io client
│       ├── App.css        # CRT styling and animations
│       └── index.js       # React entry point
└── /server                # Node.js Backend
    ├── server.js          # Express server & Socket.io logic
    └── database.json      # JSON file where chats are saved
