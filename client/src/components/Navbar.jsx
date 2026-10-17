import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X, 
  CheckCheck, 
  ShieldCheck, 
  GraduationCap 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';

export const Navbar = ({ onToggleSidebar, isMobileMenuOpen }) => {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await notificationsAPI.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err.message);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark single read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-navy-900 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
              <Building2 className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-navy-900 tracking-tight">HostelEase</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 hidden sm:block -mt-1">
                College Hostel Allotment & Complaint System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role indicator, Notifications, User profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Role Badge */}
          <div className="hidden md:flex items-center">
            {role === 'admin' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-900 text-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Warden / Admin Portal
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                Student Portal
              </span>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1 hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifs ? (
                    <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
                        className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.is_read ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs uppercase border border-navy-200">
              {user?.name ? user.name.charAt(0) : <User className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {user?.role === 'admin' ? 'Warden' : user?.student_id || 'Student'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
