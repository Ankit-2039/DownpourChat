const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/transcript/:roomId  — returns last 100 ciphertexts
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(100)
      .select('-__v');

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

module.exports = router;
