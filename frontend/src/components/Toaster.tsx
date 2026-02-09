import { useEffect } from 'react';
import { useToast } from '../hooks/use-toats';

const Toaster = () => {
  const { toasts, dismiss } = useToast();

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.open) {
        const timer = setTimeout(() => {
          dismiss(toast.id);
        }, 15000); // 15 segundos

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, dismiss]);

  return (
    <div className="toast toast-bottom toast-end z-50 mr-4">
      {toasts.map(({ id, title, description, variant, open }) => {
        if (!open) return null;

        const variantClasses = {
          success: 'bg-neo-secondary text-black border-2 border-black',
          error: 'bg-red-500 text-white border-2 border-black',
          info: 'bg-neo-blue text-neo-secondary border-2 border-black',
        };

        return (
          <div
            key={id}
            className={`alert ${variantClasses[variant || 'info']} shadow-lg mb-2 max-w-sm`}
          >
            <div>
              {title && <h3 className="font-bold text-sm">{title}</h3>}
              {description && <div className="text-xs">{description}</div>}
            </div>
            <div className="flex-none">
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => dismiss(id)}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;