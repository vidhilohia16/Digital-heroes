const db = require('../db');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const xUserId = req.headers['x-user-id'];

    if (db.isMock()) {
      // In mock mode, resolve user via x-user-id header or authorization header (acting as id)
      let userId = xUserId;
      if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.split(' ')[1];
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing credentials in Mock Mode.' });
      }

      let profile = await db.getProfile(userId);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized: User profile not found in Mock database.' });
      }

      // Auto-elevate admin@digitalheroes.com to admin role in mock mode
      if (profile.email && profile.email.toLowerCase() === 'admin@digitalheroes.com') {
        if (profile.role !== 'admin' || profile.subscription_status !== 'inactive') {
          profile = await db.updateProfile(userId, {
            role: 'admin',
            subscription_status: 'inactive',
            subscription_plan: null
          });
        }
      }

      req.user = profile;
      return next();
    } else {
      // Supabase Live Mode
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing Authorization header.' });
      }

      const token = authHeader.split(' ')[1];
      // Import supabase client dynamically or reference it
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token.' });
      }

      // Fetch corresponding profile
      let profile = await db.getProfile(user.id);

      // Auto-elevate admin@digitalheroes.com to admin role in live DB
      if (user.email && user.email.toLowerCase() === 'admin@digitalheroes.com') {
        if (!profile || profile.role !== 'admin' || profile.subscription_status !== 'inactive') {
          console.log(`Elevating profile for ${user.email} to admin role...`);
          if (!profile) {
            profile = await db.createProfile({
              id: user.id,
              email: user.email,
              full_name: 'System Admin',
              role: 'admin',
              subscription_status: 'inactive',
              subscription_plan: null,
              donation_percentage: 10,
              total_winnings: 0.00,
              payment_status: 'none'
            });
          } else {
            profile = await db.updateProfile(user.id, {
              role: 'admin',
              subscription_status: 'inactive',
              subscription_plan: null
            });
          }
        }
      }

      req.user = {
        id: user.id,
        email: user.email,
        ...profile
      };

      next();
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication verification failed.' });
  }
};
