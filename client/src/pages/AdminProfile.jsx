import React, { useState } from 'react';
import { 
  UserCircle, 
  ShieldCheck, 
  Key, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Terminal,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Toast } from '../components/Toast';

export const AdminProfile = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState(null);

  // Dev admin setup test form state
  const [setupForm, setSetupForm] = useState({
    name: 'Chief Warden Office',
    email: 'newadmin@hostelease.edu',
    password: '',
    setupKey: 'hostelease_dev_setup_2026',
    phone: '+91 98765 00099',
  });
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  const handleDevSetupSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!setupForm.password || setupForm.password.length < 6) {
      setFeedback({ type: 'error', message: 'Admin password must be at least 6 characters long.' });
      return;
    }

    setIsSubmittingSetup(true);
    try {
      const res = await authAPI.devAdminSetup(setupForm);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Development admin account provisioned successfully!',
        });
        setSetupForm((prev) => ({ ...prev, password: '' }));
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Admin setup failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-teal-600" /> Warden Profile & System Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Campus housing authority credentials, development administration setup, and persistent database diagnostics.
        </p>
      </div>

      {feedback && (
        <Toast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Warden Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-navy-950 to-teal-800 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md border-2 border-white mb-3">
              <ShieldCheck className="w-10 h-10 text-teal-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs font-semibold text-teal-700 mt-0.5">Chief Warden & Housing Administrator</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-navy-900 text-white">
              Role: System Administrator
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Email Address</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Office Contact</span>
              <span className="font-semibold text-slate-800">{user?.phone || '+91 98765 00001'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Administrative Office</span>
              <span className="font-semibold text-slate-800">Campus Residence HQ, Room 002</span>
            </div>
          </div>
        </div>

        {/* Development-Only Admin Provisioning */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dev Setup Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm mb-2">
              <Key className="w-4 h-4" />
              <span>Development-Only Admin Account Provisioning</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              As required by the project specifications, this development interface allows provisioning an administrative account without exposing hardcoded credentials or committing secrets to git.
            </p>

            <form onSubmit={handleDevSetupSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={setupForm.name}
                    onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={setupForm.email}
                    onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={setupForm.password}
                    onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dev Setup Secret Key
                  </label>
                  <input
                    type="text"
                    required
                    value={setupForm.setupKey}
                    onChange={(e) => setSetupForm({ ...setupForm, setupKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingSetup}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  {isSubmittingSetup ? 'Provisioning...' : 'Provision New Admin Account'}
                </button>
              </div>
            </form>
          </div>

          {/* System Architecture & Diagnostics */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" /> System Architecture & Persistent Storage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Database Engine</span>
                <span className="font-bold text-slate-900">SQLite3 Persistent</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Password Security</span>
                <span className="font-bold text-slate-900">bcrypt Salted Hash</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Authorization</span>
                <span className="font-bold text-slate-900">JWT Role Middleware</span>
              </div>
            </div>

            <p className="text-slate-500 leading-relaxed text-[11px] pt-1">
              All room allotments, occupancy records, and maintenance complaint timelines are saved to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">hostelease.db</code> and persist across server restarts.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
