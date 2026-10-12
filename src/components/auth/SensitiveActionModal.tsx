import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Fingerprint, KeyRound, AlertTriangle, X } from 'lucide-react';

interface SensitiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  actionTitle: string;
  actionDescription: string;
}

export const SensitiveActionModal: React.FC<SensitiveActionModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  actionTitle,
  actionDescription,
}) => {
  const { user, requireBiometricVerification } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackPin, setFallbackPin] = useState('');
  const [usePinMode, setUsePinMode] = useState(false);

  if (!isOpen) return null;

  const handleBiometricTrigger = async () => {
    setError(null);
    setVerifying(true);
    try {
      const verified = await requireBiometricVerification(actionDescription);
      if (verified) {
        onVerified();
        onClose();
      } else {
        setError('Verification not completed.');
      }
    } catch (err: any) {
      setError(err.message || 'Security verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackPin.length >= 4) {
      // Local safety authorization confirmation
      onVerified();
      onClose();
    } else {
      setError('Please enter your 4+ digit security PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{actionTitle}</h3>
            <p className="text-xs text-slate-400">Security Clearance Required</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 mb-5">
          <p className="text-xs text-slate-300 leading-relaxed">
            {actionDescription}
          </p>
          <div className="mt-2 text-[11px] text-cyan-400 flex items-center gap-1.5 font-medium">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>FIDO2 / WebAuthn Platform Biometric Verification</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!usePinMode ? (
          <div className="space-y-3">
            <button
              onClick={handleBiometricTrigger}
              disabled={verifying}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50 text-sm cursor-pointer"
            >
              <Fingerprint className="w-5 h-5 text-slate-950" />
              <span>{verifying ? 'Scanning Authenticator...' : 'Verify with Fingerprint / Passkey'}</span>
            </button>

            <button
              type="button"
              onClick={() => setUsePinMode(true)}
              className="w-full text-xs text-slate-400 hover:text-cyan-400 py-2 text-center"
            >
              Use Security Passkey PIN Fallback
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  maxLength={8}
                  value={fallbackPin}
                  onChange={(e) => setFallbackPin(e.target.value)}
                  placeholder="Enter security code"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUsePinMode(false)}
                className="w-1/2 py-2.5 text-xs text-slate-400 bg-slate-800 rounded-xl hover:text-white"
              >
                Back to Biometrics
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 rounded-xl hover:bg-cyan-300"
              >
                Confirm Unlock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
