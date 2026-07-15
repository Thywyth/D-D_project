import React, { useEffect, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

let toastIdCounter = 0;
let addToastExternal: ((message: string, type?: ToastType) => void) | null = null;

/** Global function to show toasts from anywhere (stores, hooks, etc.) */
export function showToast(message: string, type: ToastType = 'info'): void {
  addToastExternal?.(message, type);
}

export function ToastContainer(): React.ReactElement {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    addToastExternal = addToast;
    return () => { addToastExternal = null; };
  }, [addToast]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'toast visible pointer-events-auto',
            t.type === 'success' ? 'toast-success' : '',
            t.type === 'error' ? 'toast-error' : '',
            t.type === 'info' ? 'toast-info' : '',
          ].join(' ')}
          style={{ position: 'relative', left: 'auto', transform: 'none', bottom: 'auto' }}
        >
          <span className="mr-2">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✗'}
            {t.type === 'info' && 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
