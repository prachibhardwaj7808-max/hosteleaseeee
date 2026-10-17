import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquareWarning, 
  ArrowRight, 
  Building2, 
  Phone, 
  UserCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export const StudentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await statsAPI.getStudentStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load student dashboard stats:', err);
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
        <p className="text-xs text-slate-500 font-medium">Loading your student dashboard...</p>
      </div>
    );
  }

  const allocation = stats?.allocation;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-teal-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> First-Year Campus Residence
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Roll No: <span className="font-mono text-teal-300">{user?.student_id}</span> • {user?.department} (Year {user?.year_of_study})
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => onNavigate('student-request')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Bed className="w-4 h-4" /> Room Allotment
            </button>
          </div>
        </div>
      </div>

      {/* Active Room Allocation Showcase Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              allocation ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'
            }`}>
              <Bed className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Allotment Status
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                {allocation ? `${allocation.hostel_name} — Room ${allocation.room_number}` : 'No Room Allocated Yet'}
              </h2>
            </div>
          </div>

          {allocation ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active Resident
            </span>
          ) : (
            <button
              onClick={() => onNavigate('student-request')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Apply for Room Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {allocation ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Room Number</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{allocation.room_number}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Floor & Type</span>
              <span className="text-sm font-semibold text-slate-900">
                Floor {allocation.floor} • {allocation.room_type}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Hostel Warden</span>
              <span className="text-sm font-semibold text-slate-900">{allocation.warden_name}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Warden Contact</span>
              <span className="text-sm font-semibold text-teal-700 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {allocation.warden_contact}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-4 text-xs text-slate-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              You do not have an active hostel bed assigned. Please submit a room request to select your preferred hostel block and room sharing type.
            </span>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Room Requests"
          value={stats?.totalRequests || 0}
          subtitle={`${stats?.pendingRequests || 0} Pending • ${stats?.approvedRequests || 0} Approved`}
          icon={Bed}
          color="navy"
          onClick={() => onNavigate('student-request')}
        />
        <StatCard
          title="Request Status"
          value={stats?.approvedRequests > 0 ? 'Approved' : (stats?.pendingRequests > 0 ? 'Pending' : 'None')}
          subtitle={stats?.approvedRequests > 0 ? 'Bed confirmed' : (stats?.pendingRequests > 0 ? 'Under review' : 'Ready to apply')}
          icon={Clock}
          color={stats?.approvedRequests > 0 ? 'emerald' : 'amber'}
          onClick={() => onNavigate('student-request')}
        />
        <StatCard
          title="Total Complaints"
          value={stats?.totalComplaints || 0}
          subtitle={`${stats?.pendingComplaints || 0} Pending • ${stats?.inProgressComplaints || 0} In Progress`}
          icon={MessageSquareWarning}
          color="rose"
          onClick={() => onNavigate('student-complaints')}
        />
        <StatCard
          title="Resolved Issues"
          value={stats?.resolvedComplaints || 0}
          subtitle="Fixed by Maintenance"
          icon={CheckCircle2}
          color="teal"
          onClick={() => onNavigate('student-complaints')}
        />
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('student-request')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Apply for Room Allotment</h4>
                <p className="text-xs text-slate-500">Choose hostel block, room type, and floor preference</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('student-complaints')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">File a Maintenance Complaint</h4>
                <p className="text-xs text-slate-500">Report electrical, plumbing, Wi-Fi or furniture issues</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Recent Activity Sections (Two Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Room Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bed className="w-4 h-4 text-teal-600" /> Recent Room Requests
            </h3>
            <button
              onClick={() => onNavigate('student-request')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              View All
            </button>
          </div>

          {stats?.recentRequests?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{req.request_code}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-slate-500 mt-1">
                      {req.hostel_name} • {req.room_type}
                      {req.assigned_room_number && (
                        <span className="text-emerald-700 font-semibold ml-1">
                          (Room {req.assigned_room_number})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No room requests submitted yet.
            </div>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-rose-600" /> Recent Complaints
            </h3>
            <button
              onClick={() => onNavigate('student-complaints')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              View All
            </button>
          </div>

          {stats?.recentComplaints?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentComplaints.map((cmp) => (
                <div key={cmp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-slate-900">{cmp.complaint_code}</span>
                      <StatusBadge status={cmp.status} />
                    </div>
                    <p className="font-medium text-slate-800 truncate">{cmp.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {cmp.category} • Room {cmp.room_number}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(cmp.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No maintenance complaints reported.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
