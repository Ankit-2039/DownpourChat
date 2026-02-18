# DownpourChat — MERN Real-Time Encrypted Chat

A full-stack real-time chat application with **AES-256 end-to-end encryption**, anonymous authentication, and transient encrypted messaging.

🔗 **Live Demo:** https://downpourchat.netlify.app

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router v6     |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB Atlas, Mongoose             |
| Real-time  | Socket.IO v4                        |
| Encryption | Web Crypto API (AES-256-CBC, PBKDF2)|
| Sessions   | express-session + connect-mongo     |
| Hosting    | Netlify (client), Render (server)   |

---

## Features

- 🔒 **AES-256 E2E Encryption** — server never sees plaintext
- 👤 **Anonymous authentication** — no login, no registration
- ⚡ **Real-time messaging** via Socket.IO WebSockets
- ✍️ **Typing indicators** with multi-user support
- 📜 **Chat transcripts** — persistent encrypted history
- 💾 **Export chat** — download decrypted transcript as JSON on leave
- ⏳ **Transient rooms** — auto-expire after 24 hours

---

## Project Structure

```
root/
├── start.bat              # Windows: double-click to launch everything
├── netlify.toml           # Netlify SPA routing config
├── package.json           # Root: concurrently runs server + client
├── server/
│   ├── config/db.js
│   ├── models/            # Room.js, Message.js
│   ├── routes/            # roomRoutes.js, transcriptRoutes.js
│   ├── socket/            # socketHandler.js
│   ├── middleware/        # sessionMiddleware.js
│   ├── app.js
│   ├── server.js
│   └── .env.example
└── client/
    ├── src/
    │   ├── crypto/        # cryptoUtils.js (PBKDF2 + AES-256)
    │   ├── socket/        # socketClient.js
    │   ├── context/       # ChatContext.jsx
    │   ├── hooks/         # useSocket.js, useEncryption.js
    │   ├── components/    # JoinRoom, ChatWindow, MessageList, MessageInput, TypingIndicator
    │   ├── pages/         # Home.jsx, Chat.jsx
    │   ├── App.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── .env.example
```

---

## Prerequisites

- Node.js >= 18
- MongoDB running locally, or a MongoDB Atlas URI

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/Ankit-2039/DownpourChat.git
cd DownpourChat
```

### 2. Configure environment variables

**Server** — `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/encrypted-chat
SESSION_SECRET=replace_with_a_strong_random_string
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Client** — `client/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
```

### 3. Start the app

**Windows — double-click `start.bat`**

Or from terminal:
```bash
npm install     # installs concurrently at root
npm run dev     # starts both server + client
```

| Service | URL                   |
|---------|-----------------------|
| Client  | http://localhost:5173 |
| Server  | http://localhost:5000 |

---

## Deployment

| Service  | Platform       | URL                                          |
|----------|----------------|----------------------------------------------|
| Client   | Netlify        | https://downpourchat.netlify.app             |
| Database | MongoDB Atlas  | Managed cloud                                |

---

## How It Works

### End-to-End Encryption

```
User A                         Server                        User B
  |                               |                              |
  |  passphrase + roomId          |                              |
  |──► PBKDF2 ──► AES-256 Key     |         passphrase + roomId  |
  |   (in memory only)            |    AES-256 Key ◄── PBKDF2 ◄──|
  |                               |         (in memory only)     |
  | encrypt(plaintext) ──────────► store ciphertext ────────────►|
  |                               |   (server sees NO plaintext) |
  |                               |                   decrypt()  |
  |                               |               plaintext ✓    |
```

1. **Key Derivation** — Client derives AES-256 key via `PBKDF2(passphrase, roomId, 100000 iterations, SHA-256)`. Key never leaves the browser.
2. **Encrypt before send** — Messages are encrypted client-side before emitting via Socket.IO. Server only receives `{ ciphertext, iv }`.
3. **Server is blind** — Server stores and relays only ciphertext. No plaintext field exists in the database.
4. **Decrypt on receive** — Incoming ciphertext is decrypted immediately using the in-memory key. Wrong passphrase renders `[decryption failed]`.
5. **Transcript** — Chat history is fetched from the REST API and decrypted client-side on mount.

### Anonymous Authentication

- On first request, `attachAnonId` middleware assigns a `uuid v4` as `req.session.anonId`
- Stored in MongoDB via `connect-mongo`, shared with Socket.IO
- No login, no registration, no PII stored

### Room Lifecycle

- Rooms use UUID v4 identifiers with a **24-hour TTL** — auto-expire in MongoDB
- Joining validates room existence before key derivation proceeds

### Transcript Export

- On leave, users are prompted to download chat as JSON
- File is decrypted client-side before export — server never involved
- System messages excluded from export

---

## API Reference

### REST

| Method | Endpoint                   | Description                         |
|--------|----------------------------|-------------------------------------|
| POST   | `/api/rooms/create`        | Create a new room, returns `roomId` |
| POST   | `/api/rooms/join`          | Validate room exists                |
| GET    | `/api/transcript/:roomId`  | Fetch last 100 ciphertexts          |
| GET    | `/health`                  | Health check                        |

### Socket.IO Events

**Client → Server**

| Event          | Payload              | Description            |
|----------------|----------------------|------------------------|
| `message:send` | `{ ciphertext, iv }` | Send encrypted message |
| `typing:start` | —                    | User started typing    |
| `typing:stop`  | —                    | User stopped typing    |

**Server → Client**

| Event             | Payload                                        | Description              |
|-------------------|------------------------------------------------|--------------------------|
| `message:receive` | `{ _id, username, ciphertext, iv, createdAt }` | Broadcast encrypted msg  |
| `typing:update`   | `{ typingUsers: string[] }`                    | Current typers in room   |
| `user:joined`     | `{ username }`                                 | User joined notification |
| `user:left`       | `{ username }`                                 | User left notification   |

---

## Security Notes

- **Passphrase strength** directly determines encryption strength
- **Page refresh** clears the in-memory `CryptoKey` — users must re-enter passphrase (intentional)
- **Usernames** stored as plaintext metadata only — not message content
- **Sessions** use `httpOnly` cookies with `secure` flag in production
- **Room IDs** are UUID v4 — share only via trusted channels

---

## Environment Variables

### Server

| Variable         | Required | Description                           |
|------------------|----------|---------------------------------------|
| `PORT`           | No       | Server port (default: 5000)           |
| `MONGO_URI`      | Yes      | MongoDB connection string             |
| `SESSION_SECRET` | Yes      | Secret for signing session cookies    |
| `CLIENT_ORIGIN`  | No       | CORS origin (default: localhost:5173) |
| `NODE_ENV`       | No       | `development` or `production`         |

### Client

| Variable          | Required | Description                           |
|-------------------|----------|---------------------------------------|
| `VITE_SERVER_URL` | No       | Backend URL (default: localhost:5000) |

---

## Dependencies

### Root
| Package      | Purpose                      |
|--------------|------------------------------|
| concurrently | Run server + client together |

### Server
| Package         | Purpose                      |
|-----------------|------------------------------|
| express         | HTTP server & routing        |
| mongoose        | MongoDB ODM                  |
| socket.io       | WebSocket server             |
| express-session | Session management           |
| connect-mongo   | MongoDB session store        |
| cors            | Cross-origin requests        |
| uuid            | Room ID + anonId generation  |
| dotenv          | Environment variable loading |

### Client
| Package          | Purpose                       |
|------------------|-------------------------------|
| react            | UI framework                  |
| react-router-dom | Client-side routing           |
| socket.io-client | WebSocket client              |
| uuid             | Client-side anonId generation |

> No external crypto library — encryption uses the native **Web Crypto API** built into all modern browsers.
