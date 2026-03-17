const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  from:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromName: { type: String, required: true },
  role:    { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
