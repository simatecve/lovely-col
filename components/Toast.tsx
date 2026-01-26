
import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(message.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message.id, onClose]);

  return (
    <div className="flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-800 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto">
      <div className="bg-emerald-500 p-1.5 rounded-full">
        <CheckCircle2 size={18} className="text-white" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest leading-none">{message.text}</p>
      <button 
        onClick={() => onClose(message.id)}
        className="ml-4 text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
