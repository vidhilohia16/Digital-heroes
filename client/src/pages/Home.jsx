import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Coins, ArrowRight, Sparkles, Trophy, Calendar, Filter } from 'lucide-react';
import { BACKEND_URL } from '../App';

export default function Home() {
  const [subAmount, setSubAmount] = useState(30); // Default subscription slider value
  const [charityPercentage, setCharityPercentage] = useState(25); // Default charity percentage slider
  const [spotlightCharity, setSpotlightCharity] = useState(null);
  const [currentJackpot, setCurrentJackpot] = useState(1000);
  const [activeCount, setActiveCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch spotlight charity
    fetch(`${BACKEND_URL}/api/charities/spotlight`)
      .then(res => res.json())
      .then(data => {
        if (data.charities && data.charities.length > 0) {
          setSpotlightCharity(data.charities[0]);
        }
      })
      .catch(err => console.error('Error fetching spotlight charity:', err));

    // Fetch current jackpot status
    fetch(`${BACKEND_URL}/api/draws/current`)
      .then(res => res.json())
      .then(data => {
        setCurrentJackpot(data.jackpotPool || 1000);
        setActiveCount(data.activeSubscribers || 0);
      })
      .catch(err => console.error('Error fetching jackpot statistics:', err));
  }, []);

  // Impact Calculations
  const monthlyCharityContribution = (subAmount * (charityPercentage / 100)).toFixed(2);
  const monthlyPrizeContribution = (subAmount * 0.50).toFixed(2); // 50% flat goes to base reward engine
  const monthlyPlatformFee = (subAmount - parseFloat(monthlyCharityContribution) - parseFloat(monthlyPrizeContribution)).toFixed(2);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '80px', marginTop: '40px' }}
    >
      {/* Hero Section - Save the Children Concept Banner */}
      <section 
        style={{ 
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          minHeight: '440px',
          display: 'grid',
          gridTemplateColumns: '1fr',
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.15) 100%), url('/bg-children.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(46, 125, 50, 0.2)',
          boxShadow: '0 12px 40px rgba(46, 125, 50, 0.12)'
        }} 
        className="hero-grid"
      >
        {/* Left emotional messaging side */}
        <div className="hero-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(76, 175, 80, 0.25)', padding: '6px 16px', borderRadius: '50px', width: 'fit-content' }}>
            <Heart size={14} color="#81c784" fill="#81c784" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5d6a7', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Golf with a Purpose</span>
          </div>
          
          <h1 className="hero-title">
            Halt the horror,<br />
            <span style={{ color: '#81c784' }}>Heal the hurt.</span>
          </h1>
          
          <p className="hero-description">
            Your donation will protect children from abuse and violence, providing access to adaptive sports, nature reserves, and direct local aid.
          </p>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }} className="hero-ctas">
            <button onClick={() => navigate('/auth')} className="btn-primary" style={{ padding: '14px 28px', border: 'none' }}>
              Become a Hero <ArrowRight size={18} />
            </button>
            <Link to="/charities" className="btn-secondary" style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
              Explore Causes
            </Link>
          </div>
        </div>
      </section>

      {/* Horizontal Prize Pool Banner - Moved from right side of hero section to prevent covering children's faces */}
      <div 
        className="glass-panel hero-stats-banner" 
        style={{ 
          zIndex: 3,
          position: 'relative'
        }}
      >
        <div className="stats-banner-info">
          <div style={{ background: 'rgba(46, 125, 50, 0.1)', padding: '12px', borderRadius: '16px', color: 'var(--color-charity)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={32} color="var(--color-charity)" style={{ filter: 'drop-shadow(0 0 8px rgba(46, 125, 50, 0.2))' }} />
          </div>
          <div className="stats-banner-text">
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Next Monthly Prize Draw</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match Stableford scores to win split pools!</p>
          </div>
        </div>

        <div className="stats-banner-data">
          <div className="stats-data-item">
            <span className="stats-data-label">Active Jackpot</span>
            <span className="stats-data-value text-green">${currentJackpot}</span>
          </div>

          <div className="stats-data-item stats-data-item-divider">
            <span className="stats-data-label">Active Heroes</span>
            <span className="stats-data-value">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Emotional Impact Calculator */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '2.25rem' }}>The Impact Calculator</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Adjust your monthly membership contribution details. See how your pledge converts to instant charity impact vs draw rewards.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }} className="calc-grid">
          {/* Sliders panel */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 600 }}>Monthly Subscription Fee</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.25rem' }}>${subAmount} / mo</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="150" 
                value={subAmount} 
                onChange={(e) => setSubAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-charity)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                <span>$10 min</span>
                <span>$150 max</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 600 }}>Charity Donation Allocation</span>
                <span style={{ fontWeight: 800, color: 'var(--color-charity)', fontSize: '1.25rem' }}>{charityPercentage}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="50" 
                value={charityPercentage} 
                onChange={(e) => setCharityPercentage(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-charity)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                <span>10% Required Min</span>
                <span>50% Max Allocation</span>
              </div>
            </div>
          </div>

          {/* Visual outcome panel */}
          <div className="glass-panel" style={{ padding: '30px', background: 'rgba(46, 125, 50, 0.02)', display: 'flex', flexDirection: 'column', justify: 'center', gap: '25px' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Your Hero Contribution Breakdown</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'rgba(46, 125, 50, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--color-charity)' }}>
                <Heart size={24} fill="var(--color-charity)" />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Direct to Chosen Charity</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>${monthlyCharityContribution} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ month</span></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'rgba(46, 125, 50, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--color-reward)' }}>
                <Coins size={24} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contributed to Monthly Prize Pools</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>${monthlyPrizeContribution} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ month</span></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '12px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Platform Operations Fee</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${monthlyPlatformFee} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ month</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured/Spotlight Charity Section */}
      {spotlightCharity && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2rem' }}>Spotlight Cause</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>The charity in focus this month receiving premium community aid.</p>
            </div>
            <Link to="/charities" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
              View Directory
            </Link>
          </div>

          <div 
            className="glass-panel" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1.2fr', 
              overflow: 'hidden', 
              borderRadius: '24px',
              minHeight: '350px' 
            }} 
            className="spotlight-card"
          >
            <div style={{ 
              backgroundImage: `url(${spotlightCharity.banner_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '250px'
            }}></div>
            
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46, 125, 50, 0.1)', padding: '4px 12px', borderRadius: '50px', width: 'fit-content' }}>
                <Heart size={12} color="var(--color-charity)" fill="var(--color-charity)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charity)', textTransform: 'uppercase' }}>Featured Charity</span>
              </div>

              <h3 style={{ fontSize: '1.75rem' }}>{spotlightCharity.name}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {spotlightCharity.description}
              </p>

              {spotlightCharity.upcoming_events && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    <Calendar size={14} color="var(--color-charity)" /> Upcoming Charity Projects
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {spotlightCharity.upcoming_events}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Grid: How It Works */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '45px' }}>
        <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>How Digital Heroes Works</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' }} className="how-it-works-grid">
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              background: 'rgba(46, 125, 50, 0.1)',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-charity)'
            }}>
              <Heart size={24} fill="var(--color-charity)" />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>1. Subscribe & Support</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Choose a monthly or yearly plan. Select your favorite charity in our directory and allocate 10% to 50% of your fee directly to them.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              background: 'rgba(46, 125, 50, 0.1)',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-reward)'
            }}>
              <Trophy size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>2. Record Golf Scores</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Log your latest golf scorecards (Stableford format 1-45). The platform keeps your 5 most recent scores, automatically rolling out older entries.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              background: 'rgba(46, 125, 50, 0.1)',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-charity)'
            }}>
              <Coins size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>3. The Prize Draw</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Your 5 scores serve as your draw numbers. Match 3, 4, or 5 numbers in the monthly draw to win splits of the rollover jackpots!
            </p>
          </div>
        </div>
      </section>

      {/* Embed responsive media styles */}
      <style>{`
        .hero-content {
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 20px;
          color: white;
          z-index: 2;
          text-align: left;
          max-width: 600px;
        }
        .hero-title {
          font-size: 3rem;
          line-height: 1.15;
          font-weight: 800;
          color: white;
          font-family: var(--font-display);
        }
        .hero-description {
          color: #e2e8f0;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        .hero-stats-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 40px;
          border-radius: 24px;
          width: 94%;
          margin: -35px auto 0 auto;
          gap: 20px;
          flex-wrap: wrap;
        }
        .stats-banner-info {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 280px;
          flex: 1;
        }
        .stats-banner-data {
          display: flex;
          align-items: center;
          gap: 40px;
        }
        .stats-data-item {
          display: flex;
          flex-direction: column;
        }
        .stats-data-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .stats-data-value {
          font-size: 2.25rem;
          font-weight: 900;
          color: var(--text-secondary);
          display: block;
          line-height: 1.1;
        }
        .stats-data-value.text-green {
          color: var(--color-charity);
        }
        .stats-data-item-divider {
          border-left: 1px solid var(--border-color);
          padding-left: 40px;
        }

        @media (max-width: 900px) {
          .hero-content {
            padding: 40px 20px !important;
            text-align: center !important;
            align-items: center !important;
          }
          .hero-title {
            font-size: 2.25rem !important;
          }
          .hero-description {
            font-size: 0.95rem !important;
          }
          .hero-stats-banner {
            flex-direction: column;
            text-align: center;
            width: 100%;
            margin: 20px 0 0 0;
            padding: 20px;
          }
          .stats-banner-info {
            flex-direction: column;
            min-width: unset;
            width: 100%;
            gap: 10px;
          }
          .stats-banner-text {
            text-align: center;
          }
          .stats-banner-data {
            width: 100%;
            justify-content: space-around;
            gap: 20px;
            margin-top: 10px;
          }
          .stats-data-item {
            align-items: center;
          }
          .stats-data-item-divider {
            border-left: none;
            padding-left: 0;
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid div {
            align-items: center;
          }
          .hero-ctas {
            justify-content: center;
            flex-direction: row;
          }
          .calc-grid {
            grid-template-columns: 1fr !important;
          }
          .spotlight-card {
            grid-template-columns: 1fr !important;
          }
          .how-it-works-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .hero-ctas {
            flex-direction: column !important;
            width: 100%;
            gap: 10px !important;
          }
          .hero-ctas button, .hero-ctas a {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
}
