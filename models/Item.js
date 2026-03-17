const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type:      { type: String, enum: ['lost', 'found'], required: true },
  name:      { type: String, required: true, trim: true },
  category:  { type: String, required: true },
  location:  { type: String, required: true, trim: true },
  date:      { type: String, default: '' },
  description: { type: String, default: '', trim: true },
  contact:   { type: String, default: '' },
  storedAt:  { type: String, default: '' },
  imageUrl:  { type: String, default: '' },
  resolved:  { type: Boolean, default: false },
  // Reporter info (stored server-side, not client-controlled)
  reportedBy: {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, default: '' }
  },
  // Potential matches found by server
  matches:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  createdAt: { type: Date, default: Date.now }
});

// Text index for search
itemSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
