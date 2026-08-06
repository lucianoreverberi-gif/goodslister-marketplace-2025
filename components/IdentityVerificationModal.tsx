import React, { useState } from 'react';

interface Props {
  userId: string;
  onClose: () => void;
}

const IdentityVerificationModal: React.FC<Props> = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/identity/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create verification session');
      if (data.alreadyVerified) { onClose(); return; }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center mb-4">
          <div className="mx-auto w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-3xl">ð</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Verify Your Identity</h2>
          <p className="text-gray-600 text-sm">To protect our community, we verify all new renters. Takes about 2 minutes.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <div className="mb-2">â Government-issued photo ID (driver's license or passport)</div>
          <div>â Quick selfie for verification</div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2 mb-4">{error}</div>}
        <button onClick={handleVerify} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg mb-2 transition">
          {loading ? 'Loading...' : 'Verify with Stripe'}
        </button>
        <button onClick={onClose} className="w-full text-gray-500 hover:text-gray-700 text-sm py-2">Cancel</button>
        <p className="text-xs text-gray-400 text-center mt-3">Powered by Stripe Identity. Your data is secure.</p>
      </div>
    </div>
  );
};

export default IdentityVerificationModal;

