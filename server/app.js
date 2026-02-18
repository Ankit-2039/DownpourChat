const express = require('express');
const cors = require('cors');
const { sessionMiddleware, attachAnonId } = require('./middleware/sessionMiddleware');
const roomRoutes = require('./routes/roomRoutes');
const transcriptRoutes = require('./routes/transcriptRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(sessionMiddleware);
app.use(attachAnonId);

app.use('/api/rooms', roomRoutes);
app.use('/api/transcript', transcriptRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

module.exports = app;
