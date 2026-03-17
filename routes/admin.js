const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require login + admin role
router.use(protect, adminOnly);

// ── GET ALL USERS ─────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    // Attach post count to each user
    const usersWithCount = await Promise.all(users.map(async u => {
      const postCount = await Item.countDocuments({ 'reportedBy.userId': u._id });
      return { ...u.toJSON(), postCount };
    }));
    res.json({ users: usersWithCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET STATS ─────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [lost, found, resolved, users] = await Promise.all([
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ resolved: true }),
      User.countDocuments({ role: 'user' })
    ]);
    res.json({ lost, found, resolved, users });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE USER ───────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin account.' });
    await user.deleteOne();
    await Item.deleteMany({ 'reportedBy.userId': req.params.id });
    res.json({ message: 'User and their posts deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
