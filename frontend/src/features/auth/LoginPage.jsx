// ─────────────────────────────────────────────
// LoginPage — Authentication screen
// Handles online login + offline cache fallback
// Props: isOnline, onLogin, authError, syncMessage
// ─────────────────────────────────────────────

import { useState } from 'react';
import { Alert }     from '../../components/ui/Alert.jsx';

export function LoginPage({ isOnline, onLogin, authError, syncMessage }) {
  const [businessId, setBusinessId] = useState('bus_mercato_001');
  const [username,   setUsername]   = useState('almaz');
  const [password,   setPassword]   = useState('almaz123');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin({ businessId, username, password });
    setLoading(false);
  };

  const fields = [
    { id: 'businessId', label: 'Business ID',  type: 'text',     value: businessId, setter: setBusinessId },
    { id: 'username',   label: 'Username',      type: 'text',     value: username,   setter: setUsername   },
    { id: 'password',   label: 'Password',      type: 'password', value: password,   setter: setPassword   },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Brand strip */}
          <div className="bg-blue-600 px-8 py-6 text-center">
            <div className="text-4xl mb-2">💼</div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">EBOS Portal</h1>
            <p className="text-blue-200 text-sm mt-1">Ethiopian Business Operating System</p>
          </div>

          <div className="p-8 space-y-5">
            {/* Alerts */}
            {authError && <Alert type="danger">{authError}</Alert>}
            {syncMessage && <Alert type={syncMessage.type}>{syncMessage.text}</Alert>}

            {/* Demo credentials hint */}
            <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-xs text-slate-300 space-y-1">
              <p className="text-white font-semibold mb-1.5">🔑 Demo Credentials (pre-filled)</p>
              <p>Business ID: <code className="text-blue-400">bus_mercato_001</code></p>
              <p>Username: <code className="text-blue-400">almaz</code> &nbsp;|&nbsp; Password: <code className="text-blue-400">almaz123</code></p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ id, label, type, value, setter }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                {loading ? 'Authenticating…' : `Login — ${isOnline ? '🟢 Online' : '🔴 Offline Mode'}`}
              </button>
            </form>

            {/* Network status footer */}
            <div className="text-center text-xs text-slate-500 border-t border-slate-700 pt-4">
              Network: <strong className={isOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </strong>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} EBOS — Offline-first business system for Ethiopian SMEs
        </p>
      </div>
    </div>
  );
}
