import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bed, 
  Building2, 
  FileText, 
  MessageSquareWarning, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Activity, 
  BarChart3,
  Layers
} from 'lucide-react';
import { statsAPI } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await statsAPI.getAdminStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Calculating live hostel statistics from database...</p>
      </div>
    );
  }

  const occupancyRate = stats?.totalCapacity > 0 
    ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" /> Warden Administrative Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time residence occupancy, room allotment workflow, and maintenance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => onNavigate('admin-requests')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Review Requests ({stats?.pendingRequests || 0})
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={stats?.totalStudents || 0}
          subtitle={`${stats?.totalAllocations || 0} currently housed`}
          icon={Users}
          color="navy"
          onClick={() => onNavigate('admin-students')}
        />
        <StatCard
          title="Bed Capacity & Occupancy"
          value={`${stats?.totalOccupied || 0} / ${stats?.totalCapacity || 0}`}
          subtitle={`${stats?.availableBeds || 0} beds available (${occupancyRate}% full)`}
          icon={Bed}
          color="teal"
          onClick={() => onNavigate('admin-rooms')}
        />
        <StatCard
          title="Pending Room Requests"
          value={stats?.pendingRequests || 0}
          subtitle={`${stats?.approvedRequests || 0} approved this term`}
          icon={Clock}
          color={stats?.pendingRequests > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigate('admin-requests')}
        />
        <StatCard
          title="Unresolved Complaints"
          value={stats?.unresolvedComplaints || 0}
          subtitle={`${stats?.resolvedComplaints || 0} resolved`}
          icon={MessageSquareWarning}
          color={stats?.unresolvedComplaints > 0 ? 'rose' : 'teal'}
          onClick={() => onNavigate('admin-complaints')}
        />
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hostel Block Occupancy Progress Bars */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" /> Hostel Block Occupancy Meter
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current student capacity vs allocated beds per block
              </p>
            </div>
            <button
              onClick={() => onNavigate('admin-rooms')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Manage Rooms
            </button>
          </div>

          <div className="space-y-4">
            {stats?.hostelOccupancy?.map((h) => {
              const pct = h.capacity > 0 ? Math.round((h.occupied / h.capacity) * 100) : 0;
              return (
                <div key={h.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {h.name} <span className="text-slate-400 font-mono">({h.code})</span>
                    </span>
                    <span className="text-slate-500 font-medium">
                      <strong className="text-slate-900">{h.occupied}</strong> / {h.capacity} beds ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        pct >= 90
                          ? 'bg-rose-500'
                          : pct >= 60
                          ? 'bg-teal-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{h.available} beds free</span>
                    <span>Status: {h.available === 0 ? 'Full' : 'Accepting Applications'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complaints Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-600" /> Complaints by Category
            </h2>
          </div>

          <div className="space-y-3">
            {stats?.complaintsByCategory?.length > 0 ? (
              stats.complaintsByCategory.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">{cat.category}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700">
                    {cat.count} {cat.count === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active complaints filed.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('admin-complaints')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Open Complaints Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Recent Activity Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" /> Recent Campus Residence Activity Feed
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live updates of student room requests and maintenance tickets
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {stats?.recentActivity?.length > 0 ? (
            stats.recentActivity.map((item, idx) => (
              <div key={`${item.type}-${item.id}-${idx}`} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.type === 'request'
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.type === 'request' ? <Bed className="w-4 h-4" /> : <MessageSquareWarning className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{item.code}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-800">{item.student_name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-500 mt-0.5 text-[11px]">{item.extra_info}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activity found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
