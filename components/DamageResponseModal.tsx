import React, { useState } from 'react';

interface Props {
  reportId: string;
  respondingUserId: string;
  claimedAmount: number;
  reporterName: string;
  description: string;
  bookingId: string;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

const DamageResponseModal: React.FC<Props> = ({ reportId, respondingUserId, claimedAmount, reporterName, description, bookingId, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'select' | 'dispute'>('select');
  const [disputeNote, setDisputeNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 15) {
      setError('Max 15 photos allowed');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const folder = `damage/${bookingId}/reported`;
        const res = await fetch(`/api/upload-image?filename=${encodeURIComponent(filename)}&folder=${encodeURIComponent(folder)}`, {
          method: 'POST',
          body: file
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        if (data?.url) newUrls.push(data.url);
      }
      setPhotos(p => [...p, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
  };

  const submitAction = async (action: 'accept' | 'dispute') => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = { reportId, respondingUserId, action };
      if (action === 'dispute') {
        if (disputeNote.length < 20) {
          setError('Dispute note must be at least 20 characters');
          setSubmitting(false);
          return;
        }
        if (photos.length < 1) {
          setError('At least 1 evidence photo required');
          setSubmitting(false);
          return;
        }
        payload.disputeNote = disputeNote;
        payload.evidencePhotoUrls = photos;
      }
      const res = await fetch('/api/damage/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submit failed');
      if (onSuccess) onSuccess(data);
      window.location.hash = `#damage/${reportId}`;
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Respond to damage report</h2>
            <p className="text-xs text-gray-500 mt-1">From {reporterName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">Ã</button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Claim</p>
          <p className="text-lg font-bold text-red-600 mb-2">${claimedAmount.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mb-1">What they said</p>
          <p className="text-sm text-gray-700 italic">"{description}"</p>
        </div>

        {mode === 'select' && (
          <>
            <p className="text-sm text-gray-600 mb-4">Do you accept this claim? Accepting will forward the case to our team for automatic capture. Disputing will require evidence and admin review.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => submitAction('accept')} 
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-gray-300"
              >
                {submitting ? 'Submitting...' : 'Accept the claim'}
              </button>
              <button 
                onClick={() => setMode('dispute')} 
                disabled={submitting}
                className="w-full py-3 rounded-lg border-2 border-red-600 text-red-600 font-semibold hover:bg-red-50"
              >
                Dispute this claim
              </button>
              <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">Decide later</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded p-3 mt-4 text-sm text-red-700">{error}</div>}
          </>
        )}

        {mode === 'dispute' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-xs text-amber-800">
              Please explain why you disagree with this claim and provide evidence. Our admin team will review your response.
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Your explanation <span className="text-xs text-gray-400 font-normal">({disputeNote.length}/20 min)</span>
              </label>
              <textarea 
                value={disputeNote} 
                onChange={e => setDisputeNote(e.target.value)} 
                rows={4} 
                placeholder="Explain why you disagree with this claim..." 
                className="w-full border border-gray-300 rounded p-2 text-sm" 
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Evidence photos ({photos.length}/1 required, max 15)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img src={url} alt={`evidence ${idx+1}`} className="w-full h-full object-cover rounded" />
                    <button onClick={() => removePhoto(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">Ã</button>
                  </div>
                ))}
              </div>
              <label className="block cursor-pointer bg-red-50 border-2 border-dashed border-red-300 rounded-lg py-4 text-center hover:bg-red-100">
                <span className="text-sm text-red-700 font-semibold">{uploading ? 'Uploading...' : '+ Add photos'}</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setMode('select')} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
              <button 
                onClick={() => submitAction('dispute')} 
                disabled={submitting || uploading}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-gray-300"
              >
                {submitting ? 'Submitting...' : 'Submit dispute'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DamageResponseModal;
