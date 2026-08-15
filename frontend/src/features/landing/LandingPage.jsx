// ─────────────────────────────────────────────
// LandingPage — Pre-login homepage & feature showcase
// ─────────────────────────────────────────────

import { useState } from 'react';
import { EbosLogo } from '../../components/common/EbosLogo.jsx';
import { Modal }    from '../../components/ui/Modal.jsx';
import { LoginPage } from '../auth/LoginPage.jsx';

export function LandingPage({ isOnline, onLogin, authError, syncMessage }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialMode, setInitialMode]     = useState('login'); // 'login' | 'register'

  const openSignIn = () => {
    setInitialMode('login');
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setInitialMode('register');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      
      {/* ── Top Header Navigation ────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <EbosLogo size="md" showText={true} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className={`hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
            isOnline ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-rose-950/80 text-rose-400 border-rose-800'
          }`}>
            {isOnline ? '🟢 Cloud Online' : '🔌 Offline Ready'}
          </span>

          <button
            onClick={openSignIn}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            🔑 Sign In
          </button>

          <button
            onClick={openRegister}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/30 rounded-xl transition-all cursor-pointer"
          >
            🏬 Register Store
          </button>
        </div>
      </header>

      {/* ── Hero Banner Section ──────────────────────── */}
      <section className="relative px-6 pt-12 sm:pt-20 pb-16 max-w-6xl mx-auto text-center space-y-6">
        
        {/* Ethiopian Flag Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold shadow-inner">
          <span>🇪🇹</span>
          <span>Built for Retailers, Wholesalers & SMEs in Ethiopia</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-50">
          The Offline-First Business OS & POS <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
            For Ethiopian Merchants
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-slate-400 text-sm sm:text-lg font-normal leading-relaxed">
          Process checkout sales at lightning speed with direct quantities, track customer credit ledgers, manage multi-branch stock, and auto-sync to the cloud—even when internet drops out.
        </p>

        {/* Hero Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={openSignIn}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚀 Open POS & Store Login</span>
          </button>

          <button
            onClick={openRegister}
            className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-base rounded-2xl border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🏬 Register New Business</span>
          </button>
        </div>

        {/* System Capability Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
          {[
            { icon: '⚡', title: '100% Offline First', desc: 'No internet required for POS sales' },
            { icon: '📱', title: 'Mobile & Desktop', desc: 'Android APK & Web browser ready' },
            { icon: '👥', title: 'Credit Ledger', desc: 'Track customer debt & credit limits' },
            { icon: '🔄', title: 'Auto Cloud Sync', desc: 'Instant push/pull on reconnect' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-left space-y-1">
              <div className="text-2xl">{icon}</div>
              <div className="font-bold text-slate-200 text-sm">{title}</div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Detailed Feature Cards Section ──────────── */}
      <section className="px-6 py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Complete Business Operating System</h2>
            <p className="text-slate-400 text-sm">Everything you need to manage your store, inventory, and sales</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center text-2xl font-bold">
                🛒
              </div>
              <h3 className="text-lg font-bold text-white">Checkout POS & Direct Quantities</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Type exact direct quantities, search products with auto-complete, select payment modes (Cash, Telebirr, CBE Birr, Credit), and issue receipts instantly.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center text-2xl font-bold">
                📦
              </div>
              <h3 className="text-lg font-bold text-white">Stock Control & Inventory Ledger</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Log stock receipts, track write-offs, get low-stock alerts, and maintain accurate inventory balances automatically across all products.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center text-2xl font-bold">
                📈
              </div>
              <h3 className="text-lg font-bold text-white">Itemized Reports & Analytics</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Monitor total revenue, exact unit quantities sold, payment mode breakdowns, and daily sales trends with live summary cards.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-6 py-8 text-center text-slate-500 text-xs space-y-2">
        <p>© {new Date().getFullYear()} EBOS — Ethiopian Business Operating System. All rights reserved.</p>
        <p className="text-slate-600">Built for merchants in Addis Ababa, Mercato, Bole, and across Ethiopia.</p>
      </footer>

      {/* ── Auth Modal Container (Sign In / Register) ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md my-8">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 z-50 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg cursor-pointer"
            >
              ✕
            </button>
            <LoginPage
              isOnline={isOnline}
              onLogin={onLogin}
              authError={authError}
              syncMessage={syncMessage}
              defaultMode={initialMode}
            />
          </div>
        </div>
      )}

    </div>
  );
}
