import React, { useState } from 'react';
import { UserProfile } from '../types';
import { signInWithGoogleFirebase } from '../services/firebase';
import { LogoPlaceholder } from './LogoPlaceholder';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Firebase Google Sign-In with popup
  const handleGoogleSignIn = async () => {
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
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in window was closed before completing. Please click "Sign in with Google" to try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please enable popups for this site and try again.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase Auth settings. Please try again or update Firebase settings.');
      } else {
        setAuthError(err?.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
<div className="flex justify-center mb-5"> <img src="/logo.png" alt="LabelCheck" className="h-32 w-auto object-contain" /> </div>        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Legal Metrology Packaged Commodities Compliance & Inspection System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm ring-1 ring-slate-200 rounded-2xl sm:px-10 space-y-6">
          {/* Error Message if any */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{authError}</span>
            </div>
          )}

          {/* Main Google Sign-In Button ONLY */}
          <div>
            <button
              id="google-signin-btn"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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
              <span>{isLoading ? 'Opening Google Sign-In...' : 'Sign in with Google'}</span>
            </button>
          </div>

          {/* Secure Features Badge */}
        </div>

      </div>
    </div>
  );
};

