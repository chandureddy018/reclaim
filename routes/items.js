const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendMatchEmail } = require('../middleware/email');

// ── SMART MATCH FUNCTION ──────────────────────────────────────────────────
const findMatches = async (newItem) => {
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
  const matches = await Item.find({
    type: oppositeType,
    resolved: false,
    category: newItem.category,
    $or: [
      { location: { $regex: newItem.location.split(' ')[0], $options: 'i' } },
      { name: { $regex: newItem.name.split(' ')[0], $options: 'i' } }
    ]
  }).limit(5);
  return matches;
};

// ── GET ALL ITEMS (public) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, search, category, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Item.countDocuments(filter);
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── SUBMIT REPORT (protected) ─────────────────────────────────────────────
router.post('/', protect, upload.single('image'), [
  body('type').isIn(['lost', 'found']).withMessage('Type must be lost or found'),
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { type, name, category, location, date, description, contact, storedAt } = req.body;
    const imageUrl = req.file ? req.file.path : '';

    const item = await Item.create({
      type, name, category, location,
      date: date || '',
      description: description || '',
      contact: contact || '',
      storedAt: storedAt || '',
      imageUrl,
      reportedBy: {
        userId: req.user._id,
        name:   req.user.name,
        email:  req.user.email,
        phone:  req.user.phone || contact || ''
      }
    });

    // Smart matching — find potential matches and notify
    const matches = await findMatches(item);
    if (matches.length > 0) {
      item.matches = matches.map(m => m._id);
      await item.save();

      // Email the current user about matches
      sendMatchEmail({
        toEmail: req.user.email,
        toName:  req.user.name,
        yourItem: item,
        matchedItem: matches[0]
      });

      // Email the matched item's reporter too
      sendMatchEmail({
        toEmail: matches[0].reportedBy.email,
        toName:  matches[0].reportedBy.name,
        yourItem: matches[0],
        matchedItem: item
      });
    }

    res.status(201).json({ item, matchesFound: matches.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET MY POSTS (protected) ──────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const items = await Item.find({ 'reportedBy.userId': req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── MARK RESOLVED (owner or admin) ───────────────────────────────────────
router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    const isOwner = item.reportedBy.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized.' });
    item.resolved = true;
    await item.save();
    res.json({ message: 'Marked as resolved.', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE (owner or admin) ───────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    const isOwner = item.reportedBy.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized.' });
    await item.deleteOne();
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── ADMIN: GET ALL WITH FULL DETAILS ─────────────────────────────────────
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { type, search, category } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { 'reportedBy.name': { $regex: search, $options: 'i' } },
        { 'reportedBy.email': { $regex: search, $options: 'i' } }
      ];
    }
    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
