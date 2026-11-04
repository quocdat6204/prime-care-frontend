import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { translateErrorMessage } from '../utils/errorMessage';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    const safeMessage = typeof message === 'string'
      ? translateErrorMessage(message, type === 'error' ? 'Đã có lỗi xảy ra, vui lòng thử lại!' : message)
      : 'Thông báo hệ thống';

    setToasts((prev) => [...prev, { id, message: safeMessage, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  const icons = {
    success: <CheckCircle size={18} color="#10b981" />,
    error: <AlertCircle size={18} color="#ef4444" />,
    warning: <AlertTriangle size={18} color="#f59e0b" />,
    info: <Info size={18} color="#3b82f6" />,
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {icons[toast.type]}
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
