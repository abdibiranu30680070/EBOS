// ─────────────────────────────────────────────
// LoginPage — Authentication & Business Registration
// Handles online login, offline cache fallback, and merchant onboarding
// ─────────────────────────────────────────────

import { useState }     from 'react';
import { Alert }        from '../../components/ui/Alert.jsx';
import { EbosLogo }     from '../../components/common/EbosLogo.jsx';
import { API_BASE_URL } from '../../lib/constants.js';

export function LoginPage({ isOnline, onLogin, authError, syncMessage, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode); // 'login' | 'register'

  // Login form state
  const [businessId, setBusinessId] = useState('bus_mercato_001');
  const [username,   setUsername]   = useState('almaz');
  const [password,   setPassword]   = useState('almaz123');
  const [loading,    setLoading]    = useState(false);

  // Registration form state
  const [regForm, setRegForm] = useState({
    businessName: '',
    tin: '',
    ownerName: '',
    phone: '',
    username: '',
    password: '',
  });
  const [regError,   setRegError]   = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegChange = (field) => (e) => {
    setRegForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin({ businessId, username, password });
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!isOnline) {
      setRegError('Business registration requires an active internet connection.');
      return;
    }

    if (!regForm.businessName.trim() || !regForm.ownerName.trim() || !regForm.username.trim() || !regForm.password.trim()) {
      setRegError('Business name, owner name, username, and password are required.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/business/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: regForm.businessName.trim(),
          tin:          regForm.tin.trim() || undefined,
          ownerName:    regForm.ownerName.trim(),
          phone:        regForm.phone.trim(),
          username:     regForm.username.trim(),
          password:     regForm.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Business registration failed.');
      }

      setRegSuccess(`🎉 Business "${data.businessName}" created successfully! Your Business ID is ${data.businessId}. Logging in…`);

      // Automatically log the new merchant in!
      setTimeout(async () => {
        await onLogin({
          businessId: data.businessId,
          username:   data.username,
          password:   regForm.password,
        });
      }, 1500);

    } catch (err) {
      setRegError(err.message || 'Registration failed. Please check your network connection.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md space-y-4">
        {/* Main Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Brand strip */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-700 px-6 py-6 sm:py-8 flex flex-col items-center justify-center text-center">
            <EbosLogo size="lg" showText={true} className="mb-2" />
            <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">
              Ethiopian Business Operating System
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-700 bg-slate-900/50 p-1.5 gap-1.5">
            <button
              onClick={() => { setMode('login'); setRegError(''); setRegSuccess(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              🔑 Sign In to Store
            </button>
            <button
              onClick={() => { setMode('register'); setRegError(''); setRegSuccess(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              🏬 Register New Business
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            
            {/* ── Mode 1: Login Form ─────────────────────── */}
            {mode === 'login' && (
              <>
                {/* Alerts */}
                {authError && <Alert type="danger">{authError}</Alert>}
                {syncMessage && <Alert type={syncMessage.type}>{syncMessage.text}</Alert>}

                {/* Demo credentials hint */}
                <div className="p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-xs text-slate-300 space-y-1">
                  <p className="text-white font-semibold mb-1">🔑 Quick Demo Credentials</p>
                  <p>Business ID: <code className="text-blue-400 font-mono">bus_mercato_001</code></p>
                  <p>User: <code className="text-blue-400 font-mono">almaz</code> &nbsp;|&nbsp; Pass: <code className="text-blue-400 font-mono">almaz123</code></p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="businessId" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Business ID
                    </label>
                    <input
                      id="businessId"
                      type="text"
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {loading ? 'Authenticating…' : `Login — ${isOnline ? '🟢 Online' : '🔴 Offline Mode'}`}
                  </button>
                </form>
              </>
            )}

            {/* ── Mode 2: Business Registration Form ─────── */}
            {mode === 'register' && (
              <>
                {regError && <Alert type="danger">{regError}</Alert>}
                {regSuccess && <Alert type="success">{regSuccess}</Alert>}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Business Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bole Fresh Grocery & Market"
                      value={regForm.businessName}
                      onChange={handleRegChange('businessName')}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Owner Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={regForm.ownerName}
                        onChange={handleRegChange('ownerName')}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        TIN (Tax ID)
                      </label>
                      <input
                        type="text"
                        placeholder="Optional TIN"
                        value={regForm.tin}
                        onChange={handleRegChange('tin')}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+251 9xxxxxxxx"
                      value={regForm.phone}
                      onChange={handleRegChange('phone')}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Username <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Admin login"
                        value={regForm.username}
                        onChange={handleRegChange('username')}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Password <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Secret key"
                        value={regForm.password}
                        onChange={handleRegChange('password')}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading || !isOnline}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {regLoading ? 'Registering Business…' : '🏬 Create Business Account'}
                  </button>
                </form>
              </>
            )}

            {/* Network status footer */}
            <div className="text-center text-xs text-slate-500 border-t border-slate-700 pt-4">
              Network Status: <strong className={isOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {isOnline ? '🟢 Connected (Online)' : '🔴 Disconnected (Offline)'}
              </strong>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          © {new Date().getFullYear()} EBOS — Offline-first business system for Ethiopian SMEs
        </p>
      </div>
    </div>
  );
}
