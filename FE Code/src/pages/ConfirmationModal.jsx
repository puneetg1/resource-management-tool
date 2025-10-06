import React from 'react';
import './RecordModal.css'; // We can reuse the same CSS for a consistent look

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm', // ✅ ADDED: Default text for the confirm button
  cancelText = 'Cancel'    // ✅ ADDED: Default text for the cancel button
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {title || 'Confirm Action'}
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn secondary">
            {cancelText} {/* ✅ Use the prop here */}
          </button>
          <button type="button" onClick={onConfirm} className="btn danger">
            {confirmText} {/* ✅ Use the prop here */}
          </button>
        </div>
      </div>
    </div>
  );
}