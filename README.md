# 🔒 DownpourChat — MERN Real-Time Encrypted Chat

A full-stack real-time chat application with **AES-256 end-to-end encryption**, anonymous authentication, and persistent encrypted transcripts.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router v6     |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB, Mongoose                   |
| Real-time  | Socket.IO v4                        |
| Encryption | Web Crypto API (AES-256-CBC, PBKDF2)|
| Sessions   | express-session + connect-mongo     |

---

## Project Structure

```
root/
├── start.bat              # Windows: double-click to launch everything
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

## Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/Ankit-2039/DownpourChat.git
cd DownpourChat
```

### 2. Configure environment variables

**Server:**
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/encrypted-chat
SESSION_SECRET=replace_with_a_strong_random_string
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Client:**
```bash
cp client/.env.example client/.env
```
Edit `client/.env`:
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

Dependencies are installed automatically on first run via `start.bat`.

| Service | URL                   |
|---------|-----------------------|
| Client  | http://localhost:5173 |
| Server  | http://localhost:5000 |

### 4. Production build

```bash
npm run build   # builds client to client/dist
npm start       # runs server in production mode
```

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
  |  encrypt(plaintext) ──────────► store ciphertext ────────────►|
  |                               |   (server sees NO plaintext) |
  |                               |                   decrypt()  |
  |                               |               plaintext ✓    |
```

1. **Key Derivation** — On room join, the client derives an AES-256 key using `PBKDF2(passphrase, roomId, 100000 iterations, SHA-256)`. The key never leaves the browser.
2. **Encrypt before send** — `MessageInput` calls `encryptMessage()` before emitting via Socket.IO. The payload sent is `{ ciphertext, iv }` — never plaintext.
3. **Server is blind** — `socketHandler` persists and relays only ciphertext. `Message` schema has no plaintext field.
4. **Decrypt on receive** — `useSocket` decrypts each incoming message immediately using the in-memory key. If decryption fails (wrong passphrase), the message renders as `[decryption failed]`.
5. **Transcript decryption** — `ChatWindow` loads message history from the REST API and decrypts all historical ciphertexts client-side on mount.

### Anonymous Authentication

- On first request, `attachAnonId` middleware assigns a `uuid v4` as `req.session.anonId`.
- This ID is stored in MongoDB via `connect-mongo` and shared with Socket.IO via `io.engine.use(sessionMiddleware)`.
- No login, no registration, no PII stored.

### Room Lifecycle

- Rooms are created with a UUID and stored in MongoDB with a **24-hour TTL index** — they auto-expire.
- Joining validates the room exists before proceeding to key derivation.

### Transcript Export

- On leaving a room, users are prompted to download the chat transcript.
- The downloaded file is unencrypted JSON — decrypted client-side before export.
- System messages (join/leave events) are excluded from the export.

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

- **Passphrase strength** directly determines encryption strength. Weak passphrases are weak keys.
- **Page refresh** clears the in-memory `CryptoKey` — users must re-enter their passphrase. This is intentional.
- **Usernames** are stored in plaintext in `Message` documents as metadata (not sensitive content).
- **Sessions** use `httpOnly` cookies. Set `NODE_ENV=production` and serve over HTTPS to enable `secure` cookies.
- **Room IDs** are UUID v4 — not guessable, but should still be shared only via trusted channels.

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
