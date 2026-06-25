const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
let isMockMode = true;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_KEY !== 'YOUR_SUPABASE_KEY') {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    isMockMode = false;
    console.log('🔌 Connected to Supabase Database successfully.');
  } catch (error) {
    console.error('⚠️ Failed to initialize Supabase client:', error.message);
    console.log('🔄 Falling back to Local Mock Database.');
  }
} else {
  console.log('ℹ️ Supabase credentials not found or placeholder used. Running in Local Mock Database mode.');
}

// Local Mock Database implementation
const mockDbPath = path.join(__dirname, 'data', 'db.json');

// Ensure data folder and file exist
function initMockDb() {
  const dir = path.dirname(mockDbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(mockDbPath)) {
    const initialData = {
      charities: [
        {
          id: 'charity-1',
          name: 'Green Fairways Initiative',
          description: 'Providing urban youth access to golf equipment, mentorship, and life-skills education through golf.',
          logo_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200',
          banner_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800',
          upcoming_events: 'Youth Golf Clinic - July 12th; Charity Scramble - August 5th',
          is_featured: true
        },
        {
          id: 'charity-2',
          name: 'Hearts & Handicaps',
          description: 'Supporting golf tournaments for physically challenged and veteran adaptive golf programs.',
          logo_url: 'https://images.unsplash.com/photo-1469571486090-7db333894b2a?auto=format&fit=crop&q=80&w=200',
          banner_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
          upcoming_events: 'Veterans Golf Open - July 20th; Adaptive Equipment Clinic - Sept 3rd',
          is_featured: false
        },
        {
          id: 'charity-3',
          name: 'Eco-Links Foundation',
          description: 'Partnering with golf courses globally to restore natural wildlife habitats and implement eco-friendly water management.',
          logo_url: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&q=80&w=200',
          banner_url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800',
          upcoming_events: 'Sustainable Turf Workshop - August 15th',
          is_featured: false
        }
      ],
      profiles: [
        {
          id: 'admin-id',
          email: 'admin@digitalheroes.com',
          full_name: 'Admin Hero',
          role: 'admin',
          subscription_status: 'active',
          subscription_plan: 'yearly',
          charity_id: 'charity-1',
          donation_percentage: 15,
          total_winnings: 0.00,
          payment_status: 'none'
        },
        {
          id: 'user-id-1',
          email: 'golfer1@gmail.com',
          full_name: 'Sarah Connor',
          role: 'subscriber',
          subscription_status: 'active',
          subscription_plan: 'monthly',
          charity_id: 'charity-1',
          donation_percentage: 12,
          total_winnings: 150.00,
          payment_status: 'paid'
        },
        {
          id: 'user-id-2',
          email: 'golfer2@gmail.com',
          full_name: 'Marcus Aurelius',
          role: 'subscriber',
          subscription_status: 'active',
          subscription_plan: 'yearly',
          charity_id: 'charity-2',
          donation_percentage: 20,
          total_winnings: 0.00,
          payment_status: 'none'
        }
      ],
      golf_scores: [
        // Let's seed 5 scores for user-id-1 (descending dates)
        { id: 's1', user_id: 'user-id-1', score: 38, score_date: '2026-06-25' },
        { id: 's2', user_id: 'user-id-1', score: 40, score_date: '2026-06-20' },
        { id: 's3', user_id: 'user-id-1', score: 36, score_date: '2026-06-15' },
        { id: 's4', user_id: 'user-id-1', score: 42, score_date: '2026-06-10' },
        { id: 's5', user_id: 'user-id-1', score: 35, score_date: '2026-06-05' },

        // Seed 4 scores for user-id-2
        { id: 's6', user_id: 'user-id-2', score: 39, score_date: '2026-06-24' },
        { id: 's7', user_id: 'user-id-2', score: 44, score_date: '2026-06-19' },
        { id: 's8', user_id: 'user-id-2', score: 41, score_date: '2026-06-14' },
        { id: 's9', user_id: 'user-id-2', score: 37, score_date: '2026-06-09' }
      ],
      draws: [
        {
          id: 'draw-1',
          draw_date: '2026-05-31',
          winning_numbers: [12, 19, 27, 35, 41],
          logic_used: 'random',
          total_subscribers: 2,
          total_pool: 250.00,
          jackpot_rolled_over: 0.00
        }
      ],
      winners: [
        {
          id: 'winner-1',
          draw_id: 'draw-1',
          user_id: 'user-id-1',
          match_type: 4,
          prize_amount: 150.00,
          proof_image_url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=600',
          verification_status: 'approved',
          payment_status: 'completed',
          verified_at: '2026-06-01T10:00:00.000Z'
        }
      ],
      settings: {
        jackpot_pool: 250.00 // running jackpot total
      }
    };
    fs.writeFileSync(mockDbPath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

initMockDb();

function readMockDb() {
  initMockDb();
  const data = fs.readFileSync(mockDbPath, 'utf8');
  return JSON.parse(data);
}

function writeMockDb(data) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Database Helper Actions
const db = {
  isMock: () => isMockMode,

  // Charities
  getCharities: async () => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('charities').select('*').order('name');
      if (error) throw error;
      return data;
    } else {
      const data = readMockDb();
      return data.charities;
    }
  },

  addCharity: async (charity) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('charities').insert([charity]).select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const newCharity = { id: 'charity-' + Date.now(), ...charity, is_featured: charity.is_featured || false };
      data.charities.push(newCharity);
      writeMockDb(data);
      return newCharity;
    }
  },

  updateCharity: async (id, charityUpdates) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('charities').update(charityUpdates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const idx = data.charities.findIndex(c => c.id === id);
      if (idx !== -1) {
        data.charities[idx] = { ...data.charities[idx], ...charityUpdates };
        writeMockDb(data);
        return data.charities[idx];
      }
      return null;
    }
  },

  deleteCharity: async (id) => {
    if (!isMockMode) {
      const { error } = await supabase.from('charities').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const data = readMockDb();
      data.charities = data.charities.filter(c => c.id !== id);
      writeMockDb(data);
      return true;
    }
  },

  // Profiles
  getProfile: async (id) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is empty result
      return data || null;
    } else {
      const data = readMockDb();
      return data.profiles.find(p => p.id === id) || null;
    }
  },

  getProfileByEmail: async (email) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } else {
      const data = readMockDb();
      return data.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  createProfile: async (profile) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('profiles').insert([profile]).select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const newProfile = {
        role: 'subscriber',
        subscription_status: 'inactive',
        donation_percentage: 10,
        total_winnings: 0.00,
        payment_status: 'none',
        ...profile
      };
      data.profiles.push(newProfile);
      writeMockDb(data);
      return newProfile;
    }
  },

  updateProfile: async (id, profileUpdates) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('profiles').update(profileUpdates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const idx = data.profiles.findIndex(p => p.id === id);
      if (idx !== -1) {
        data.profiles[idx] = { ...data.profiles[idx], ...profileUpdates };
        writeMockDb(data);
        return data.profiles[idx];
      }
      return null;
    }
  },

  getProfiles: async () => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    } else {
      const data = readMockDb();
      return data.profiles;
    }
  },

  // Golf Scores (Stableford 1-45, max 5, sorted by date DESC)
  getScores: async (userId) => {
    if (!isMockMode) {
      const { data, error } = await supabase
        .from('golf_scores')
        .select('*')
        .eq('user_id', userId)
        .order('score_date', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const data = readMockDb();
      return data.golf_scores
        .filter(s => s.user_id === userId)
        .sort((a, b) => new Date(b.score_date) - new Date(a.score_date));
    }
  },

  addScore: async (userId, score, scoreDate) => {
    if (!isMockMode) {
      // Get current scores to see if we exceed 5
      const { data: currentScores, error: fetchErr } = await supabase
        .from('golf_scores')
        .select('*')
        .eq('user_id', userId)
        .order('score_date', { ascending: false });
      
      if (fetchErr) throw fetchErr;

      // If duplicate date, fail
      if (currentScores.some(s => s.score_date === scoreDate)) {
        throw new Error('Only one score entry is permitted per date.');
      }

      // Add new score
      const { data: inserted, error: insertErr } = await supabase
        .from('golf_scores')
        .insert([{ user_id: userId, score, score_date: scoreDate }])
        .select();

      if (insertErr) throw insertErr;

      // If count was already 5, delete the oldest
      if (currentScores.length >= 5) {
        const oldestId = currentScores[currentScores.length - 1].id;
        await supabase.from('golf_scores').delete().eq('id', oldestId);
      }

      return inserted[0];
    } else {
      const data = readMockDb();
      const userScores = data.golf_scores
        .filter(s => s.user_id === userId)
        .sort((a, b) => new Date(b.score_date) - new Date(a.score_date));

      // Duplicate check
      if (userScores.some(s => s.score_date === scoreDate)) {
        throw new Error('Only one score entry is permitted per date.');
      }

      const newScore = {
        id: 'score-' + Date.now(),
        user_id: userId,
        score: parseInt(score),
        score_date: scoreDate
      };

      data.golf_scores.push(newScore);

      // Re-fetch, sort, and retain only latest 5
      const updatedUserScores = data.golf_scores
        .filter(s => s.user_id === userId)
        .sort((a, b) => new Date(b.score_date) - new Date(a.score_date));

      if (updatedUserScores.length > 5) {
        // Find which ids to keep (top 5)
        const idsToKeep = updatedUserScores.slice(0, 5).map(s => s.id);
        data.golf_scores = data.golf_scores.filter(s => s.user_id !== userId || idsToKeep.includes(s.id));
      }

      writeMockDb(data);
      return newScore;
    }
  },

  deleteScore: async (userId, scoreId) => {
    if (!isMockMode) {
      const { error } = await supabase.from('golf_scores').delete().eq('id', scoreId).eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      const data = readMockDb();
      data.golf_scores = data.golf_scores.filter(s => !(s.id === scoreId && s.user_id === userId));
      writeMockDb(data);
      return true;
    }
  },

  updateScore: async (userId, scoreId, scoreUpdates) => {
    if (!isMockMode) {
      const { data, error } = await supabase
        .from('golf_scores')
        .update(scoreUpdates)
        .eq('id', scoreId)
        .eq('user_id', userId)
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const idx = data.golf_scores.findIndex(s => s.id === scoreId && s.user_id === userId);
      if (idx !== -1) {
        // Date duplicate check if date is updating
        if (scoreUpdates.score_date && scoreUpdates.score_date !== data.golf_scores[idx].score_date) {
          const duplicate = data.golf_scores.some(s => s.user_id === userId && s.score_date === scoreUpdates.score_date);
          if (duplicate) {
            throw new Error('Only one score entry is permitted per date.');
          }
        }
        data.golf_scores[idx] = { ...data.golf_scores[idx], ...scoreUpdates };
        writeMockDb(data);
        return data.golf_scores[idx];
      }
      return null;
    }
  },

  // Draws
  getDraws: async () => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('draws').select('*').order('draw_date', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const data = readMockDb();
      return data.draws.sort((a, b) => new Date(b.draw_date) - new Date(a.draw_date));
    }
  },

  createDraw: async (winningNumbers, logicUsed, totalSubscribers, totalPool, jackpotRolledOver) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('draws').insert([{
        winning_numbers: winningNumbers,
        logic_used: logicUsed,
        total_subscribers: totalSubscribers,
        total_pool: totalPool,
        jackpot_rolled_over: jackpotRolledOver
      }]).select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const newDraw = {
        id: 'draw-' + Date.now(),
        draw_date: new Date().toISOString().split('T')[0],
        winning_numbers: winningNumbers,
        logic_used: logicUsed,
        total_subscribers: totalSubscribers,
        total_pool: totalPool,
        jackpot_rolled_over: jackpotRolledOver
      };
      data.draws.push(newDraw);
      data.settings.jackpot_pool = jackpotRolledOver; // update local jackpot setting
      writeMockDb(data);
      return newDraw;
    }
  },

  getJackpotPool: async () => {
    if (!isMockMode) {
      // Find the last draw or read from a settings table. Let's look up last draw's rollover
      const { data, error } = await supabase.from('draws').select('jackpot_rolled_over').order('draw_date', { ascending: false }).limit(1);
      if (error) throw error;
      return data && data[0] ? parseFloat(data[0].jackpot_rolled_over) : 1000.00; // default initial jackpot
    } else {
      const data = readMockDb();
      return data.settings.jackpot_pool !== undefined ? data.settings.jackpot_pool : 1000.00;
    }
  },

  // Winners
  getWinners: async () => {
    if (!isMockMode) {
      try {
        const { data, error } = await supabase.from('winners').select('*, profiles(full_name, email), draws(draw_date)').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase join query failed, attempting manual in-memory join fallback:', err.message || err);
        const { data: winners, error: wErr } = await supabase.from('winners').select('*').order('created_at', { ascending: false });
        if (wErr) throw wErr;
        
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, email');
        if (pErr) throw pErr;
        
        const { data: draws, error: dErr } = await supabase.from('draws').select('id, draw_date');
        if (dErr) throw dErr;

        return winners.map(w => {
          const profile = profiles.find(p => p.id === w.user_id) || { full_name: 'Unknown User', email: '' };
          const draw = draws.find(d => d.id === w.draw_id) || { draw_date: '' };
          return {
            ...w,
            profiles: { full_name: profile.full_name, email: profile.email },
            draws: { draw_date: draw.draw_date }
          };
        });
      }
    } else {
      const data = readMockDb();
      // Join profiles and draws manually
      return data.winners.map(w => {
        const profile = data.profiles.find(p => p.id === w.user_id) || { full_name: 'Unknown User', email: '' };
        const draw = data.draws.find(d => d.id === w.draw_id) || { draw_date: '' };
        return {
          ...w,
          profiles: { full_name: profile.full_name, email: profile.email },
          draws: { draw_date: draw.draw_date }
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  createWinner: async (drawId, userId, matchType, prizeAmount) => {
    if (!isMockMode) {
      const { data, error } = await supabase.from('winners').insert([{
        draw_id: drawId,
        user_id: userId,
        match_type: matchType,
        prize_amount: prizeAmount,
        verification_status: 'pending',
        payment_status: 'pending'
      }]).select();
      if (error) throw error;
      return data[0];
    } else {
      const data = readMockDb();
      const newWinner = {
        id: 'winner-' + Date.now(),
        draw_id: drawId,
        user_id: userId,
        match_type: matchType,
        prize_amount: prizeAmount,
        verification_status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      data.winners.push(newWinner);
      writeMockDb(data);
      return newWinner;
    }
  },

  updateWinnerStatus: async (winnerId, verificationStatus, paymentStatus, proofImageUrl = null) => {
    if (!isMockMode) {
      const updates = {};
      if (verificationStatus) updates.verification_status = verificationStatus;
      if (paymentStatus) {
        updates.payment_status = paymentStatus;
        if (paymentStatus === 'completed') {
          updates.verified_at = new Date().toISOString();
        }
      }
      if (proofImageUrl) updates.proof_image_url = proofImageUrl;

      const { data, error } = await supabase.from('winners').update(updates).eq('id', winnerId).select();
      if (error) throw error;

      // If verification status is approved, update user total winnings in profile
      if (verificationStatus === 'approved' && data[0]) {
        const winner = data[0];
        const { data: profile } = await supabase.from('profiles').select('total_winnings').eq('id', winner.user_id).single();
        if (profile) {
          const newWinnings = parseFloat(profile.total_winnings || 0) + parseFloat(winner.prize_amount);
          await supabase.from('profiles').update({ total_winnings: newWinnings, payment_status: 'pending' }).eq('id', winner.user_id);
        }
      }

      if (paymentStatus === 'completed' && data[0]) {
        const winner = data[0];
        await supabase.from('profiles').update({ payment_status: 'paid' }).eq('id', winner.user_id);
      }

      return data[0];
    } else {
      const data = readMockDb();
      const idx = data.winners.findIndex(w => w.id === winnerId);
      if (idx !== -1) {
        if (verificationStatus) data.winners[idx].verification_status = verificationStatus;
        if (paymentStatus) {
          data.winners[idx].payment_status = paymentStatus;
          if (paymentStatus === 'completed') {
            data.winners[idx].verified_at = new Date().toISOString();
          }
        }
        if (proofImageUrl) data.winners[idx].proof_image_url = proofImageUrl;

        // Sync to profiles for mock database
        const winner = data.winners[idx];
        const profileIdx = data.profiles.findIndex(p => p.id === winner.user_id);
        if (profileIdx !== -1) {
          if (verificationStatus === 'approved') {
            data.profiles[profileIdx].total_winnings = parseFloat(data.profiles[profileIdx].total_winnings || 0) + parseFloat(winner.prize_amount);
            data.profiles[profileIdx].payment_status = 'pending';
          }
          if (paymentStatus === 'completed') {
            data.profiles[profileIdx].payment_status = 'paid';
          }
        }

        writeMockDb(data);
        return data.winners[idx];
      }
      return null;
    }
  }
};

module.exports = db;
