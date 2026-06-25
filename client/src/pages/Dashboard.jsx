import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, BACKEND_URL } from '../App';
import { Heart, Coins, Trophy, Calendar, Sparkles, Plus, Trash2, Edit2, UploadCloud, CheckCircle, CreditCard, ChevronRight, X, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user, token, refreshUser } = useContext(AuthContext);
  
  // Local state
  const [scores, setScores] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winners, setWinners] = useState([]);
  const [jackpotPool, setJackpotPool] = useState(1000);
  const [loading, setLoading] = useState(true);

  // Forms and Modals
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreIdToEdit, setScoreIdToEdit] = useState(null);
  const [scoreVal, setScoreVal] = useState('');
  const [scoreDate, setScoreDate] = useState('');
  const [scoreError, setScoreError] = useState('');

  // Donation percentage update
  const [donationPercentage, setDonationPercentage] = useState(10);
  const [updatingDonation, setUpdatingDonation] = useState(false);

  // Extra independent donation
  const [extraDonationVal, setExtraDonationVal] = useState('');
  const [showExtraDonationModal, setShowExtraDonationModal] = useState(false);
  
  // Checkout modal for inactive subscribers
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('monthly');
  const [cardNumber, setCardNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Upload proof
  const [selectedWinnerToVerify, setSelectedWinnerToVerify] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setDonationPercentage(user.donation_percentage || 10);
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch scores
      const scoresRes = await fetch(`${BACKEND_URL}/api/scores`, { headers });
      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setScores(data.scores);
      }

      // Fetch charities
      const charitiesRes = await fetch(`${BACKEND_URL}/api/charities`);
      if (charitiesRes.ok) {
        const data = await charitiesRes.json();
        setCharities(data.charities);
      }

      // Fetch user's wins
      const winnersRes = await fetch(`${BACKEND_URL}/api/winners`, { headers });
      if (winnersRes.ok) {
        const data = await winnersRes.json();
        setWinners(data.winners);
      }

      // Fetch jackpot
      const jackpotRes = await fetch(`${BACKEND_URL}/api/draws/current`);
      if (jackpotRes.ok) {
        const data = await jackpotRes.json();
        setJackpotPool(data.jackpotPool);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }

  // Handle score submission (Add or Edit)
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    setScoreError('');

    const val = parseInt(scoreVal);
    if (isNaN(val) || val < 1 || val > 45) {
      setScoreError('Stableford score must be between 1 and 45.');
      return;
    }

    if (!scoreDate) {
      setScoreError('Please select a valid date.');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      let res;
      if (scoreIdToEdit) {
        res = await fetch(`${BACKEND_URL}/api/scores/${scoreIdToEdit}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ score: val, date: scoreDate })
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/scores`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ score: val, date: scoreDate })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setScoreError(data.error || 'Failed to save score.');
      } else {
        setShowScoreModal(false);
        setScoreVal('');
        setScoreDate('');
        setScoreIdToEdit(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setScoreError('Error saving scorecard.');
    }
  };

  // Delete score
  const handleDeleteScore = async (id) => {
    if (!window.confirm('Are you sure you want to delete this score entry?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/scores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit score dialog
  const openEditScore = (scoreObj) => {
    setScoreIdToEdit(scoreObj.id);
    setScoreVal(scoreObj.score);
    // format date as YYYY-MM-DD
    const d = new Date(scoreObj.score_date);
    const dateString = d.toISOString().split('T')[0];
    setScoreDate(dateString);
    setScoreError('');
    setShowScoreModal(true);
  };

  // Update Donation allocation percentage
  const handleDonationPercentageChange = async (pct) => {
    setDonationPercentage(pct);
    setUpdatingDonation(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ donationPercentage: pct })
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingDonation(false);
    }
  };

  // Extra one-off Donation
  const handleExtraDonation = async (e) => {
    e.preventDefault();
    if (!extraDonationVal || parseFloat(extraDonationVal) <= 0) return;
    alert(`Thank you for your generous independent donation of $${extraDonationVal}! This goes directly to your selected charity.`);
    setExtraDonationVal('');
    setShowExtraDonationModal(false);
  };

  // Subscription Checkout simulator
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    // Simulate transaction delay
    setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subscriptionStatus: 'active',
            subscriptionPlan: checkoutPlan
          })
        });
        if (res.ok) {
          await refreshUser();
          setShowCheckoutModal(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingPayment(false);
      }
    }, 2000);
  };

  // Upload winner screenshot proof
  const handleProofSubmit = async (e) => {
    e.preventDefault();
    setUploadingProof(true);
    setUploadMessage('');

    if (!proofFile && !proofUrl) {
      setUploadMessage('Please choose a file or enter an image URL.');
      setUploadingProof(false);
      return;
    }

    try {
      const formData = new FormData();
      if (proofFile) {
        formData.append('screenshot', proofFile);
      } else {
        formData.append('proof_url', proofUrl);
      }

      const res = await fetch(`${BACKEND_URL}/api/winners/${selectedWinnerToVerify.id}/upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setUploadMessage('Verification proof uploaded! Admin will audit shortly.');
        setTimeout(() => {
          setSelectedWinnerToVerify(null);
          setProofFile(null);
          setProofUrl('');
          setUploadMessage('');
          fetchData();
          refreshUser();
        }, 2000);
      } else {
        setUploadMessage(data.error || 'Failed to upload proof.');
      }
    } catch (err) {
      console.error(err);
      setUploadMessage('Error uploading file.');
    } finally {
      setUploadingProof(false);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '15px 0' }}>Please log in to view your dashboard.</p>
        <button onClick={() => window.location.href = '/auth'} className="btn-primary">Go to Login</button>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <h2>System Administrator Account</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '5px 0' }}>
          Administrators do not participate in charity draws, enter scorecards, or purchase plans. Please use the Admin Console to manage system operations.
        </p>
        <button onClick={() => window.location.href = '/admin'} className="btn-primary" style={{ marginTop: '10px' }}>
          Go to Admin Console
        </button>
      </div>
    );
  }

  // Active status check
  const isSubscriber = user.subscription_status === 'active';
  const selectedCharity = charities.find(c => c.id === user.charity_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
      
      {/* Welcome Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '30px', 
          borderRadius: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.06) 0%, rgba(76, 175, 80, 0.06) 100%)'
        }}
        className="welcome-banner"
      >
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-charity)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hero Workspace
          </span>
          <h2 style={{ fontSize: '2rem', marginTop: '5px' }}>Welcome Back, {user.full_name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '5px' }}>
            {isSubscriber 
              ? `You are actively supporting ${selectedCharity ? selectedCharity.name : 'your chosen cause'} with ${donationPercentage}% of your subscription!`
              : 'Your subscription is currently inactive. Unlock full hero features below.'}
          </p>
        </div>

        {!isSubscriber && (
          <button onClick={() => setShowCheckoutModal(true)} className="btn-primary" style={{ padding: '12px 24px' }}>
            <CreditCard size={18} /> Unlock Membership
          </button>
        )}
      </div>

      {!isSubscriber && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: 'rgba(46, 125, 50, 0.03)' }}>
          <AlertTriangle size={36} color="var(--color-charity)" style={{ marginBottom: '15px' }} />
          <h3>Subscription Inactive</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '10px auto 20px' }}>
            Digital Heroes requires an active membership to compute scores and qualify you for the monthly reward prize pools. 50% of your fee funds local prizes, and 10%-50% flows directly to charity.
          </p>
          <button onClick={() => setShowCheckoutModal(true)} className="btn-primary">
            Activate My Hero Plan
          </button>
        </div>
      )}

      {isSubscriber && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px' }} className="dashboard-grid">
          
          {/* Left Column: Golf Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Stableford score cards */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Stableford Scorecards</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Latest 5 scores are kept. Newer scores replace oldest automatically.</p>
                </div>
                <button 
                  onClick={() => { setScoreIdToEdit(null); setScoreVal(''); setScoreDate(''); setScoreError(''); setShowScoreModal(true); }} 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', borderRadius: '30px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Enter Score
                </button>
              </div>

              {scores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <p>No scores entered yet. Enter your first Stableford golf scorecard (1 - 45) to qualify for the upcoming draw!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px 10px' }}>No.</th>
                        <th style={{ padding: '12px 10px' }}>Stableford Score</th>
                        <th style={{ padding: '12px 10px' }}>Date</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((s, index) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.95rem' }}>
                          <td style={{ padding: '16px 10px', color: 'var(--text-muted)' }}>{index + 1}</td>
                          <td style={{ padding: '16px 10px', fontWeight: 700 }}>
                            <span style={{
                              background: 'rgba(121, 40, 202, 0.1)',
                              color: '#d69e2e',
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>{s.score} pts</span>
                          </td>
                          <td style={{ padding: '16px 10px', color: 'var(--text-secondary)' }}>
                            {new Date(s.score_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                            <button onClick={() => openEditScore(s)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '15px' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteScore(s.id)} style={{ background: 'none', border: 'none', color: 'var(--color-charity)', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {scores.length === 5 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-charity)', marginTop: '15px', fontStyle: 'italic' }}>
                      ⚠️ Your score limit of 5 is reached. The next scorecard you submit will replace the oldest scorecard automatically.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Winnings & Verification Panel */}
            <div className="glass-panel" style={{ padding: '30px', background: 'radial-gradient(circle at top right, rgba(121, 40, 202, 0.07), rgba(0,0,0,0))' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins color="#ffd700" /> Winnings & Payment Status
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Prize Money Won</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '5px' }} className="gradient-text-reward">
                    ${user.total_winnings || '0.00'}
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payout Status</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '12px', textTransform: 'uppercase' }}>
                    {user.payment_status === 'paid' && <span style={{ color: '#00f2fe' }}>Completed (Paid)</span>}
                    {user.payment_status === 'pending' && <span style={{ color: '#ffd700' }}>Pending Verification</span>}
                    {user.payment_status === 'none' && <span style={{ color: 'var(--text-muted)' }}>No Winnings</span>}
                  </div>
                </div>
              </div>

              {/* Pending claims */}
              {winners.some(w => w.verification_status !== 'approved') && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--color-charity)', marginBottom: '10px' }}>Verify Your Winning Draw Scores</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    To comply with fair-play standards, please upload a screenshot of your official golf club app score matching the draw numbers.
                  </p>
                  
                  {winners.filter(w => w.verification_status !== 'approved').map(w => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(46, 125, 50, 0.05)', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Match-{w.match_type} Reward: ${w.prize_amount}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Draw Date: {new Date(w.draws?.draw_date || Date.now()).toLocaleDateString()}</div>
                      </div>
                      <button 
                        onClick={() => setSelectedWinnerToVerify(w)} 
                        className="btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--color-charity-gradient)' }}
                      >
                        <UploadCloud size={14} /> {w.proof_image_url ? 'Re-upload Proof' : 'Upload Proof'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Charity Allocation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Chosen Charity */}
            <div className="glass-panel" style={{ padding: '30px', background: 'radial-gradient(circle at bottom left, rgba(46, 125, 50, 0.07), rgba(0,0,0,0))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-charity)', marginBottom: '15px' }}>
                <Heart fill="var(--color-charity)" size={20} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Charity Support</h3>
              </div>

              {selectedCharity ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img 
                      src={selectedCharity.logo_url} 
                      alt={selectedCharity.name}
                      style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1.05rem' }}>{selectedCharity.name}</h4>
                      <Link to="/charities" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Change Charity Recipient</Link>
                    </div>
                  </div>

                  {/* Percentage Slider */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subscription Donation Cut</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-charity)' }}>{donationPercentage}%</span>
                    </div>
                    
                    <input 
                      type="range" 
                      min="10" 
                      max="50" 
                      value={donationPercentage} 
                      onChange={(e) => handleDonationPercentageChange(Number(e.target.value))}
                      disabled={updatingDonation}
                      style={{ width: '100%', accentColor: 'var(--color-charity)' }}
                    />
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                      Increase your pledge to allocate up to 50% of your membership directly to local aid.
                    </span>
                  </div>

                  {/* Independent extra donation */}
                  <button 
                    onClick={() => setShowExtraDonationModal(true)} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                  >
                    Make Extra Direct Donation
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>No charity selected. Support a cause to enable draw entry.</p>
                  <Link to="/charities" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Choose Charity</Link>
                </div>
              )}
            </div>

            {/* Participation Draw info */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Upcoming Draw Participation</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estimated Prize Pool</span>
                  <span style={{ fontWeight: 700 }}>${(jackpotPool || 1000).toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Draw Date</span>
                  <span style={{ fontWeight: 600 }}>July 31, 2026</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Your Draw Numbers</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-charity)' }}>
                    {scores.length > 0 ? scores.map(s => s.score).join(', ') : 'None submitted'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Qualification Status</span>
                  <span style={{ fontWeight: 700, color: scores.length >= 1 ? '#2e7d32' : '#d32f2f' }}>
                    {scores.length >= 1 ? 'QUALIFIED' : 'SUBMIT SCORES TO ENTER'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Score input Modal */}
      <AnimatePresence>
        {showScoreModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '450px', padding: '30px', margin: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{scoreIdToEdit ? 'Modify Golf Scorecard' : 'Add Stableford Score'}</h3>
                <button onClick={() => setShowScoreModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleScoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stableford Score (1 - 45)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="45" 
                    className="glass-input"
                    value={scoreVal}
                    onChange={(e) => setScoreVal(e.target.value)}
                    placeholder="Enter Stableford points"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Scorecard Date</label>
                  <input 
                    type="date" 
                    className="glass-input"
                    value={scoreDate}
                    onChange={(e) => setScoreDate(e.target.value)}
                    required
                  />
                </div>

                {scoreError && (
                  <p style={{ color: 'var(--color-charity)', fontSize: '0.85rem' }}>{scoreError}</p>
                )}

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Save Scorecard
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extra Donation Modal */}
      <AnimatePresence>
        {showExtraDonationModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justify: 'center', zIndex: 1000
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '400px', padding: '30px', margin: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Independent Extra Donation</h3>
                <button onClick={() => setShowExtraDonationModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleExtraDonation} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Donate directly to <strong>{selectedCharity?.name}</strong>. This transaction will be processed independently of your membership fee.
                </p>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Donation Amount ($USD)</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="glass-input"
                    value={extraDonationVal}
                    onChange={(e) => setExtraDonationVal(e.target.value)}
                    placeholder="Enter amount (e.g. 50)"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Complete Donation
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout/Subscription Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justify: 'center', zIndex: 1000
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '500px', padding: '30px', margin: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Stripe Premium Checkout</h3>
                <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Plan Choices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div 
                    onClick={() => setCheckoutPlan('monthly')}
                    style={{ 
                      padding: '15px', 
                      borderRadius: '12px', 
                      border: `2px solid ${checkoutPlan === 'monthly' ? 'var(--color-charity)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: checkoutPlan === 'monthly' ? 'rgba(255, 51, 102, 0.05)' : 'none'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700 }}>Monthly</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>$29.00 / mo</span>
                  </div>
                  
                  <div 
                    onClick={() => setCheckoutPlan('yearly')}
                    style={{ 
                      padding: '15px', 
                      borderRadius: '12px', 
                      border: `2px solid ${checkoutPlan === 'yearly' ? 'var(--color-charity)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: checkoutPlan === 'yearly' ? 'rgba(255, 51, 102, 0.05)' : 'none'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700 }}>Yearly (Save 20%)</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>$240.00 / yr</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Credit Card Number</label>
                  <input 
                    type="text" 
                    className="glass-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Expiry Date</label>
                    <input type="text" className="glass-input" placeholder="MM / YY" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>CVC Code</label>
                    <input type="text" className="glass-input" placeholder="123" required />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={processingPayment}>
                  {processingPayment ? 'Processing Secure Stripe Checkout...' : 'Confirm Subscription & Support'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Winner Proof Modal */}
      <AnimatePresence>
        {selectedWinnerToVerify && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justify: 'center', zIndex: 1000
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '450px', padding: '30px', margin: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Upload Score Verification Proof</h3>
                <button onClick={() => setSelectedWinnerToVerify(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleProofSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Submit proof for Match-{selectedWinnerToVerify.match_type} reward: <strong>${selectedWinnerToVerify.prize_amount}</strong>
                </p>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Screenshot Image File</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    style={{ color: '#fff', display: 'block', margin: '10px 0' }}
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>— OR —</div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Screenshot URL link</label>
                  <input 
                    type="text" 
                    className="glass-input"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://example.com/scores-screenshot.png"
                  />
                </div>

                {uploadMessage && (
                  <p style={{ color: 'var(--color-charity)', fontSize: '0.85rem', fontWeight: 600 }}>{uploadMessage}</p>
                )}

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={uploadingProof}>
                  {uploadingProof ? 'Uploading...' : 'Submit Winner Proof'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
