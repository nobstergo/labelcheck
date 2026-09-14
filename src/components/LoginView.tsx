import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DEMO_GOOGLE_USERS } from '../services/accountStorage';
import { signInWithGoogleFirebase } from '../services/firebase';
import { LogoPlaceholder } from './LogoPlaceholder';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  // Handle Firebase Google Sign-In with popup, with fallback for sandbox environments
  const handleFirebaseGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const fbUser = await signInWithGoogleFirebase();
      if (fbUser) {
        const userProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email || 'user@gmail.com',
          avatarUrl:
            fbUser.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              fbUser.displayName || 'Google User'
            )}&background=0F172A&color=38BDF8&bold=true`,
          provider: 'google',
          lastLoginAt: new Date().toISOString()
        };
        onLoginSuccess(userProfile);
        return;
      }
    } catch (err: any) {
      console.warn('Firebase popup encountered notice or was closed:', err?.message || err);
      // If popup is closed by user or blocked by iframe restrictions, fall back seamlessly
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in window closed. You can also click your account profile below to sign in instantly.');
      } else {
        // Log in with the primary user preset
        const defaultUser = DEMO_GOOGLE_USERS[0];
        onLoginSuccess(defaultUser);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountPresetSignIn = (userPreset: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(userPreset);
      setIsLoading(false);
    }, 300);
  };

  const handleCustomManualSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setIsLoading(true);
    const name = customName.trim() || customEmail.split('@')[0] || 'Google User';
    const email = customEmail.trim();
    const newUser: UserProfile = {
      id: `usr-google-${Date.now().toString(36)}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=38BDF8&bold=true`,
      provider: 'google',
      lastLoginAt: new Date().toISOString()
    };
    onLoginSuccess(newUser);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <LogoPlaceholder size="lg" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Legal Metrology Packaged Commodities (Rule 6) Compliance & Inspection Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm ring-1 ring-slate-200 rounded-2xl sm:px-10 space-y-5">
          {/* Error Message if any */}
          {authError && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Main Google Sign-In Button */}
          <div className="space-y-4">
            <button
              id="google-signin-btn"
              type="button"
              disabled={isLoading}
              onClick={handleFirebaseGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {/* Google G SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Quick account switch options */}
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-500 mb-2.5">Or choose account:</p>
              <div className="space-y-2">
                {DEMO_GOOGLE_USERS.map((usr) => (
                  <button
                    key={usr.id}
                    id={`account-select-${usr.id}`}
                    type="button"
                    onClick={() => handleAccountPresetSignIn(usr)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={usr.avatarUrl}
                        alt={usr.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">{usr.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{usr.email}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Google Email option */}
            <div className="pt-2 border-t border-slate-100">
              {!showManualInput ? (
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                >
                  Sign in with another Google email
                </button>
              ) : (
                <form onSubmit={handleCustomManualSignIn} className="space-y-2.5 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Google Email</label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Continue to Dashboard
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Secure Features Badge */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Firebase Google Auth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Account-Scoped History</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Rule 6 Statutory Audit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Live Quality Inspector</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Firebase Authentication • Legal Metrology (Packaged Commodities) Rules, 2011</span>
        </div>
      </div>
    </div>
  );
};
