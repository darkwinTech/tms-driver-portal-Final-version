import { useEffect, useState } from 'react';
import { listPendingUsers, approveUser, rejectUser } from '../../api/users.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import { formatDateTime } from '../../utils/statusColors.js';

export default function PendingApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  function load() {
    setLoading(true);
    listPendingUsers()
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    setBusyId(id);
    try {
      await approveUser(id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await rejectUser(rejecting.id, reason.trim() || undefined);
      setRejecting(null);
      setReason('');
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Pending Approvals</h2>
        <p className="text-sm text-gray-500">Transporter company registrations awaiting review.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <Spinner full={false} />
        ) : rows.length === 0 ? (
          <EmptyState message="No pending registrations" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-2 text-left">Contact</th>
                <th className="px-5 py-2 text-left">Email</th>
                <th className="px-5 py-2 text-left">Company</th>
                <th className="px-5 py-2 text-left">Contract Number</th>
                <th className="px-5 py-2 text-left">Submitted</th>
                <th className="px-5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-medium">{u.fullName}</td>
                  <td className="px-5 py-2.5">{u.email}</td>
                  <td className="px-5 py-2.5">{u.companyName}</td>
                  <td className="px-5 py-2.5">{u.contractNumber}</td>
                  <td className="px-5 py-2.5">{formatDateTime(u.createdAt)}</td>
                  <td className="px-5 py-2.5 text-right space-x-2">
                    <button
                      disabled={busyId === u.id}
                      onClick={() => handleApprove(u.id)}
                      className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === u.id}
                      onClick={() => setRejecting(u)}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title={`Reject ${rejecting?.companyName || ''}`}
        footer={
          <>
            <button onClick={() => setRejecting(null)} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm">
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={busyId === rejecting?.id}
              className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Explain why this registration is being rejected..."
        />
      </Modal>
    </div>
  );
}
