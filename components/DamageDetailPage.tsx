import React, { useEffect, useState } from 'react';
import DamageResponseModal from './DamageResponseModal';

interface Props {
  reportId: string;
  currentUserId: string;
  onBack?: () => void;
}

interface Evidence {
  id: string;
  party: 'reporter' | 'reported' | 'admin';
  evidence_type: 'photo' | 'note' | 'receipt';
  url_or_text: string;
  created_at: string;
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
  responded_at: string | null;
  admin_resolved_at: string | null;
  admin_captured_cents: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  deposit_amount: string;
  checkout_at: string | null;
  listing_title: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_response: { label: 'Awaiting response', color: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
  disputed: { label: 'Disputed - under review', color: 'bg-red-100 text-red-800' },
  auto_accepted: { label: 'Auto-accepted (no response)', color: 'bg-amber-100 text-amber-800' },
  resolved_captured: { label: 'Resolved - deposit captured', color: 'bg-gray-100 text-gray-800' },
  resolved_released: { label: 'Resolved - deposit released', color: 'bg-emerald-100 text-emerald-800' },
  resolved_partial: { label: 'Resolved - partial capture', color: 'bg-gray-100 text-gray-800' }
};

const DamageDetailPage: React.FC<Props> = ({ reportId, currentUserId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/damage/get?reportId=${encodeURIComponent(reportId)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load report');
      setReport(data.report);
      setEvidence(data.evidence || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error || 'Report not found'}
        </div>
        {onBack && (
          <button onClick={onBack} className="mt-4 text-cyan-600 hover:text-cyan-700">â Back</button>
        )}
      </div>
    );
  }

  const claimedAmount = report.claimed_amount_cents / 100;
  const capturedAmount = report.admin_captured_cents ? report.admin_captured_cents / 100 : null;
  const statusInfo = STATUS_LABELS[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };

  const isReportedParty = currentUserId === report.reported_party_id;
  const isReporter = currentUserId === report.reporter_id;
  const canRespond = isReportedParty && report.status === 'pending_response';

  const reporterEvidence = evidence.filter(e => e.party === 'reporter');
  const reportedEvidence = evidence.filter(e => e.party === 'reported');
  const adminEvidence = evidence.filter(e => e.party === 'admin');

  const timelineEvents = [
    {
      time: report.created_at,
      title: 'Report submitted',
      description: `${report.reporter_type === 'host' ? 'Host' : 'Renter'} filed a claim for $${claimedAmount.toFixed(2)}`
    },
    ...(report.responded_at ? [{
      time: report.responded_at,
      title: report.status === 'accepted' ? 'Accepted by respondent' 
           : report.status === 'auto_accepted' ? 'Auto-accepted (no response within 48h)'
           : 'Disputed by respondent',
      description: report.status === 'disputed' ? 'Case escalated to admin review' : ''
    }] : []),
    ...(report.admin_resolved_at ? [{
      time: report.admin_resolved_at,
      title: report.status === 'resolved_released' ? 'Admin released deposit'
           : report.status === 'resolved_captured' ? `Admin captured full deposit ($${capturedAmount?.toFixed(2)})`
           : report.status === 'resolved_partial' ? `Admin captured partial ($${capturedAmount?.toFixed(2)})`
           : 'Admin resolved',
      description: report.admin_notes || ''
    }] : [])
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      {onBack && (
        <button onClick={onBack} className="text-cyan-600 hover:text-cyan-700 mb-4 text-sm">â Back to dashboard</button>
      )}

      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold">Damage report</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-sm text-gray-500">For: {report.listing_title}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <p className="text-xs text-gray-500 mb-1">Claimed amount</p>
          <p className="text-2xl font-bold text-red-600">${claimedAmount.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <p className="text-xs text-gray-500 mb-1">Deposit available</p>
          <p className="text-2xl font-bold text-gray-700">${parseFloat(report.deposit_amount).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description from reporter</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>
      </div>

      {canRespond && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-amber-900 mb-2">â° Action required</p>
          <p className="text-xs text-amber-800 mb-3">
            You have until {new Date(report.response_deadline).toLocaleString()} to respond. 
            If you don't, the claim will be automatically accepted.
          </p>
          <button
            onClick={() => setShowResponseModal(true)}
            className="w-full py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700"
          >
            Respond now
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Timeline</h2>
        <div className="space-y-3">
          {timelineEvents.map((event, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${idx === timelineEvents.length - 1 ? 'bg-cyan-500' : 'bg-gray-400'}`}></div>
                {idx < timelineEvents.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1"></div>}
              </div>
              <div className="flex-1 pb-3">
                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                {event.description && <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(event.time).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {reporterEvidence.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Evidence from reporter</h2>
          <div className="grid grid-cols-4 gap-2">
            {reporterEvidence.filter(e => e.evidence_type === 'photo').map(e => (
              <a key={e.id} href={e.url_or_text} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                <img src={e.url_or_text} alt="evidence" className="w-full h-full object-cover rounded" />
              </a>
            ))}
          </div>
        </div>
      )}

      {reportedEvidence.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Response from respondent</h2>
          {reportedEvidence.filter(e => e.evidence_type === 'note').map(e => (
            <div key={e.id} className="bg-gray-50 border border-gray-200 rounded p-4 mb-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{e.url_or_text}</p>
            </div>
          ))}
          <div className="grid grid-cols-4 gap-2">
            {reportedEvidence.filter(e => e.evidence_type === 'photo').map(e => (
              <a key={e.id} href={e.url_or_text} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                <img src={e.url_or_text} alt="evidence" className="w-full h-full object-cover rounded" />
              </a>
            ))}
          </div>
        </div>
      )}

      {report.admin_notes && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Admin decision</h2>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{report.admin_notes}</p>
            {capturedAmount !== null && (
              <p className="text-xs text-blue-700 mt-2">Captured: ${capturedAmount.toFixed(2)}</p>
            )}
          </div>
        </div>
      )}

      {showResponseModal && report && (
        <DamageResponseModal
          reportId={report.id}
          respondingUserId={currentUserId}
          claimedAmount={claimedAmount}
          reporterName={report.reporter_type === 'host' ? 'The host' : 'The renter'}
          description={report.description}
          bookingId={report.booking_id}
          onClose={() => setShowResponseModal(false)}
          onSuccess={() => { setShowResponseModal(false); fetchData(); }}
        />
      )}
    </div>
  );
};

export default DamageDetailPage;
