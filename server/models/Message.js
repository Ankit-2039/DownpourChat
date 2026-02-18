const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId:    { type: String, required: true, index: true },
    anonId:    { type: String, required: true },   // anonymous session ID
    username:  { type: String, required: true },   // display name (plaintext, user-chosen)
    ciphertext:{ type: String, required: true },   // AES-256 encrypted message
    iv:        { type: String, required: true },   // initialization vector (base64)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
