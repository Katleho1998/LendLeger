import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  balance: number;
  borrowerName?: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export const WriteOffLoanModal = ({ isOpen, balance, borrowerName, onConfirm, onClose }: Props) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Close &amp; Write Off Loan</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          This marks {borrowerName ? <span className="font-semibold text-slate-700">{borrowerName}'s</span> : 'this'} loan as a loss.
          It will be closed permanently and can't be reopened for payments.
        </p>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-rose-700">Amount to write off</span>
          <span className="text-xl font-bold text-rose-700">R{balance.toFixed(2)}</span>
        </div>

        <label className="block text-sm font-semibold text-slate-700 mb-2">Reason (optional)</label>
        <textarea
          className="w-full border border-slate-200 rounded-lg p-3 mb-4 text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
          rows={3}
          placeholder="e.g. Borrower untraceable, deceased, unable to pay..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onConfirm(reason);
              setSaving(false);
              onClose();
            }}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-50 hover:bg-rose-700 transition-colors"
          >
            {saving ? 'Writing off...' : 'Confirm Write Off'}
          </button>
        </div>
      </div>
    </div>
  );
};
