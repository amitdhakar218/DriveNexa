import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../brand/Logo';
import { Lock, Mail, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInGuest, resetPassword } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await signInWithEmail(email, password);
      } else if (mode === 'SIGNUP') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name or callsign.');
        }
        await signUpWithEmail(email, password, displayName);
      } else if (mode === 'FORGOT') {
        await resetPassword(email);
        setSuccessMsg('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let userFriendly = err.message || 'Authentication error';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        userFriendly = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        userFriendly = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        userFriendly = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/user-not-found') {
        userFriendly = 'No account found with this email.';
      }
      setErrorMsg(userFriendly);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google auth error:', err);
      setErrorMsg(err.message || 'Google sign-in cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" className="mb-3" />
          <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
            Production smart vehicle safety & remote rover monitoring platform
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Firebase Session & WebAuthn Ready</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operator Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('SIGNUP'); setErrorMsg(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'SIGNUP'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name / Operator Callsign
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@drivenexa.io"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {mode !== 'FORGOT' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => { setMode('FORGOT'); setErrorMsg(null); }}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50 text-xs cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'LOGIN' ? (
              <>
                <span>Authenticate & Access Rover</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'SIGNUP' ? (
              <>
                <span>Create Operator Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>
        </form>

        {mode === 'FORGOT' && (
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className="w-full mt-3 text-xs text-slate-500 hover:text-slate-800 text-center py-2 font-medium"
          >
            Back to Sign In
          </button>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Or continue with
          </span>
        </div>

        {/* Google Authentication */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={async () => {
              setErrorMsg(null);
              setLoading(true);
              try {
                await signInGuest();
              } catch (err: any) {
                setErrorMsg(err.message || 'Operator access failed');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>⚡ 1-Click Operator Access (तुरंत ऑपरेटर लॉगिन)</span>
          </button>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Sign In with Google</span>
          </button>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
          Authorized personnel only. Remote commands are signed with cryptographic timestamps and stored in audit logs.
        </div>
      </div>
    </div>
  );
};
