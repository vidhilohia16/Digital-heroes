const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Set up upload directories
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, webp) are permitted.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/winners - List all winners (Admin view or subscriber context)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let list = await db.getWinners();
    
    // If not admin, filter to only return the current user's wins
    if (req.user.role !== 'admin') {
      list = list.filter(w => w.user_id === req.user.id);
    }

    res.json({ winners: list });
  } catch (err) {
    console.error('Fetch winners error:', err);
    res.status(500).json({ error: 'Failed to retrieve winners logs.' });
  }
});

// POST /api/winners/:id/upload-proof - Upload score verification proof screenshot
router.post('/:id/upload-proof', authMiddleware, upload.single('screenshot'), async (req, res) => {
  const winnerId = req.params.id;

  try {
    // Verify winner entry exists and belongs to this user (if not admin)
    const list = await db.getWinners();
    const winner = list.find(w => w.id === winnerId);
    
    if (!winner) {
      return res.status(404).json({ error: 'Winner log not found.' });
    }

    if (req.user.role !== 'admin' && winner.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied. You can only upload proof for your own winnings.' });
    }

    if (!req.file && !req.body.proof_url) {
      return res.status(400).json({ error: 'Please upload an image screenshot or provide a URL.' });
    }

    let proofUrl = '';
    if (req.file) {
      // Set local server url relative path
      proofUrl = `/uploads/${req.file.filename}`;
    } else {
      proofUrl = req.body.proof_url;
    }

    const updated = await db.updateWinnerStatus(winnerId, 'pending', 'pending', proofUrl);
    res.json({
      message: 'Verification proof uploaded successfully. Pending administrator review.',
      winner: updated
    });
  } catch (err) {
    console.error('Proof upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload screenshot proof.' });
  }
});

// PUT /api/winners/:id/verify - Approve or Reject proof (Admin only)
router.put('/:id/verify', authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status. Must be "approved" or "rejected".' });
  }

  try {
    const updated = await db.updateWinnerStatus(req.params.id, status, 'pending');
    if (!updated) {
      return res.status(404).json({ error: 'Winner log not found.' });
    }
    
    res.json({
      message: `Winner verification marked as ${status}.`,
      winner: updated
    });
  } catch (err) {
    console.error('Verify winner error:', err);
    res.status(500).json({ error: 'Failed to update winner verification.' });
  }
});

// PUT /api/winners/:id/payout - Mark payout status (Admin only)
router.put('/:id/payout', authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body; // 'pending' or 'completed'
  
  if (!['pending', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid payment status. Must be "pending" or "completed".' });
  }

  try {
    const updated = await db.updateWinnerStatus(req.params.id, null, status);
    if (!updated) {
      return res.status(404).json({ error: 'Winner log not found.' });
    }
    
    res.json({
      message: `Payment status marked as ${status === 'completed' ? 'Paid' : 'Pending'}.`,
      winner: updated
    });
  } catch (err) {
    console.error('Payout status error:', err);
    res.status(500).json({ error: 'Failed to update payout status.' });
  }
});

module.exports = router;
