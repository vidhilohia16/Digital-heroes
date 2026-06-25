const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Middleware to check if user is admin
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
}

// GET /api/charities - Fetch charities list with optional search query
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    let list = await db.getCharities();

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q)
      );
    }

    res.json({ charities: list });
  } catch (err) {
    console.error('Fetch charities error:', err);
    res.status(500).json({ error: 'Failed to retrieve charities.' });
  }
});

// GET /api/charities/spotlight - Fetch featured/spotlighted charities
router.get('/spotlight', async (req, res) => {
  try {
    const list = await db.getCharities();
    const spotlight = list.filter(c => c.is_featured);
    res.json({ charities: spotlight });
  } catch (err) {
    console.error('Fetch spotlight error:', err);
    res.status(500).json({ error: 'Failed to retrieve spotlighted charities.' });
  }
});

// POST /api/charities - Add new charity (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, logoUrl, bannerUrl, upcomingEvents, isFeatured } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    const newCharity = await db.addCharity({
      name,
      description,
      logo_url: logoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200',
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800',
      upcoming_events: upcomingEvents || '',
      is_featured: !!isFeatured
    });

    res.status(201).json({
      message: 'Charity added successfully.',
      charity: newCharity
    });
  } catch (err) {
    console.error('Add charity error:', err);
    res.status(500).json({ error: 'Failed to create charity.' });
  }
});

// PUT /api/charities/:id - Update charity profile (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, logoUrl, bannerUrl, upcomingEvents, isFeatured } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (logoUrl !== undefined) updates.logo_url = logoUrl;
  if (bannerUrl !== undefined) updates.banner_url = bannerUrl;
  if (upcomingEvents !== undefined) updates.upcoming_events = upcomingEvents;
  if (isFeatured !== undefined) updates.is_featured = !!isFeatured;

  try {
    const updated = await db.updateCharity(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Charity not found.' });
    }
    res.json({
      message: 'Charity updated successfully.',
      charity: updated
    });
  } catch (err) {
    console.error('Update charity error:', err);
    res.status(500).json({ error: 'Failed to update charity.' });
  }
});

// DELETE /api/charities/:id - Delete charity (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.deleteCharity(req.params.id);
    res.json({ message: 'Charity deleted successfully.' });
  } catch (err) {
    console.error('Delete charity error:', err);
    res.status(500).json({ error: 'Failed to delete charity.' });
  }
});

module.exports = router;
