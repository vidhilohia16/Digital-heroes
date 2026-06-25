-- Schema for Digital Heroes Platform (Supabase PostgreSQL)

-- 1. Charities Table
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  upcoming_events TEXT, -- JSON-formatted or simple text summary of events
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles Table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'subscriber', -- 'subscriber' or 'admin'
  subscription_status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'lapsed'
  subscription_plan VARCHAR(50), -- 'monthly', 'yearly'
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  donation_percentage INT DEFAULT 10, -- min 10%
  total_winnings NUMERIC(10, 2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'none', -- 'none', 'pending', 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Golf Scores Table (latest 5 scores range 1-45, unique date per user)
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INT NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_date UNIQUE (user_id, score_date)
);

-- 4. Draws Table (Monthly draw logs)
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date DATE NOT NULL DEFAULT CURRENT_DATE,
  winning_numbers INT[] NOT NULL, -- e.g. ARRAY[5, 12, 28, 34, 42]
  logic_used VARCHAR(50) DEFAULT 'random', -- 'random' or 'algorithmic'
  total_subscribers INT DEFAULT 0,
  total_pool NUMERIC(10, 2) DEFAULT 0.00,
  jackpot_rolled_over NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Winners Table (Draw winners)
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_type INT NOT NULL, -- 3, 4, or 5
  prize_amount NUMERIC(10, 2) NOT NULL,
  proof_image_url TEXT, -- Screenshot upload of golf scores
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed'
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert seed data for charities
INSERT INTO charities (name, description, logo_url, banner_url, upcoming_events, is_featured)
VALUES 
('Green Fairways Initiative', 'Providing urban youth access to golf equipment, mentorship, and life-skills education through golf.', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800', 'Youth Golf Clinic - July 12th; Charity Scramble - August 5th', true),
('Hearts & Handicaps', 'Supporting golf tournaments for physically challenged and veteran adaptive golf programs.', 'https://images.unsplash.com/photo-1469571486090-7db333894b2a?auto=format&fit=crop&q=80&w=200', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800', 'Veterans Golf Open - July 20th; Adaptive Equipment Clinic - Sept 3rd', false),
('Eco-Links Foundation', 'Partnering with golf courses globally to restore natural wildlife habitats and implement eco-friendly water management.', 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&q=80&w=200', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800', 'Sustainable Turf Workshop - August 15th', false);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Option A: Quick Dev Mode (Disable RLS for ease of local testing)
-- Run these if you want to bypass all RLS checks during development:
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE charities DISABLE ROW LEVEL SECURITY;
ALTER TABLE draws DISABLE ROW LEVEL SECURITY;
ALTER TABLE winners DISABLE ROW LEVEL SECURITY;

-- Option B: Secure Mode (Enable RLS with policies)
-- Uncomment these if you want to enforce strict access rules:
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Profiles: read/write own profile, public inserts during signup
CREATE POLICY "Allow individual read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow individual update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert during signup" ON profiles FOR INSERT WITH CHECK (true);

-- Golf Scores: read/write own scores only
CREATE POLICY "Allow individual scores read" ON golf_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individual scores insert" ON golf_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual scores update" ON golf_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow individual scores delete" ON golf_scores FOR DELETE USING (auth.uid() = user_id);

-- Charities/Draws: read access to everyone, write access to admin
CREATE POLICY "Allow public select charities" ON charities FOR SELECT USING (true);
CREATE POLICY "Allow public select draws" ON draws FOR SELECT USING (true);

-- Winners: read access to own or admin, write access to admin
CREATE POLICY "Allow select own winnings" ON winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert winners" ON winners FOR INSERT WITH CHECK (true);
*/

