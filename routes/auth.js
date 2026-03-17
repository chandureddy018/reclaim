const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../middleware/email');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── SIGN UP ──────────────────────────────────────────────────────────────
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered. Please sign in.' });

    const user = await User.create({ name, email, password, phone: phone || '' });
    sendWelcomeEmail({ toEmail: email, toName: name }); // non-blocking

    res.status(201).json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── SIGN IN ──────────────────────────────────────────────────────────────
router.post('/signin', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// ── CHANGE NAME ──────────────────────────────────────────────────────────
router.patch('/change-name', protect, [
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    req.user.name = req.body.name.trim();
    await req.user.save();
    res.json({ message: 'Name updated.', name: req.user.name });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── CHANGE EMAIL (admin only) ─────────────────────────────────────────────
router.patch('/change-email', protect, adminOnly, [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('currentPassword').notEmpty().withMessage('Current password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect.' });
    const exists = await User.findOne({ email: req.body.email });
    if (exists && exists._id.toString() !== user._id.toString())
      return res.status(400).json({ message: 'Email already in use.' });
    user.email = req.body.email;
    await user.save();
    res.json({ message: 'Email updated.', email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── CHANGE PASSWORD ──────────────────────────────────────────────────────
router.patch('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect.' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
