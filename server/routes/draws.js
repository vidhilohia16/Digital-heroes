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

// Generate draw numbers (range 1-45, 5 unique numbers)
async function generateDrawNumbers(logicType) {
  if (logicType === 'random') {
    const nums = [];
    while (nums.length < 5) {
      const rand = Math.floor(Math.random() * 45) + 1;
      if (!nums.includes(rand)) {
        nums.push(rand);
      }
    }
    return nums.sort((a, b) => a - b);
  } else {
    // Algorithmic draw: weighted by user score frequencies
    // Let's get all scores from database
    const allProfiles = await db.getProfiles();
    const activeSubscribers = allProfiles.filter(p => p.subscription_status === 'active');
    
    const frequencies = Array(46).fill(0); // 1-indexed
    let totalScoreCount = 0;

    for (const sub of activeSubscribers) {
      const scores = await db.getScores(sub.id);
      scores.forEach(s => {
        if (s.score >= 1 && s.score <= 45) {
          frequencies[s.score]++;
          totalScoreCount++;
        }
      });
    }

    // Weight formula:
    // We want numbers that exist in user scores to have higher probability.
    // If there are no scores, fall back to random.
    if (totalScoreCount === 0) {
      return generateDrawNumbers('random');
    }

    const pool = [];
    for (let num = 1; num <= 45; num++) {
      const freq = frequencies[num];
      // Give each number a base weight of 1, plus its frequency * 5.
      // This means a popular score has a much higher chance of selection.
      const weight = 1 + freq * 5;
      for (let w = 0; w < weight; w++) {
        pool.push(num);
      }
    }

    const nums = [];
    while (nums.length < 5) {
      const randIndex = Math.floor(Math.random() * pool.length);
      const chosen = pool[randIndex];
      if (!nums.includes(chosen)) {
        nums.push(chosen);
      }
    }
    return nums.sort((a, b) => a - b);
  }
}

// Run comparison logic for simulation or publishing
async function calculateDrawResults(winningNumbers) {
  const allProfiles = await db.getProfiles();
  const activeSubscribers = allProfiles.filter(p => p.subscription_status === 'active');
  const jackpotPool = await db.getJackpotPool();

  const totalPool = activeSubscribers.length * 15.00; // Let's say $15 per subscriber goes to pool
  const pool5 = totalPool * 0.40 + parseFloat(jackpotPool);
  const pool4 = totalPool * 0.35;
  const pool3 = totalPool * 0.25;

  const results = {
    totalSubscribers: activeSubscribers.length,
    totalPool,
    pool5,
    pool4,
    pool3,
    winners5: [],
    winners4: [],
    winners3: [],
    allSubscribersChecked: []
  };

  for (const sub of activeSubscribers) {
    const scores = await db.getScores(sub.id);
    const scoreNumbers = scores.map(s => s.score);

    // Count intersections between winning numbers and user's scores
    let matchCount = 0;
    const matchedNumbers = [];
    
    scoreNumbers.forEach(num => {
      if (winningNumbers.includes(num)) {
        matchCount++;
        matchedNumbers.push(num);
      }
    });

    const userInfo = {
      userId: sub.id,
      fullName: sub.full_name,
      email: sub.email,
      scoresEntered: scoreNumbers,
      matchCount,
      matchedNumbers
    };

    results.allSubscribersChecked.push(userInfo);

    if (matchCount === 5) {
      results.winners5.push(userInfo);
    } else if (matchCount === 4) {
      results.winners4.push(userInfo);
    } else if (matchCount === 3) {
      results.winners3.push(userInfo);
    }
  }

  // Calculate split amounts
  results.prize5PerWinner = results.winners5.length > 0 ? (pool5 / results.winners5.length) : 0;
  results.prize4PerWinner = results.winners4.length > 0 ? (pool4 / results.winners4.length) : 0;
  results.prize3PerWinner = results.winners3.length > 0 ? (pool3 / results.winners3.length) : 0;

  // Next rollover jackpot calculation
  results.jackpotRolledOver = results.winners5.length === 0 ? pool5 : 100.00; // seed next draw with $100 if jackpot won

  return results;
}

// GET /api/draws/current - Get current jackpot pool size and upcoming draw stats
router.get('/current', async (req, res) => {
  try {
    const jackpotPool = await db.getJackpotPool();
    const allProfiles = await db.getProfiles();
    const activeSubscribers = allProfiles.filter(p => p.subscription_status === 'active');
    
    res.json({
      jackpotPool: parseFloat(jackpotPool),
      activeSubscribers: activeSubscribers.length,
      estimatedPrizePool: activeSubscribers.length * 15.00,
      nextDrawDate: '2026-07-31'
    });
  } catch (err) {
    console.error('Fetch current draw stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve draw stats.' });
  }
});

// GET /api/draws - Get previous draw logs
router.get('/', async (req, res) => {
  try {
    const list = await db.getDraws();
    res.json({ draws: list });
  } catch (err) {
    console.error('Fetch draws error:', err);
    res.status(500).json({ error: 'Failed to retrieve draw history.' });
  }
});

// POST /api/draws/simulate - Run dry run draw (Admin only)
router.post('/simulate', authMiddleware, adminOnly, async (req, res) => {
  const { logic } = req.body; // 'random' or 'algorithmic'
  const logicUsed = logic || 'random';

  try {
    const winningNumbers = await generateDrawNumbers(logicUsed);
    const results = await calculateDrawResults(winningNumbers);

    res.json({
      winningNumbers,
      logicUsed,
      ...results
    });
  } catch (err) {
    console.error('Draw simulation error:', err);
    res.status(500).json({ error: 'Failed to simulate draw.' });
  }
});

// POST /api/draws/publish - Run and write draw results to database (Admin only)
router.post('/publish', authMiddleware, adminOnly, async (req, res) => {
  const { logic } = req.body;
  const logicUsed = logic || 'random';

  try {
    const winningNumbers = await generateDrawNumbers(logicUsed);
    const results = await calculateDrawResults(winningNumbers);

    // Write draw to DB
    const drawRecord = await db.createDraw(
      winningNumbers,
      logicUsed,
      results.totalSubscribers,
      results.totalPool,
      results.jackpotRolledOver
    );

    // Save winners
    const winningLogs = [];
    
    // Add 5-match winners
    for (const w of results.winners5) {
      const winner = await db.createWinner(drawRecord.id, w.userId, 5, results.prize5PerWinner);
      winningLogs.push(winner);
    }
    
    // Add 4-match winners
    for (const w of results.winners4) {
      const winner = await db.createWinner(drawRecord.id, w.userId, 4, results.prize4PerWinner);
      winningLogs.push(winner);
    }

    // Add 3-match winners
    for (const w of results.winners3) {
      const winner = await db.createWinner(drawRecord.id, w.userId, 3, results.prize3PerWinner);
      winningLogs.push(winner);
    }

    res.status(201).json({
      message: 'Draw published and archived successfully.',
      draw: drawRecord,
      winnersCreated: winningLogs.length,
      winningNumbers,
      details: {
        winners5Count: results.winners5.length,
        winners4Count: results.winners4.length,
        winners3Count: results.winners3.length,
        jackpotRolledOver: results.jackpotRolledOver
      }
    });
  } catch (err) {
    console.error('Publish draw error:', err);
    res.status(500).json({ error: 'Failed to publish draw.' });
  }
});

module.exports = router;
