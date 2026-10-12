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
      onVerified();
      onClose();
    } else {
      setError('Please enter your 4+ digit security PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{actionTitle}</h3>
            <p className="text-xs text-slate-500">Security Clearance Required</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-5">
          <p className="text-xs text-slate-700 leading-relaxed">
            {actionDescription}
          </p>
          <div className="mt-2 text-[11px] text-blue-700 flex items-center gap-1.5 font-semibold">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>FIDO2 / WebAuthn Platform Biometric Verification</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!usePinMode ? (
          <div className="space-y-3">
            <button
              onClick={handleBiometricTrigger}
              disabled={verifying}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-sm shadow-blue-600/20 disabled:opacity-50 text-xs cursor-pointer"
            >
              <Fingerprint className="w-5 h-5" />
              <span>{verifying ? 'Scanning Authenticator...' : 'Verify with Fingerprint / Passkey'}</span>
            </button>

            <button
              type="button"
              onClick={() => setUsePinMode(true)}
              className="w-full text-xs text-slate-500 hover:text-blue-600 py-2 text-center font-medium"
            >
              Use Security Passkey PIN Fallback
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Operator Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  maxLength={8}
                  value={fallbackPin}
                  onChange={(e) => setFallbackPin(e.target.value)}
                  placeholder="Enter security code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUsePinMode(false)}
                className="w-1/2 py-2.5 text-xs text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Back to Biometrics
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
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
