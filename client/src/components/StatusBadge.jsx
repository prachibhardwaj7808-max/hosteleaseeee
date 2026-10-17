import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Wrench, 
  ShieldAlert,
  Bed,
  Check
} from 'lucide-react';

export const StatusBadge = ({ status, type = 'status', className = '' }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  // 1. Status Badges
  if (type === 'status') {
    switch (normalized) {
      case 'pending':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 ${className}`}>
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 ${className}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'in progress':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/60 ${className}`}>
            <Wrench className="w-3.5 h-3.5 text-sky-600" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 ${className}`}>
            <Check className="w-3.5 h-3.5 text-teal-600" />
            Resolved
          </span>
        );
      case 'available':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}>
            <Bed className="w-3.5 h-3.5 text-emerald-600" />
            Available
          </span>
        );
      case 'full':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            Full
          </span>
        );
      case 'maintenance':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 ${className}`}>
            {status}
          </span>
        );
    }
  }

  // 2. Priority Badges
  if (type === 'priority') {
    switch (normalized) {
      case 'high':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
            Medium
          </span>
        );
      case 'low':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
            Low
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  }

  return <span>{status}</span>;
};
