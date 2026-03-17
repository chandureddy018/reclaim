const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const { protect, adminOnly } = require('../middleware/auth');

// ── SEND MESSAGE ─────────────────────────────────────────────────────────
router.post('/', protect, [
  body('message').trim().notEmpty().withMessage('Message cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const chat = await Chat.create({
      from: req.user._id,
      fromName: req.user.name,
      role: req.user.role,
      message: req.body.message
    });
    res.status(201).json({ chat });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET MESSAGES (admin sees all, user sees their own) ────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { from: req.user._id };
    const chats = await Chat.find(filter).sort({ createdAt: 1 }).limit(100);
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
