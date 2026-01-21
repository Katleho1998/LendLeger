import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  initialDate: string;
  onSave: (newDate: string) => Promise<void>;
  onClose: () => void;
}

export const EditDueDateModal = ({ isOpen, initialDate, onSave, onClose }: Props) => {
  const [date, setDate] = useState(initialDate ? new Date(initialDate).toISOString().slice(0,10) : '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setDate(initialDate ? new Date(initialDate).toISOString().slice(0,10) : '');
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">Edit Due Date</h3>
        <p className="text-sm text-slate-500 mb-4">Select a new due date for this loan.</p>
        <input
          type="date"
          className="w-full border border-slate-200 rounded-lg p-3 mb-4"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100">Cancel</button>
          <button
            onClick={async () => {
              setSaving(true);
              // convert to ISO
              const iso = new Date(date).toISOString();
              await onSave(iso);
              setSaving(false);
              onClose();
            }}
            disabled={!date || saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
