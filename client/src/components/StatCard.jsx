import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'teal',
  trend,
  onClick,
}) => {
  const colorStyles = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-100',
      iconBg: 'bg-teal-600',
      iconText: 'text-white',
    },
    navy: {
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      border: 'border-slate-200',
      iconBg: 'bg-navy-900',
      iconText: 'text-white',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      iconBg: 'bg-amber-500',
      iconText: 'text-white',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-600',
      iconText: 'text-white',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      iconBg: 'bg-rose-500',
      iconText: 'text-white',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-600',
      iconText: 'text-white',
    },
  }[color] || {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
    iconBg: 'bg-navy-900',
    iconText: 'text-white',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-teal-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorStyles.iconBg} ${colorStyles.iconText} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>{trend.label}</span>
          <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-slate-700'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
};
