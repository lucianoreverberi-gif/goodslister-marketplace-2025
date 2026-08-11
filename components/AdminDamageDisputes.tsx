import React, { useEffect, useState } from 'react';

interface Props {
  adminUserId: string;
}

interface Report {
  id: string;
  booking_id: string;
  reporter_id: string;
  reporter_type: 'host' | 'renter';
  reported_party_id: string;
  description: string;
  claimed_amount_cents: number;
  status: string;
  response_deadline: string;
  admin_captured_cents: number | null;
  created_at: string;
  updated_at: string;
}

interface Evidence {
  id: string;
  party: 'reporter' | 'reported' | 'admin';
  evidence_type: 'photo' | 'note' | 'receipt';
  url_or_text: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_response: { label: 'Awaiting response', color: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
  disputed: { label: 'Disputed - review needed', color: 'bg-red-100 text-red-800' },
  auto_accepted: { label: 'Auto-accepted', color: 'bg-amber-100 text-amber-800' },
  resolved_captured: { label: 'Captured full', color: 'bg-gray-100 text-gray-800' },
  resolved_released: { label: 'Released', color: 'bg-emerald-100 text-emerald-800' },
  resolved_partial: { label: 'Captured partial', color: 'bg-gray-100 text-gray-800' }
};

const AdminDamageDisputes: React.FC<Props> = ({ adminUserId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [resolveMode, setResolveMode] = useState<'release' | 'capture-partial' | 'capture-full' | null>(null);
  const [captureAmount, setCaptureAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/damage/list?scope=admin&status=${statusFilter}` : '/api/damage/list?scope=admin';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [statusFilter]);

  const openReport = async (report: Report) => {
    setSelectedReport(report);
    setResolveMode(null);
    setCaptureAmount('');
    setAdminNotes('');
    setError(null);
    try {
      const res = await fetch(`/api/damage/get?reportId=${encodeURIComponent(report.id)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEvidence(data.evidence || []);
      }
    } catch (err) {
      console.error('Failed to load evidence:', err);
    }
  };

  const closeReport = () => {
    setSelectedReport(null);
    setEvidence([]);
    setResolveMode(null);
    setError(null);
  };

  const handleResolve = async () => {
    if (!selectedReport || !resolveMode) return;
    setResolving(true);
    setError(null);
    try {
      const claimedCents = selectedReport.claimed_amount_cents;
      let payload: any = { reportId: selectedReport.id, adminUserId };
      if (resolveMode === 'release') {
        payload.decision = 'release';
        payload.adminNotes = adminNotes || null;
      } else if (resolveMode === 'capture-full') {
        payload.decision = 'capture';
        payload.adminCaptureCents = claimedCents;
        payload.adminNotes = adminNotes || null;
      } else {
        const amount = parseFloat(captureAmount);
        if (isNaN(amount) || amount <= 0) {
          setError('Enter a valid capture amount');
          setResolving(false);
          return;
        }
        payload.decision = 'capture';
        payload.adminCaptureCents = Math.round(amount * 100);
        payload.adminNotes = adminNotes || null;
      }
      const res = await fetch('/api/damage/admin-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Resolve failed');
      // Refresh & close
      await fetchReports();
      closeReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setResolving(false);
    }
  };

  const reporterEvidence = evidence.filter(e => e.party === 'reporter');
  const reportedEvidence = evidence.filter(e => e.party === 'reported');

  const priorityOrder: Record<string, number> = {
    disputed: 0, pending_response: 1, auto_accepted: 2, accepted: 3,
    resolved_partial: 4, resolved_captured: 5, resolved_released: 6
  };
  const sortedReports = [...reports].sort((a, b) => {
    const pa = priorityOrder[a.status] ?? 99;
    const pb = priorityOrder[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'disputed', label: 'Disputed', color: 'bg-red-100 text-red-800' },
    { value: 'pending_response', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
    { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'auto_accepted', label: 'Auto-accepted', color: 'bg-amber-100 text-amber-800' }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Damage Disputes Center</h2>
        <button onClick={fetchReports} className="text-sm text-cyan-600 hover:text-cyan-700">Refresh</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              statusFilter === opt.value 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 py-8 text-center">Loading disputes...</p>
      ) : sortedReports.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No damage reports match this filter.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
              <tr>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Report</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Claim</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Reporter</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Filed</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map(r => {
                const info = STATUS_LABELS[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-800' };
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-600">{r.id.substring(0, 12)}...</span>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">{r.description.substring(0, 60)}</p>
                    </td>
                    <td className="p-4 font-black text-slate-900">${(r.claimed_amount_cents / 100).toFixed(2)}</td>
                    <td className="p-4 text-xs uppercase tracking-wider text-slate-500">{r.reporter_type}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${info.color}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openReport(r)}
                        className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-md text-xs font-bold hover:bg-cyan-200"
                      >
                        {r.status.startsWith('resolved_') ? 'View' : 'Resolve'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Damage Report</h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">{selectedReport.id}</p>
              </div>
              <button onClick={closeReport} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">Ã</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Claimed</p>
                <p className="text-lg font-bold text-red-600">${(selectedReport.claimed_amount_cents / 100).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Reporter</p>
                <p className="text-sm font-bold uppercase">{selectedReport.reporter_type}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <p className="text-xs font-semibold">{STATUS_LABELS[selectedReport.status]?.label || selectedReport.status}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 whitespace-pre-wrap">{selectedReport.description}</p>
            </div>

            {reporterEvidence.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reporter evidence</p>
                <div className="grid grid-cols-6 gap-2">
                  {reporterEvidence.filter(e => e.evidence_type === 'photo').map(e => (
                    <a key={e.id} href={e.url_or_text} target="_blank" rel="noopener noreferrer" className="aspect-square block">
                      <img src={e.url_or_text} alt="reporter evidence" className="w-full h-full object-cover rounded" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {reportedEvidence.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Respondent dispute</p>
                {reportedEvidence.filter(e => e.evidence_type === 'note').map(e => (
                  <div key={e.id} className="bg-red-50 border border-red-200 rounded p-3 mb-2 text-sm text-red-900 whitespace-pre-wrap">
                    {e.url_or_text}
                  </div>
                ))}
                <div className="grid grid-cols-6 gap-2">
                  {reportedEvidence.filter(e => e.evidence_type === 'photo').map(e => (
                    <a key={e.id} href={e.url_or_text} target="_blank" rel="noopener noreferrer" className="aspect-square block">
                      <img src={e.url_or_text} alt="respondent evidence" className="w-full h-full object-cover rounded" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!selectedReport.status.startsWith('resolved_') && (
              <>
                <div className="border-t border-slate-200 my-4"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin decision</p>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (optional)</label>
                  <textarea 
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Explain your decision..."
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                </div>

                {resolveMode === 'capture-partial' && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Capture amount (max ${(selectedReport.claimed_amount_cents / 100).toFixed(2)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500">$</span>
                      <input
                        type="number"
                        min="0.01"
                        max={selectedReport.claimed_amount_cents / 100}
                        step="0.01"
                        value={captureAmount}
                        onChange={e => setCaptureAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-slate-300 rounded p-2 pl-7 text-sm"
                      />
                    </div>
                  </div>
                )}

                {error && <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm text-red-700">{error}</div>}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setResolveMode('release'); }}
                    disabled={resolving}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      resolveMode === 'release' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    Release
                  </button>
                  <button
                    onClick={() => { setResolveMode('capture-partial'); }}
                    disabled={resolving}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      resolveMode === 'capture-partial' ? 'bg-amber-600 text-white' : 'bg-white border border-amber-600 text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    Capture partial
                  </button>
                  <button
                    onClick={() => { setResolveMode('capture-full'); }}
                    disabled={resolving}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      resolveMode === 'capture-full' ? 'bg-red-600 text-white' : 'bg-white border border-red-600 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Capture full
                  </button>
                  {resolveMode && (
                    <button
                      onClick={handleResolve}
                      disabled={resolving}
                      className="ml-auto px-6 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-black disabled:bg-slate-300"
                    >
                      {resolving ? 'Processing...' : 'Confirm'}
                    </button>
                  )}
                </div>
              </>
            )}

            {selectedReport.status.startsWith('resolved_') && (
              <div className="border-t border-slate-200 mt-4 pt-4">
                <p className="text-xs text-slate-500">
                  This case has been resolved. 
                  {selectedReport.admin_captured_cents !== null && ` Captured: $${(selectedReport.admin_captured_cents / 100).toFixed(2)}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDamageDisputes;

