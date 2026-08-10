import React, { useState } from 'react';

interface Props {
  bookingId: string;
  reporterId: string;
  reporterRole: 'host' | 'renter';
  depositAmount: number;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

const DamageReportModal: React.FC<Props> = ({ bookingId, reporterId, reporterRole, depositAmount, onClose, onSuccess }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetLabel = reporterRole === 'host' ? 'the renter' : 'the host';

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
        const folder = `damage/${bookingId}/reporter`;
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

  const amountValue = parseFloat(claimedAmount);
  const amountValid = !isNaN(amountValue) && amountValue > 0 && amountValue <= depositAmount;
  const canSubmit = photos.length >= 2 && description.length >= 20 && amountValid && !submitting && !uploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/damage/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          reporterId,
          description,
          claimedAmountCents: Math.round(amountValue * 100),
          photoUrls: photos
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submit failed');
      if (onSuccess) onSuccess(data);
      // Redirect to detail page
      window.location.hash = `#damage/${data.reportId}`;
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
            <h2 className="text-xl font-bold">Report damage</h2>
            <p className="text-xs text-gray-500 mt-1">Filing a report against {targetLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">Ã</button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-xs text-amber-800">
          Only file this report if you observed a real problem. False reports may result in account suspension. {targetLabel === 'the renter' ? 'The renter' : 'The host'} will have 48 hours to accept or dispute.
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Evidence photos ({photos.length}/2 required, max 15)</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {photos.map((url, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={url} alt={`photo ${idx+1}`} className="w-full h-full object-cover rounded" />
                <button onClick={() => removePhoto(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">Ã</button>
              </div>
            ))}
          </div>
          <label className="block cursor-pointer bg-red-50 border-2 border-dashed border-red-300 rounded-lg py-4 text-center hover:bg-red-100">
            <span className="text-sm text-red-700 font-semibold">{uploading ? 'Uploading...' : '+ Add photos'}</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            What happened? <span className="text-xs text-gray-400 font-normal">({description.length}/20 min)</span>
          </label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={4} 
            placeholder="Describe the damage or problem in detail..." 
            className="w-full border border-gray-300 rounded p-2 text-sm" 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Amount claimed <span className="text-xs text-gray-400 font-normal">(deposit available: ${depositAmount.toFixed(2)})</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input 
              type="number"
              min="0.01"
              max={depositAmount}
              step="0.01"
              value={claimedAmount} 
              onChange={e => setClaimedAmount(e.target.value)} 
              placeholder="0.00"
              className="w-full border border-gray-300 rounded p-2 pl-7 text-sm" 
            />
          </div>
          {claimedAmount && !amountValid && (
            <p className="text-xs text-red-600 mt-1">
              {amountValue > depositAmount ? `Cannot exceed deposit ($${depositAmount.toFixed(2)})` : 'Must be greater than 0'}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={!canSubmit} 
            className={`flex-1 py-3 rounded-lg font-semibold text-white ${canSubmit ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            {submitting ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DamageReportModal;
