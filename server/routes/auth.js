const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/signup (Mock & Supabase registration profile sync)
router.post('/signup', async (req, res) => {
  const { email, password, fullName, charityId, donationPercentage, plan } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and full name are required.' });
  }

  try {
    let profileId;
    
    if (db.isMock()) {
      profileId = 'mock-user-' + Date.now();
      const existing = await db.getProfileByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }
    } else {
      // In Supabase mode, the signup should ideally happen on frontend using Supabase Auth,
      // and this endpoint synchronizes the profile metadata, but let's support creation here as well.
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password || 'defaultpassword123'
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }
      
      profileId = authData.user.id;
    }

    const newProfile = await db.createProfile({
      id: profileId,
      email,
      full_name: fullName,
      role: 'subscriber',
      subscription_status: plan ? 'active' : 'inactive',
      subscription_plan: plan || null,
      charity_id: charityId || null,
      donation_percentage: donationPercentage || 10,
      total_winnings: 0.00,
      payment_status: 'none'
    });

    res.status(201).json({
      message: 'Account registered successfully.',
      user: newProfile
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Error occurred during registration.' });
  }
});

// POST /api/auth/login (Simple login for Demo/Mocking)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    if (!db.isMock()) {
      // Supabase Live Mode Authentication
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'defaultpassword123'
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      const profile = await db.getProfile(authData.user.id);
      return res.json({
        message: 'Logged in successfully.',
        token: authData.session.access_token,
        user: profile
      });
    }

    // Mock Mode Authentication
    const profile = await db.getProfileByEmail(email);
    if (!profile) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    res.json({
      message: 'Logged in successfully.',
      token: profile.id, // For mock mode, the id itself acts as the bearer token
      user: profile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error logging in.' });
  }
});

// GET /api/auth/me (Get current profile)
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile (Update profile settings: charity, plan, etc.)
router.put('/profile', authMiddleware, async (req, res) => {
  const { fullName, charityId, donationPercentage, subscriptionStatus, subscriptionPlan } = req.body;
  
  const updates = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (charityId !== undefined) updates.charity_id = charityId;
  if (donationPercentage !== undefined) {
    const pct = parseInt(donationPercentage);
    if (pct < 10) {
      return res.status(400).json({ error: 'Minimum charity contribution is 10%.' });
    }
    updates.donation_percentage = pct;
  }
  if (subscriptionStatus !== undefined) updates.subscription_status = subscriptionStatus;
  if (subscriptionPlan !== undefined) updates.subscription_plan = subscriptionPlan;

  try {
    const updated = await db.updateProfile(req.user.id, updates);
    res.json({
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
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

// GET /api/auth/users - Retrieve all profiles (Admin only)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const list = await db.getProfiles();
    res.json({ users: list });
  } catch (err) {
    console.error('Fetch users list error:', err);
    res.status(500).json({ error: 'Failed to retrieve user list.' });
  }
});

// PUT /api/auth/users/:id - Update specific user settings (Admin only)
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { fullName, role, subscriptionStatus, subscriptionPlan, charityId } = req.body;
  const updates = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;
  if (subscriptionStatus !== undefined) updates.subscription_status = subscriptionStatus;
  if (subscriptionPlan !== undefined) updates.subscription_plan = subscriptionPlan;
  if (charityId !== undefined) updates.charity_id = charityId;

  try {
    const updated = await db.updateProfile(req.params.id, updates);
    res.json({
      message: 'User profile updated by Admin successfully.',
      user: updated
    });
  } catch (err) {
    console.error('Admin update profile error:', err);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

module.exports = router;
