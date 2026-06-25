import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, BACKEND_URL } from '../App';
import { 
  Shield, Trophy, Users, Heart, Coins, Check, X, Plus, 
  Trash2, Edit2, Play, BarChart2, CheckCircle2, AlertCircle, FileSpreadsheet, 
  UploadCloud, Calendar, Eye, Edit3, Activity, HelpCircle, ArrowRight,
  UserCheck, DollarSign, HeartHandshake, RotateCcw
} from 'lucide-react';

export default function Admin() {
  const { user, token } = useContext(AuthContext);
  
  // Console Tab Management: 'analytics', 'users', 'draws', 'charities', 'winners'
  const [activeTab, setActiveTab] = useState('analytics');

  // Reports and Statistics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    totalPrizePool: 0,
    charityContributions: 0,
    activeJackpot: 1000
  });

  // DB States
  const [usersList, setUsersList] = useState([]);
  const [charities, setCharities] = useState([]);
  const [claims, setClaims] = useState([]);
  const [drawHistory, setDrawHistory] = useState([]);

  // Search filter for users
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Draw simulation state
  const [drawLogic, setDrawLogic] = useState('random');
  const [simResults, setSimResults] = useState(null);
  const [runningSim, setRunningSim] = useState(false);
  const [publishingDraw, setPublishingDraw] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  // User Profile Modifier Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    role: 'subscriber',
    subscriptionStatus: 'inactive',
    subscriptionPlan: 'monthly',
    charityId: ''
  });

  // User Score Manager Modals
  const [showScoresEditorModal, setShowScoresEditorModal] = useState(false);
  const [selectedUserForScores, setSelectedUserForScores] = useState(null);
  const [userScores, setUserScores] = useState([]);
  const [newScoreVal, setNewScoreVal] = useState('');
  const [newScoreDate, setNewScoreDate] = useState('');
  const [scoreEditorError, setScoreEditorError] = useState('');

  // Charity Manager Modals
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [charityIdToEdit, setCharityIdToEdit] = useState(null);
  const [charityForm, setCharityForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    upcomingEvents: '',
    isFeatured: false
  });

  // Verification Proof Image Modal
  const [selectedProofImg, setSelectedProofImg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadAllAdminData();
  }, [user]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'success' }), 4000);
  };

  async function loadAllAdminData() {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch charities
      const charRes = await fetch(`${BACKEND_URL}/api/charities`);
      let loadedCharities = [];
      if (charRes.ok) {
        const data = await charRes.json();
        setCharities(data.charities || []);
        loadedCharities = data.charities || [];
      }

      // Fetch claims/winners
      const claimsRes = await fetch(`${BACKEND_URL}/api/winners`, { headers });
      let loadedClaims = [];
      if (claimsRes.ok) {
        const data = await claimsRes.json();
        setClaims(data.winners || []);
        loadedClaims = data.winners || [];
      }

      // Fetch draw logs
      const drawHistoryRes = await fetch(`${BACKEND_URL}/api/draws`);
      let loadedDraws = [];
      if (drawHistoryRes.ok) {
        const data = await drawHistoryRes.json();
        setDrawHistory(data.draws || []);
        loadedDraws = data.draws || [];
      }

      // Fetch current draw stats
      const statsRes = await fetch(`${BACKEND_URL}/api/draws/current`);
      let currentJp = 1000;
      if (statsRes.ok) {
        const data = await statsRes.json();
        currentJp = data.jackpotPool || 1000;
      }

      // Fetch users list
      const usersRes = await fetch(`${BACKEND_URL}/api/auth/users`, { headers });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        const users = uData.users || [];
        setUsersList(users);
        
        // Metrics Calculation
        const activeSubsCount = users.filter(u => u.subscription_status === 'active').length;
        const totalPrizeSpent = loadedDraws.reduce((acc, curr) => acc + parseFloat(curr.total_pool || 0), 0);
        
        const totalCharityContributions = users.reduce((acc, curr) => {
          if (curr.subscription_status === 'active') {
            const fee = curr.subscription_plan === 'yearly' ? 20.00 : 29.00;
            return acc + (fee * ((curr.donation_percentage || 10) / 100));
          }
          return acc;
        }, 0);

        setMetrics({
          totalUsers: users.length,
          activeSubscribers: activeSubsCount,
          totalPrizePool: totalPrizeSpent,
          charityContributions: totalCharityContributions,
          activeJackpot: currentJp
        });
      }
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
    }
  }

  // Draw Management Handlers
  const handleSimulateDraw = async () => {
    setRunningSim(true);
    setSimResults(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/draws/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logic: drawLogic })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
        showNotification('Simulation runs completed. Review outcomes below.', 'success');
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || 'Failed to simulate draw.', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Network error occurred during simulation.', 'error');
    } finally {
      setRunningSim(false);
    }
  };

  const handlePublishDraw = async () => {
    if (!window.confirm('WARNING: Confirmed draw publish results will commit winner records to the database. Proceed?')) return;
    setPublishingDraw(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/draws/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logic: drawLogic })
      });
      if (res.ok) {
        showNotification('Monthly draw results published successfully!', 'success');
        setSimResults(null);
        loadAllAdminData();
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || 'Failed to publish draw.', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Network error occurred during publish.', 'error');
    } finally {
      setPublishingDraw(false);
    }
  };

  // Winners claim audit handlers
  const handleVerifyClaim = async (winnerId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/winners/${winnerId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showNotification(`Winner submission marked as ${status}.`, 'success');
        loadAllAdminData();
      } else {
        showNotification('Failed to verify submission.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkPaid = async (winnerId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/winners/${winnerId}/payout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        showNotification('Payout successfully completed.', 'success');
        loadAllAdminData();
      } else {
        showNotification('Failed to complete payout.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // User Profile Modifier
  const handleUserEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/${selectedUserForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setShowUserModal(false);
        showNotification('User profile settings updated.', 'success');
        loadAllAdminData();
      } else {
        showNotification('Failed to update user profile settings.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditUser = (userObj) => {
    setSelectedUserForEdit(userObj);
    setUserForm({
      fullName: userObj.full_name || '',
      role: userObj.role || 'subscriber',
      subscriptionStatus: userObj.subscription_status || 'inactive',
      subscriptionPlan: userObj.subscription_plan || 'monthly',
      charityId: userObj.charity_id || ''
    });
    setShowUserModal(true);
  };

  // User Score Manager
  const openScoresEditor = async (userObj) => {
    setSelectedUserForScores(userObj);
    setNewScoreVal('');
    setNewScoreDate('');
    setScoreEditorError('');
    setShowScoresEditorModal(true);
    await loadUserScores(userObj.id);
  };

  const loadUserScores = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/scores/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserScores(data.scores || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUserScore = async (e) => {
    e.preventDefault();
    setScoreEditorError('');
    const val = parseInt(newScoreVal);
    if (isNaN(val) || val < 1 || val > 45) {
      setScoreEditorError('Score must be between 1 and 45.');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/scores/user/${selectedUserForScores.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: val, date: newScoreDate })
      });
      const data = await res.json();
      if (res.ok) {
        setNewScoreVal('');
        setNewScoreDate('');
        showNotification('Stableford score added successfully.', 'success');
        await loadUserScores(selectedUserForScores.id);
      } else {
        setScoreEditorError(data.error || 'Failed to save score.');
      }
    } catch (err) {
      console.error(err);
      setScoreEditorError('Network error occurred.');
    }
  };

  const handleDeleteUserScore = async (scoreId) => {
    if (!window.confirm('Delete scorecard entry?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/scores/user/${selectedUserForScores.id}/${scoreId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Scorecard entry deleted.', 'success');
        await loadUserScores(selectedUserForScores.id);
      } else {
        showNotification('Failed to delete score.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Charity Manager Handlers
  const handleCharitySubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      let res;
      if (charityIdToEdit) {
        res = await fetch(`${BACKEND_URL}/api/charities/${charityIdToEdit}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(charityForm)
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/charities`, {
          method: 'POST',
          headers,
          body: JSON.stringify(charityForm)
        });
      }
      if (res.ok) {
        setShowCharityModal(false);
        setCharityForm({ name: '', description: '', logoUrl: '', bannerUrl: '', upcomingEvents: '', isFeatured: false });
        setCharityIdToEdit(null);
        showNotification(charityIdToEdit ? 'Charity profile modified.' : 'Charity profile created.', 'success');
        loadAllAdminData();
      } else {
        showNotification('Failed to save charity settings.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCharity = async (id) => {
    if (!window.confirm('Delete this charity profile? All subscriber links will be detached.')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/charities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Charity profile deleted.', 'success');
        loadAllAdminData();
      } else {
        showNotification('Failed to delete charity.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditCharity = (charity) => {
    setCharityIdToEdit(charity.id);
    setCharityForm({
      name: charity.name || '',
      description: charity.description || '',
      logoUrl: charity.logo_url || '',
      bannerUrl: charity.banner_url || '',
      upcomingEvents: charity.upcoming_events || '',
      isFeatured: charity.is_featured || false
    });
    setShowCharityModal(true);
  };

  // Access validation
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <AlertCircle size={50} color="var(--color-charity)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          System Administrator privileges are required to browse the cockpit workspace.
        </p>
        <button onClick={() => window.location.href = '/'} className="btn-secondary">Return Home</button>
      </div>
    );
  }

  // Filtered users for search query
  const filteredUsersList = usersList.filter(u => {
    const q = userSearchQuery.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: '40px',
      marginTop: '20px',
      alignItems: 'start'
    }} className="admin-console-grid">
      
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              right: '40px',
              padding: '16px 24px',
              borderRadius: '12px',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: notification.type === 'error' ? '#842029' : '#0f5132',
              color: 'white',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              border: `1px solid ${notification.type === 'error' ? '#ea868f' : '#badbcc'}`,
              fontFamily: 'var(--font-display)',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={18} />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Sleek Admin Sidebar Panel */}
      <aside className="glass-panel" style={{
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '35px',
        position: 'sticky',
        top: '110px',
        borderRadius: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-charity)' }}>
            <Shield size={20} className="animate-pulse" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              System Terminal
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', marginTop: '8px', fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Cockpit</h3>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '14px 18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', transition: 'var(--transition-smooth)',
              background: activeTab === 'analytics' ? 'var(--color-fusion-gradient)' : 'none',
              color: activeTab === 'analytics' ? 'white' : 'var(--text-secondary)'
            }}
            className="sidebar-tab-btn"
          >
            <BarChart2 size={18} /> Reports & Analytics
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '14px 18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', transition: 'var(--transition-smooth)',
              background: activeTab === 'users' ? 'var(--color-fusion-gradient)' : 'none',
              color: activeTab === 'users' ? 'white' : 'var(--text-secondary)'
            }}
            className="sidebar-tab-btn"
          >
            <Users size={18} /> User Management
          </button>

          <button 
            onClick={() => setActiveTab('draws')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '14px 18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', transition: 'var(--transition-smooth)',
              background: activeTab === 'draws' ? 'var(--color-fusion-gradient)' : 'none',
              color: activeTab === 'draws' ? 'white' : 'var(--text-secondary)'
            }}
            className="sidebar-tab-btn"
          >
            <Play size={18} /> Draw Management
          </button>

          <button 
            onClick={() => setActiveTab('charities')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '14px 18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', transition: 'var(--transition-smooth)',
              background: activeTab === 'charities' ? 'var(--color-fusion-gradient)' : 'none',
              color: activeTab === 'charities' ? 'white' : 'var(--text-secondary)'
            }}
            className="sidebar-tab-btn"
          >
            <Heart size={18} /> Charity Management
          </button>

          <button 
            onClick={() => setActiveTab('winners')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '14px 18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', transition: 'var(--transition-smooth)',
              background: activeTab === 'winners' ? 'var(--color-fusion-gradient)' : 'none',
              color: activeTab === 'winners' ? 'white' : 'var(--text-secondary)'
            }}
            className="sidebar-tab-btn"
          >
            <Trophy size={18} /> Winners Management
            {claims.filter(c => c.verification_status === 'pending').length > 0 && (
              <span style={{
                background: 'var(--color-charity)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '50px',
                marginLeft: 'auto'
              }}>
                {claims.filter(c => c.verification_status === 'pending').length}
              </span>
            )}
          </button>
        </nav>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'var(--color-charity-gradient)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: 'white'
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Admin Console</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="admin-main-panel">
        
        {/* ================= REPORTS & ANALYTICS TAB ================= */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Reports & Analytics</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Global metrics, charity aid tracking, and draw pools statistics.</p>
            </div>
            
            {/* Metric widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ background: 'rgba(46, 125, 50, 0.08)', color: 'var(--color-charity)', padding: '14px', borderRadius: '16px' }}>
                  <Users size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</span>
                  <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>
                    {metrics.totalUsers} 
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({metrics.activeSubscribers} Subs)
                    </span>
                  </h4>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ background: 'rgba(27, 94, 32, 0.08)', color: 'var(--color-reward)', padding: '14px', borderRadius: '16px' }}>
                  <Trophy size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Jackpot</span>
                  <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>${metrics.activeJackpot.toLocaleString()}</h4>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ background: 'rgba(46, 125, 50, 0.08)', color: 'var(--color-charity)', padding: '14px', borderRadius: '16px' }}>
                  <Heart size={24} fill="var(--color-charity)" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Charity Aid (Est.)</span>
                  <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>${metrics.charityContributions.toFixed(2)}</h4>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ background: 'rgba(27, 94, 32, 0.08)', color: 'var(--color-reward)', padding: '14px', borderRadius: '16px' }}>
                  <Coins size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Prize Pool</span>
                  <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>${metrics.totalPrizePool.toFixed(2)}</h4>
                </div>
              </div>
            </div>

            {/* SVG Graph for Draw statistics */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Draw Statistics History</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pool distributions over the last 5 completed draws.</p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(46, 125, 50, 0.08)', padding: '4px 12px', borderRadius: '20px' }}>
                  Draw Pool Analytics
                </span>
              </div>
              
              {drawHistory.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <HelpCircle size={32} style={{ marginBottom: '10px' }} />
                  <p>No draw logs recorded in database yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    height: '200px', 
                    gap: '30px', 
                    padding: '10px 0', 
                    borderBottom: '1px solid var(--border-color)', 
                    margin: '0 auto', 
                    width: '100%', 
                    maxWidth: '600px' 
                  }}>
                    {drawHistory.slice(0, 5).reverse().map((d, idx) => {
                      const maxVal = Math.max(...drawHistory.map(h => parseFloat(h.total_pool || 1)));
                      const percent = ((parseFloat(d.total_pool) / (maxVal || 1)) * 100) || 15;
                      return (
                        <div key={d.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>${d.total_pool}</span>
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${percent}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            style={{
                              width: '100%',
                              background: 'var(--color-fusion-gradient)',
                              borderRadius: '8px 8px 0 0',
                              minHeight: '15px',
                              boxShadow: '0 4px 15px rgba(121, 40, 202, 0.25)',
                              position: 'relative'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, height: '4px',
                              background: 'rgba(255, 255, 255, 0.4)',
                              borderRadius: '8px 8px 0 0'
                            }} />
                          </motion.div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '10px', textAlign: 'center' }}>
                            {new Date(d.draw_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                    * Values reflect total subscriber subscription allocations allocated to each draw jackpot and tiers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= USER MANAGEMENT TAB ================= */}
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem' }}>User Management</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Audit system profile details, manage subscriber accounts, and edit golf scores.
                </p>
              </div>
              <div style={{ width: '100%', maxWidth: '300px' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '14px 10px' }}>Subscriber Profile</th>
                    <th style={{ padding: '14px 10px' }}>System Role</th>
                    <th style={{ padding: '14px 10px' }}>Billing Plan</th>
                    <th style={{ padding: '14px 10px' }}>Status</th>
                    <th style={{ padding: '14px 10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsersList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No records match the filter query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsersList.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '16px 10px' }}>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {u.full_name || 'N/A'}
                            {u.role === 'admin' && (
                              <span style={{ fontSize: '0.65rem', background: 'var(--color-charity)', color: 'white', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                Staff
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '16px 10px' }}>
                          <span style={{ 
                            background: u.role === 'admin' ? 'rgba(27, 94, 32, 0.08)' : 'rgba(46, 125, 50, 0.06)',
                            color: u.role === 'admin' ? 'var(--color-reward)' : 'var(--color-charity)',
                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: 600
                          }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '16px 10px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                          {u.subscription_plan ? `${u.subscription_plan} Plan` : 'None'}
                        </td>
                        <td style={{ padding: '16px 10px', fontWeight: 700 }}>
                          {u.subscription_status === 'active' && <span style={{ color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803d' }}></div> Active</span>}
                          {u.subscription_status === 'inactive' && <span style={{ color: 'var(--text-muted)' }}>Inactive</span>}
                          {u.subscription_status === 'lapsed' && <span style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#b45309' }}></div> Lapsed</span>}
                        </td>
                        <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => openEditUser(u)} 
                              className="btn-secondary" 
                              style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
                            >
                              <Edit3 size={14} /> Profile / Sub
                            </button>
                            <button 
                              onClick={() => openScoresEditor(u)} 
                              className="btn-primary" 
                              style={{ 
                                padding: '8px 14px', 
                                fontSize: '0.8rem', 
                                borderRadius: '8px', 
                                background: 'var(--color-charity-gradient)',
                                boxShadow: 'none'
                              }}
                              disabled={u.role === 'admin'}
                              title={u.role === 'admin' ? 'Admins cannot log scorecard entries.' : ''}
                            >
                              <FileSpreadsheet size={14} /> Edit Scores
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= DRAW MANAGEMENT TAB ================= */}
        {activeTab === 'draws' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }} className="admin-grid-2">
              
              {/* Draw Config Panel */}
              <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem' }}>Draw Management</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Configure target selection mechanics, run simulations, and commit final draw logs.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Target Number Generation Method
                  </label>
                  <select 
                    className="glass-input" 
                    value={drawLogic} 
                    onChange={(e) => setDrawLogic(e.target.value)}
                    style={{ color: 'var(--text-primary)', background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="random">Standard Random Selection (Equal Probabilities)</option>
                    <option value="algorithmic">Algorithmic Weighted Selection (Score-frequency weighted)</option>
                  </select>
                  <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.75rem' }}>
                    * Algorithmic weighting evaluates active subscriber Stableford frequencies and skews probabilities towards popular inputs.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button 
                    onClick={handleSimulateDraw} 
                    className="btn-secondary" 
                    disabled={runningSim} 
                    style={{ padding: '12px 22px', fontSize: '0.9rem', borderRadius: '30px' }}
                  >
                    <Activity size={16} /> {runningSim ? 'Running Calculations...' : 'Run Simulation'}
                  </button>
                  
                  {simResults && (
                    <button 
                      onClick={handlePublishDraw} 
                      className="btn-primary" 
                      disabled={publishingDraw} 
                      style={{ padding: '12px 22px', fontSize: '0.9rem', borderRadius: '30px' }}
                    >
                      <Play size={16} /> {publishingDraw ? 'Archiving results...' : 'Commit & Publish'}
                    </button>
                  )}
                </div>
              </div>

              {/* Simulation Result Report */}
              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Simulation Reports</h3>
                {!simResults ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                    <HelpCircle size={36} style={{ marginBottom: '12px', display: 'block', margin: '0 auto' }} />
                    <p style={{ fontSize: '0.85rem' }}>Execute a simulation dry run to calculate splits, rollover jackpots, and winners lists.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Drawn Winning Target Set:</span>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        {simResults.winningNumbers.map(n => (
                          <span 
                            key={n} 
                            style={{ 
                              background: 'var(--color-charity-gradient)', 
                              color: 'white', 
                              width: '40px', 
                              height: '40px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              borderRadius: '50%', 
                              fontWeight: 800, 
                              fontSize: '1rem',
                              boxShadow: '0 4px 10px rgba(46, 125, 50, 0.3)'
                            }}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '15px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Subscribers Pool Contribution:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>${simResults.totalPool.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>5-Match (Jackpot) Winners:</span>
                        <strong>{simResults.winners5.length} (${simResults.prize5PerWinner.toFixed(2)} ea)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>4-Match Winners:</span>
                        <strong>{simResults.winners4.length} (${simResults.prize4PerWinner.toFixed(2)} ea)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>3-Match Winners:</span>
                        <strong>{simResults.winners3.length} (${simResults.prize3PerWinner.toFixed(2)} ea)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.95rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Next Jackpot Rollover Seed:</span>
                        <span style={{ fontWeight: 800, color: 'var(--color-charity)' }}>${simResults.jackpotRolledOver.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Draw logs list */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Completed Draw Registers</h3>
              {drawHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.85rem' }}>No draw records found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px 10px' }}>Draw Date</th>
                        <th style={{ padding: '12px 10px' }}>Winning Target</th>
                        <th style={{ padding: '12px 10px' }}>Logic Config</th>
                        <th style={{ padding: '12px 10px' }}>Total Pool Size</th>
                        <th style={{ padding: '12px 10px' }}>Rollover Jackpot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawHistory.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>{new Date(d.draw_date).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-reward)', letterSpacing: '0.05em' }}>
                              {Array.isArray(d.winning_numbers) ? d.winning_numbers.join(', ') : d.winning_numbers}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px', textTransform: 'capitalize' }}>
                            <span style={{ background: 'rgba(46, 125, 50, 0.08)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {d.logic_used}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px', fontWeight: 600 }}>${d.total_pool}</td>
                          <td style={{ padding: '14px 10px', color: 'var(--color-charity)', fontWeight: 600 }}>${d.jackpot_rolled_over}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= CHARITY MANAGEMENT TAB ================= */}
        {activeTab === 'charities' && (
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem' }}>Charity Management</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Manage media contents, description profiles, and featured spotlight charities.
                </p>
              </div>
              <button 
                onClick={() => { 
                  setCharityIdToEdit(null); 
                  setCharityForm({ name: '', description: '', logoUrl: '', bannerUrl: '', upcomingEvents: '', isFeatured: false }); 
                  setShowCharityModal(true); 
                }} 
                className="btn-primary" 
                style={{ padding: '10px 18px', fontSize: '0.85rem', borderRadius: '30px' }}
              >
                <Plus size={16} /> Add Charity Cause
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 10px' }}>Charity Details</th>
                    <th style={{ padding: '12px 10px' }}>Spotlight Status</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No charities recorded. Click Add Charity Cause to start.
                      </td>
                    </tr>
                  ) : (
                    charities.map(charity => (
                      <tr key={charity.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 10px' }}>
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <img 
                              src={charity.logo_url || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200'} 
                              style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                              alt={charity.name} 
                            />
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{charity.name}</strong>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                {charity.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 10px' }}>
                          {charity.is_featured ? (
                            <span style={{ color: 'var(--color-charity)', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(46, 125, 50, 0.08)', padding: '4px 10px', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-charity)' }}></div> Featured Cause
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Standard List</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '12px' }}>
                            <button onClick={() => openEditCharity(charity)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Modify cause details">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteCharity(charity.id)} style={{ background: 'none', border: 'none', color: 'var(--color-charity)', cursor: 'pointer' }} title="Delete cause">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= WINNERS MANAGEMENT TAB ================= */}
        {activeTab === 'winners' && (
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem' }}>Winners Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '25px' }}>
                Review winner rosters, audit scorecard verification screenshots, and approve payouts.
              </p>
            </div>

            {claims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <HelpCircle size={36} style={{ marginBottom: '10px', display: 'block', margin: '0 auto' }} />
                <p>No historical winning matches recorded in the database yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '12px 10px' }}>Winner Name</th>
                      <th style={{ padding: '12px 10px' }}>Match Type</th>
                      <th style={{ padding: '12px 10px' }}>Prize Pool Payout</th>
                      <th style={{ padding: '12px 10px' }}>Proof Status</th>
                      <th style={{ padding: '12px 10px' }}>Verification Status</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '16px 10px' }}>
                          <div style={{ fontWeight: 700 }}>{c.profiles?.full_name || 'Subscriber Account'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{c.profiles?.email}</div>
                        </td>
                        <td style={{ padding: '16px 10px' }}>
                          <span style={{ background: 'rgba(27, 94, 32, 0.08)', color: 'var(--color-reward)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {c.match_type}-Number Match
                          </span>
                        </td>
                        <td style={{ padding: '16px 10px', fontWeight: 700, fontSize: '0.95rem' }}>${parseFloat(c.prize_amount).toFixed(2)}</td>
                        <td style={{ padding: '16px 10px' }}>
                          {c.proof_image_url ? (
                            <button 
                              onClick={() => setSelectedProofImg(c.proof_image_url)} 
                              className="btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                            >
                              <Eye size={12} /> View Screenshot
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No proof uploaded</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 10px', fontWeight: 700 }}>
                          {c.verification_status === 'approved' && <span style={{ color: '#15803d' }}>✓ Approved</span>}
                          {c.verification_status === 'pending' && <span style={{ color: '#b45309' }}>⌛ Pending Audit</span>}
                          {c.verification_status === 'rejected' && <span style={{ color: '#b91c1c' }}>✗ Rejected</span>}
                        </td>
                        <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                          {c.verification_status === 'pending' && c.proof_image_url && (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                onClick={() => handleVerifyClaim(c.id, 'approved')} 
                                style={{ background: '#0f5132', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleVerifyClaim(c.id, 'rejected')} 
                                style={{ background: '#842029', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {c.verification_status === 'approved' && c.payment_status === 'pending' && (
                            <button 
                              onClick={() => handleMarkPaid(c.id)} 
                              className="btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', boxShadow: 'none' }}
                            >
                              Mark Paid
                            </button>
                          )}
                          {c.payment_status === 'completed' && (
                            <span style={{ color: '#00f2fe', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0, 242, 254, 0.08)', padding: '4px 10px', borderRadius: '6px' }}>
                              Payout Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODALS & POPUPS ================= */}
      
      {/* 1. Admin Edit User Profile & subscription */}
      <AnimatePresence>
        {showUserModal && selectedUserForEdit && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '480px', padding: '35px', margin: '20px', background: 'var(--bg-surface-solid)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Edit User Settings</h3>
                <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUserEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>User Full Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={userForm.fullName} 
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} 
                    required 
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>System Role</label>
                    <select 
                      className="glass-input" 
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="subscriber">Subscriber</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Billing Plan</label>
                    <select 
                      className="glass-input" 
                      value={userForm.subscriptionPlan}
                      onChange={(e) => setUserForm({ ...userForm, subscriptionPlan: e.target.value })}
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="monthly">Monthly ($29.00)</option>
                      <option value="yearly">Yearly ($240.00)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Subscription Status</label>
                    <select 
                      className="glass-input" 
                      value={userForm.subscriptionStatus}
                      onChange={(e) => setUserForm({ ...userForm, subscriptionStatus: e.target.value })}
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="active">Active Subscriber</option>
                      <option value="inactive">Inactive</option>
                      <option value="lapsed">Lapsed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Allocated Cause</label>
                    <select 
                      className="glass-input" 
                      value={userForm.charityId}
                      onChange={(e) => setUserForm({ ...userForm, charityId: e.target.value })}
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">No Cause Selected</option>
                      {charities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px', borderRadius: '30px' }}>
                  Commit Settings Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Admin Scores Editor Modal */}
      <AnimatePresence>
        {showScoresEditorModal && selectedUserForScores && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '520px', padding: '35px', margin: '20px', maxHeight: '90%', overflowY: 'auto', background: 'var(--bg-surface-solid)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Edit Golf Scores</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subscriber: {selectedUserForScores.full_name}</span>
                </div>
                <button onClick={() => setShowScoresEditorModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Add Score Form */}
              <form onSubmit={handleAddUserScore} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '25px', borderBottom: '1px solid var(--border-color)', paddingBottom: '25px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Stableford Score (1-45)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="45" 
                    placeholder="36"
                    className="glass-input" 
                    value={newScoreVal} 
                    onChange={(e) => setNewScoreVal(e.target.value)} 
                    required 
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Scorecard Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    value={newScoreDate} 
                    onChange={(e) => setNewScoreDate(e.target.value)} 
                    required 
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '12px 18px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Add Score
                </button>
              </form>

              {scoreEditorError && (
                <div style={{
                  color: '#ea868f',
                  backgroundColor: 'rgba(234, 134, 143, 0.08)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(234, 134, 143, 0.2)',
                  marginBottom: '15px'
                }}>
                  {scoreEditorError}
                </div>
              )}

              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>Score History (Latest 5 Retained)</h4>
              {userScores.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '15px 0', textAlign: 'center' }}>No golf scorecards logged.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {userScores.map(sc => (
                    <div key={sc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: 'var(--color-charity)', marginRight: '10px', fontSize: '0.95rem' }}>{sc.score} Stableford pts</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(sc.score_date).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteUserScore(sc.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-charity)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Delete score entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Charity Profile Creator Modal */}
      <AnimatePresence>
        {showCharityModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '520px', padding: '35px', margin: '20px', overflowY: 'auto', maxHeight: '90%', background: 'var(--bg-surface-solid)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem' }}>{charityIdToEdit ? 'Modify Charity Profile' : 'Add New Charity'}</h3>
                <button onClick={() => setShowCharityModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCharitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Charity Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={charityForm.name} 
                    onChange={(e) => setCharityForm({ ...charityForm, name: e.target.value })} 
                    required 
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Description</label>
                  <textarea 
                    className="glass-input" 
                    rows="3" 
                    value={charityForm.description} 
                    onChange={(e) => setCharityForm({ ...charityForm, description: e.target.value })} 
                    required 
                    style={{ background: 'var(--bg-main)', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Logo Image URL</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={charityForm.logoUrl} 
                    onChange={(e) => setCharityForm({ ...charityForm, logoUrl: e.target.value })} 
                    placeholder="https://images.unsplash.com/photo-..."
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Banner Image URL</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={charityForm.bannerUrl} 
                    onChange={(e) => setCharityForm({ ...charityForm, bannerUrl: e.target.value })} 
                    placeholder="https://images.unsplash.com/photo-..."
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Upcoming Projects Summary</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={charityForm.upcomingEvents} 
                    onChange={(e) => setCharityForm({ ...charityForm, upcomingEvents: e.target.value })} 
                    placeholder="Youth golf clinics - August 12th"
                    style={{ background: 'var(--bg-main)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <input 
                    type="checkbox" 
                    id="isFeatured"
                    checked={charityForm.isFeatured} 
                    onChange={(e) => setCharityForm({ ...charityForm, isFeatured: e.target.checked })} 
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isFeatured" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    Featured Spotlight Cause (Renders on home page widget)
                  </label>
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px', borderRadius: '30px' }}>
                  Save Charity Profile Settings
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Proof Image Overlay Popup */}
      <AnimatePresence>
        {selectedProofImg && (
          <div 
            onClick={() => setSelectedProofImg('')}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 2000,
              padding: '20px',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}
            >
              <img 
                src={selectedProofImg.startsWith('http') ? selectedProofImg : `${BACKEND_URL}${selectedProofImg}`} 
                alt="Winner Proof Screenshot" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '85vh', 
                  borderRadius: '12px', 
                  border: '2px solid rgba(46, 125, 50, 0.4)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)' 
                }}
              />
              <div style={{
                position: 'absolute', top: '-40px', right: 0,
                color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span>Click anywhere to dismiss</span>
                <X size={18} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .sidebar-tab-btn:hover {
          background: rgba(46, 125, 50, 0.08) !important;
          color: var(--color-charity) !important;
        }
        @media (max-width: 990px) {
          .admin-console-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-console-grid aside {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
