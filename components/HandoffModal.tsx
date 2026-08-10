import React, { useState } from 'react';

interface Props {
  bookingId: string;
  type: 'checkin' | 'checkout';
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

const HandoffModal: React.FC<Props> = ({ bookingId, type, onClose, onSuccess }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckin = type === 'checkin';
  const title = isCheckin ? 'Check-in: Verify item condition' : 'Check-out: Return the item';
  const submitLabel = isCheckin ? 'Confirm check-in' : 'Confirm return';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 10) {
      setError('Max 10 photos allowed');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const folder = `handoff/${bookingId}/${type}`;
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

  const canSubmit = photos.length >= 4 && confirmed && !submitting && !uploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/handoff/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          type,
          photoUrls: photos,
          conditionRating: rating,
          conditionNotes: notes || null
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submit failed');
      if (onSuccess) onSuccess(data);
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
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">Ã</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {isCheckin
            ? 'Take at least 4 photos showing the current condition of the item. This protects both you and the host.'
            : 'Take at least 4 photos of the item as you return it. If everything looks OK, your security deposit will be released automatically.'}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Photos ({photos.length}/4 required, max 10)</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {photos.map((url, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={url} alt={`photo ${idx+1}`} className="w-full h-full object-cover rounded" />
                <button onClick={() => removePhoto(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">Ã</button>
              </div>
            ))}
          </div>
          <label className="block cursor-pointer bg-cyan-50 border-2 border-dashed border-cyan-300 rounded-lg py-4 text-center hover:bg-cyan-100">
            <span className="text-sm text-cyan-700 font-semibold">{uploading ? 'Uploading...' : '+ Add photos'}</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Condition rating: {rating}/5</label>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)} className={`w-8 h-8 rounded ${rating >= n ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any observations about the item's condition..." className="w-full border border-gray-300 rounded p-2 text-sm" />
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
          <span className="text-sm text-gray-700">
            I confirm that the photos and condition report are accurate. My IP address and timestamp will be recorded as a digital signature.
          </span>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit} className={`flex-1 py-3 rounded-lg font-semibold text-white ${canSubmit ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-gray-300 cursor-not-allowed'}`}>
            {submitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandoffModal;

