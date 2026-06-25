import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart, MapPin, Calendar, Sparkles, Check } from 'lucide-react';
import { AuthContext, BACKEND_URL } from '../App';

export default function Charities() {
  const { user, token, refreshUser } = useContext(AuthContext);
  const [charities, setCharities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCharities();
  }, [searchQuery]);

  const fetchCharities = async () => {
    try {
      const url = searchQuery 
        ? `${BACKEND_URL}/api/charities?query=${encodeURIComponent(searchQuery)}`
        : `${BACKEND_URL}/api/charities`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCharities(data.charities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharity = async (charityId) => {
    if (!user) {
      alert('Please sign in or create an account to allocate your donation subscription.');
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ charityId })
      });
      
      if (res.ok) {
        await refreshUser();
        setMessage('Charity selected successfully! Your subscription cuts will flow here.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update selection.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '20px' }}
    >
      {/* Directory Title */}
      <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ fontSize: '2.5rem' }}>Charity Directory</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Explore non-profit initiatives supporting community development, environmental protection, and adaptive sports programs.
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            placeholder="Search charities by keyword or initiative name..." 
            className="glass-input"
            style={{ paddingLeft: '50px', borderRadius: '50px', height: '50px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div className="glass-panel" style={{ padding: '15px 25px', color: 'var(--color-charity)', textAlign: 'center', background: 'rgba(46, 125, 50, 0.08)', borderRadius: '50px', maxWidth: '500px', margin: '0 auto' }}>
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {message}
        </div>
      )}

      {/* Directory List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading causes...</div>
      ) : charities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          No charities match your search query. Try another keyword.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {charities.map(charity => {
            const isSelected = user && user.charity_id === charity.id;
            
            return (
              <motion.div 
                key={charity.id} 
                className="glass-panel" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 2fr', 
                  overflow: 'hidden', 
                  borderRadius: '20px',
                  border: isSelected ? '1px solid var(--color-charity)' : '1px solid var(--border-color)',
                  boxShadow: isSelected ? '0 0 20px rgba(46, 125, 50, 0.15)' : 'var(--glass-shadow)'
                }}
                className="charity-card-row"
              >
                {/* Banner/Image column */}
                <div style={{ 
                  backgroundImage: `url(${charity.banner_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px'
                }}></div>

                {/* Content details column */}
                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                      <h3 style={{ fontSize: '1.5rem' }}>{charity.name}</h3>
                      {isSelected && (
                        <span style={{ 
                          background: 'rgba(46, 125, 50, 0.08)', 
                          color: 'var(--color-charity)', 
                          padding: '4px 12px', 
                          borderRadius: '50px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap'
                        }}>
                          Active Target
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginTop: '10px' }}>
                      {charity.description}
                    </p>
                  </div>

                  {charity.upcoming_events && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(255,255,255,0.01)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-charity)', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' }}>
                        <Calendar size={12} /> Upcoming Projects & Events
                      </span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{charity.upcoming_events}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleSelectCharity(charity.id)} 
                      className={isSelected ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '10px 24px', fontSize: '0.85rem', borderRadius: '30px' }}
                      disabled={isSelected}
                    >
                      {isSelected ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> Active Recipient</span>
                      ) : (
                        <span>Select to Support</span>
                      )}
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .charity-card-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
