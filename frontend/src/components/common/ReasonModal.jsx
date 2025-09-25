import React from 'react';

const ReasonModal = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = React.useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">ปฏิเสธชีท</h2>
        <p className="mb-4">กรุณาระบุเหตุผลในการปฏิเสธ:</p>
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="ระบุเหตุผล..."
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => onSubmit(reason)}
            disabled={!reason.trim()}
          >
            ปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
