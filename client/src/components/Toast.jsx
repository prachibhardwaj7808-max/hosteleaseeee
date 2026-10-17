import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ type = 'info', message, onClose, className = '' }) => {
  if (!message) return null;

  const config = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      icon: Info,
      iconColor: 'text-teal-600',
    },
  }[type] || {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-800',
    icon: Info,
    iconColor: 'text-slate-600',
  };

  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${config.border} ${config.text} text-sm shadow-sm transition-all duration-200 ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 font-medium">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
