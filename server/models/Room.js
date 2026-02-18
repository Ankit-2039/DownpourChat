const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: 24h
  },
  { timestamps: false }
);

module.exports = mongoose.model('Room', roomSchema);
