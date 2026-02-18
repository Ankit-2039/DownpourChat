const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');

// POST /api/rooms/create
router.post('/create', async (req, res) => {
  try {
    const roomId = uuidv4();
    await Room.create({ roomId });
    res.status(201).json({ roomId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// POST /api/rooms/join
router.post('/join', async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'roomId required' });

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    res.status(200).json({ roomId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

module.exports = router;
