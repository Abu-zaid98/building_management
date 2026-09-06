import React from 'react';
import Modal from './Modal';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: 'danger' | 'warning';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  loading = false,
  type = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div className={`confirm-icon ${type}`}>
          <FiAlertTriangle />
        </div>
        <h4 className="confirm-title">{title}</h4>
        <p className="confirm-text" style={{ whiteSpace: 'pre-line' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={onConfirm}
            className={`btn ${type === 'danger' ? 'btn-danger' : type === 'warning' ? 'btn-warning' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? 'جارٍ التنفيذ...' : confirmText}
          </button>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
