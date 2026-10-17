import React from 'react';
import { 
  LayoutDashboard, 
  Bed, 
  FileText, 
  MessageSquareWarning, 
  Users, 
  Building, 
  UserCircle, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, isMobileMenuOpen, onCloseMobileMenu }) => {
  const { role, user } = useAuth();

  const studentNavItems = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-request', label: 'Room Allotment', icon: Bed, badge: 'Form' },
    { id: 'student-complaints', label: 'Complaints', icon: MessageSquareWarning },
    { id: 'student-profile', label: 'My Profile & Room', icon: UserCircle },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'admin-requests', label: 'Room Requests', icon: FileText, badge: 'Workflow' },
    { id: 'admin-rooms', label: 'Room Management', icon: Building },
    { id: 'admin-complaints', label: 'Complaints Tracker', icon: MessageSquareWarning },
    { id: 'admin-students', label: 'Student Directory', icon: Users },
    { id: 'admin-profile', label: 'Warden Profile & Setup', icon: UserCircle },
  ];

  const navItems = role === 'admin' ? adminNavItems : studentNavItems;

  const handleSelect = (id) => {
    setActiveTab(id);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Portal Branding */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              HE
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">HostelEase</p>
              <p className="text-[11px] text-teal-400 font-medium">
                {role === 'admin' ? 'Chief Warden Console' : 'Student Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Main Menu
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-300 border border-teal-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Card: College Hostels Info */}
        <div className="p-4 m-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>Campus Residences</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Aryabhata (Boys), Gargi (Girls), Ramanujan & Sarojini Blocks.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Helpline</span>
            <span className="font-mono text-slate-300">ext. 4001</span>
          </div>
        </div>

        {/* User Mini Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-300 uppercase">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
};
