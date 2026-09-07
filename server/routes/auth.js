const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// POST /api/auth/register — save user profile to Firestore after client-side Firebase signup
router.post('/register', async (req, res) => {
  try {
    const { uid, name, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#06b6d4', '#10b981', '#3b82f6'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const userDoc = {
      name: name || email.split('@')[0],
      email,
      role: 'member',
      avatarColor,
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(userDoc);

    res.status(201).json({ uid, ...userDoc });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET /api/auth/me — return current user profile
router.get('/me', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ uid: doc.id, ...doc.data() });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
