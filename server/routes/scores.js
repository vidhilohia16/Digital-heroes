const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/scores - Retrieve scores in reverse chronological order
router.get('/', authMiddleware, async (req, res) => {
  try {
    const scores = await db.getScores(req.user.id);
    res.json({ scores });
  } catch (err) {
    console.error('Fetch scores error:', err);
    res.status(500).json({ error: 'Failed to retrieve golf scores.' });
  }
});

// POST /api/scores - Add a new Stableford score
router.post('/', authMiddleware, async (req, res) => {
  const { score, date } = req.body;

  if (score === undefined || !date) {
    return res.status(400).json({ error: 'Score and date are required.' });
  }

  const scoreVal = parseInt(score);
  if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
    return res.status(400).json({ error: 'Golf score must be between 1 and 45 (Stableford format).' });
  }

  try {
    const newScore = await db.addScore(req.user.id, scoreVal, date);
    res.status(201).json({
      message: 'Golf score saved successfully.',
      score: newScore
    });
  } catch (err) {
    console.error('Add score error:', err.message);
    if (err.message.includes('unique') || err.message.includes('Only one score')) {
      return res.status(400).json({ error: 'Only one score entry is permitted per date. Duplicate scores for the same date are not allowed.' });
    }
    res.status(500).json({ error: 'Failed to save golf score.' });
  }
});

// PUT /api/scores/:id - Update an existing score
router.put('/:id', authMiddleware, async (req, res) => {
  const { score, date } = req.body;
  const updates = {};
  
  if (score !== undefined) {
    const scoreVal = parseInt(score);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      return res.status(400).json({ error: 'Golf score must be between 1 and 45 (Stableford format).' });
    }
    updates.score = scoreVal;
  }

  if (date !== undefined) {
    updates.score_date = date;
  }

  try {
    const updated = await db.updateScore(req.user.id, req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Golf score not found.' });
    }
    res.json({
      message: 'Golf score updated successfully.',
      score: updated
    });
  } catch (err) {
    console.error('Update score error:', err);
    if (err.message.includes('Only one score')) {
      return res.status(400).json({ error: 'Only one score entry is permitted per date. Duplicate scores for the same date are not allowed.' });
    }
    res.status(500).json({ error: 'Failed to update golf score.' });
  }
});

// DELETE /api/scores/:id - Delete a score
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteScore(req.user.id, req.params.id);
    res.json({ message: 'Golf score deleted successfully.' });
  } catch (err) {
    console.error('Delete score error:', err);
    res.status(500).json({ error: 'Failed to delete golf score.' });
  }
});

// Middleware to check if user is admin
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
}

// GET /api/scores/user/:userId - Retrieve golf scores for a specific user (Admin only)
router.get('/user/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const scores = await db.getScores(req.params.userId);
    res.json({ scores });
  } catch (err) {
    console.error('Admin fetch scores error:', err);
    res.status(500).json({ error: 'Failed to retrieve golf scores for user.' });
  }
});

// POST /api/scores/user/:userId - Add a golf score for a specific user (Admin only)
router.post('/user/:userId', authMiddleware, adminOnly, async (req, res) => {
  const { score, date } = req.body;
  const { userId } = req.params;

  if (score === undefined || !date) {
    return res.status(400).json({ error: 'Score and date are required.' });
  }

  const scoreVal = parseInt(score);
  if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
    return res.status(400).json({ error: 'Golf score must be between 1 and 45 (Stableford format).' });
  }

  try {
    const newScore = await db.addScore(userId, scoreVal, date);
    res.status(201).json({
      message: 'Golf score saved successfully by Admin.',
      score: newScore
    });
  } catch (err) {
    console.error('Admin add score error:', err.message);
    if (err.message.includes('unique') || err.message.includes('Only one score')) {
      return res.status(400).json({ error: 'Only one score entry is permitted per date. Duplicate scores for the same date are not allowed.' });
    }
    res.status(500).json({ error: 'Failed to save golf score.' });
  }
});

// DELETE /api/scores/user/:userId/:scoreId - Delete a golf score for a specific user (Admin only)
router.delete('/user/:userId/:scoreId', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.deleteScore(req.params.userId, req.params.scoreId);
    res.json({ message: 'Golf score deleted by Admin successfully.' });
  } catch (err) {
    console.error('Admin delete score error:', err);
    res.status(500).json({ error: 'Failed to delete golf score.' });
  }
});

module.exports = router;
