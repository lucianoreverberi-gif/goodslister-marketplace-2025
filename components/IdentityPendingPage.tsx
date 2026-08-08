import React from 'react';

interface Props {
  status?: 'processing' | 'requires_input' | 'unknown';
  userEmail?: string;
  onRetry?: () => void;
  onGoExplore?: () => void;
}

const IdentityPendingPage: React.FC<Props> = ({ status = 'processing', userEmail, onRetry, onGoExplore }) => {
  const isProcessing = status === 'processing';
  const needsRetry = status === 'requires_input';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isProcessing ? 'bg-cyan-100' : 'bg-amber-100'}`}>
            <span className="text-4xl">{isProcessing ? 'â³' : 'â ï¸'}</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isProcessing ? 'Verification in Progress' : 'Verification Needs Attention'}
          </h1>
          <p className="text-gray-600">
            {isProcessing
              ? 'We received your documents and are reviewing them now.'
              : 'We could not complete your verification. Please try again.'}
          </p>
        </div>

        {isProcessing && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
            <div className="flex items-start mb-2">
              <span className="mr-2">â±ï¸</span>
              <div>
                <p className="font-semibold text-sm">Estimated time: Under 24 hours</p>
                <p className="text-xs text-gray-600">Usually completed in under 5 minutes</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-2">ð§</span>
              <div>
                <p className="font-semibold text-sm">Email confirmation</p>
                <p className="text-xs text-gray-600">
                  We'll email you at <strong>{userEmail || 'your registered email'}</strong> as soon as it's complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {needsRetry && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-sm mb-2">Most common reasons for rejection:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>â¢ Blurry photo of the document</li>
              <li>â¢ Poor lighting in the selfie</li>
              <li>â¢ Expired ID document</li>
              <li>â¢ Document type not accepted</li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {needsRetry && onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Retry Verification
            </button>
          )}
          {onGoExplore && (
            <button
              onClick={onGoExplore}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition ${needsRetry ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
            >
              Explore Listings
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Powered by Stripe Identity. Your data is secure.
        </p>
      </div>
    </div>
  );
};

export default IdentityPendingPage;

