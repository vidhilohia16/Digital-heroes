import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, BACKEND_URL } from '../App';
import { Heart, Coins, Shield, User, Lock, Mail, ChevronRight, ChevronLeft, CreditCard, Sparkles } from 'lucide-react';

export default function Auth() {
  const { login, token, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [authType, setAuthType] = useState('login'); // 'login', 'register', 'admin'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Registration Multi-Step Wizard
  const [step, setStep] = useState(1); // 1 = details, 2 = select charity, 3 = subscription plan
  const [charities, setCharities] = useState([]);
  const [selectedCharityId, setSelectedCharityId] = useState('');
  const [donationPercentage, setDonationPercentage] = useState(10);
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly', 'yearly', 'none'

  useEffect(() => {
    // If user is already authenticated, redirect appropriately
    if (token) {
      // Check role or default to dashboard
      const loadMe = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user?.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadMe();
    }

    // Fetch charities for registration dropdown
    fetch(`${BACKEND_URL}/api/charities`)
      .then(res => res.json())
      .then(data => {
        setCharities(data.charities || []);
        if (data.charities && data.charities.length > 0) {
          setSelectedCharityId(data.charities[0].id);
        }
      })
      .catch(err => console.error('Error fetching charities:', err));
  }, [token, navigate]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          charityId: selectedCharityId || null,
          donationPercentage,
          plan: selectedPlan === 'none' ? null : selectedPlan
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up.');
      }

      // Log the user in immediately after signup
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Sign up failed.');
      setStep(1); // Reset to first step to allow corrections
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '480px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}
      >
        {/* Logo/Greeting header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            background: 'var(--color-charity-gradient)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            boxShadow: '0 4px 15px rgba(46, 125, 50, 0.4)'
          }}>
            <Heart size={24} color="#fff" fill="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '10px' }}>
            {authType === 'login' && 'Welcome Back, Hero'}
            {authType === 'register' && 'Join the Digital Heroes'}
            {authType === 'admin' && 'Administrator Sign In'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {authType === 'login' && 'Log in to update scorecards and check winnings.'}
            {authType === 'register' && 'Complete details to begin supporting causes.'}
            {authType === 'admin' && 'Enter administrator credentials to access the console.'}
          </p>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', background: 'rgba(46, 125, 50, 0.04)', padding: '4px', borderRadius: '50px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button 
            type="button"
            onClick={() => { setAuthType('login'); setErrorMessage(''); }}
            style={{
              flex: 1, background: authType === 'login' ? 'var(--color-charity-gradient)' : 'none',
              border: 'none', color: authType === 'login' ? '#fff' : 'var(--text-secondary)', padding: '10px', borderRadius: '50px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem', transition: 'var(--transition-smooth)', whiteSpace: 'nowrap'
            }}
          >
            Member Login
          </button>
          <button 
            type="button"
            onClick={() => { setAuthType('admin'); setErrorMessage(''); }}
            style={{
              flex: 1, background: authType === 'admin' ? 'var(--color-charity-gradient)' : 'none',
              border: 'none', color: authType === 'admin' ? '#fff' : 'var(--text-secondary)', padding: '10px', borderRadius: '50px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem', transition: 'var(--transition-smooth)', whiteSpace: 'nowrap'
            }}
          >
            Admin Login
          </button>
          <button 
            type="button"
            onClick={() => { setAuthType('register'); setErrorMessage(''); setStep(1); }}
            style={{
              flex: 1, background: authType === 'register' ? 'var(--color-charity-gradient)' : 'none',
              border: 'none', color: authType === 'register' ? '#fff' : 'var(--text-secondary)', padding: '10px', borderRadius: '50px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem', transition: 'var(--transition-smooth)', whiteSpace: 'nowrap'
            }}
          >
            Register
          </button>
        </div>

        {errorMessage && (
          <p style={{ color: 'var(--color-charity)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>{errorMessage}</p>
        )}

        {/* Auth form containers */}
        {authType === 'login' && (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="glass-input" 
                style={{ paddingLeft: '45px' }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                className="glass-input" 
                style={{ paddingLeft: '45px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}

        {authType === 'admin' && (
          /* ADMIN LOGIN FORM */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="email" 
                placeholder="Admin Email Address" 
                className="glass-input" 
                style={{ paddingLeft: '45px' }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="password" 
                placeholder="Admin Password" 
                className="glass-input" 
                style={{ paddingLeft: '45px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px', background: 'var(--color-charity-gradient)' }} disabled={loading}>
              {loading ? 'Authenticating Admin...' : 'Authenticate Admin Session'}
            </button>

            {/* Demo Admin Help box */}
            <div 
              onClick={() => {
                setEmail('admin@digitalheroes.com');
                setPassword('adminpassword123');
              }}
              style={{
                marginTop: '15px',
                padding: '15px',
                borderRadius: '12px',
                background: 'rgba(46, 125, 50, 0.04)',
                border: '1px dashed rgba(46, 125, 50, 0.3)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition-smooth)'
              }}
              className="demo-admin-box"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                <Shield size={16} color="var(--color-charity)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Demo Admin Credentials (Click to Auto-fill)</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Email:</strong> <code>admin@digitalheroes.com</code></div>
                <div><strong>Password:</strong> <code>adminpassword123</code></div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                💡 Note: If signing in on Supabase for the first time, please create this user in your Supabase Auth dashboard with role 'admin' in profiles.
              </div>
            </div>
          </form>
        )}

        {authType === 'register' && (
          /* MULTI-STEP SIGNUP FORM */
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Step 1: Details */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="glass-input" 
                    style={{ paddingLeft: '45px' }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="glass-input" 
                    style={{ paddingLeft: '45px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} size={18} />
                  <input 
                    type="password" 
                    placeholder="Create Password" 
                    className="glass-input" 
                    style={{ paddingLeft: '45px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => { if (fullName && email && password) setStep(2); else setErrorMessage('Please fill in all fields.'); }} 
                  className="btn-primary" 
                  style={{ justifyContent: 'center', marginTop: '10px' }}
                >
                  Choose Charity Cause <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Step 2: Choose Charity */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Charity Recipient</label>
                  <select 
                    className="glass-input" 
                    value={selectedCharityId} 
                    onChange={(e) => setSelectedCharityId(e.target.value)}
                    style={{ color: 'var(--text-primary)', background: '#ffffff' }}
                  >
                    {charities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Donation Percentage Allocation</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-charity)' }}>{donationPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    value={donationPercentage} 
                    onChange={(e) => setDonationPercentage(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-charity)' }}
                  />
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                    Choose how much of your subscription flows directly to your charity (Min 10%, Max 50%).
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Pick Plan <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Subscription plan */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Activate your plan to qualify for monthly prize pools and support your cause.
                </p>

                {/* Plan options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div 
                    onClick={() => setSelectedPlan('monthly')}
                    style={{ 
                      padding: '15px', borderRadius: '12px', border: `2px solid ${selectedPlan === 'monthly' ? 'var(--color-charity)' : 'var(--border-color)'}`,
                      cursor: 'pointer', background: selectedPlan === 'monthly' ? 'rgba(46, 125, 50, 0.05)' : 'none'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700 }}>Monthly Hero Plan</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$29.00 / month</span>
                  </div>

                  <div 
                    onClick={() => setSelectedPlan('yearly')}
                    style={{ 
                      padding: '15px', borderRadius: '12px', border: `2px solid ${selectedPlan === 'yearly' ? 'var(--color-charity)' : 'var(--border-color)'}`,
                      cursor: 'pointer', background: selectedPlan === 'yearly' ? 'rgba(46, 125, 50, 0.05)' : 'none'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700 }}>Yearly Hero Plan</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$240.00 / year (Save 20%)</span>
                  </div>

                  <div 
                    onClick={() => setSelectedPlan('none')}
                    style={{ 
                      padding: '15px', borderRadius: '12px', border: `2px solid ${selectedPlan === 'none' ? 'var(--color-charity)' : 'var(--border-color)'}`,
                      cursor: 'pointer', background: selectedPlan === 'none' ? 'rgba(46, 125, 50, 0.05)' : 'none',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>Skip subscription check for now</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign up as free visitor</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    {loading ? 'Creating...' : 'Register account'}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}
      </motion.div>
    </div>
  );
}
