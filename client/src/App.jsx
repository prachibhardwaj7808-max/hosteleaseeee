import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentRoomRequest } from './pages/StudentRoomRequest';
import { StudentComplaints } from './pages/StudentComplaints';
import { StudentProfile } from './pages/StudentProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminRoomRequests } from './pages/AdminRoomRequests';
import { AdminRooms } from './pages/AdminRooms';
import { AdminComplaints } from './pages/AdminComplaints';
import { AdminStudents } from './pages/AdminStudents';
import { AdminProfile } from './pages/AdminProfile';

const MainApp = () => {
  const { isAuthenticated, role, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('student-dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Set default tab on login based on role
  useEffect(() => {
    if (role === 'admin') {
      setActiveTab('admin-dashboard');
    } else if (role === 'student') {
      setActiveTab('student-dashboard');
    }
  }, [role]);

  // Loading spinner while verifying token
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider text-slate-300">Initializing HostelEase...</p>
      </div>
    );
  }

  // If unauthenticated, show Login or Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <Login onNavigateToRegister={() => setAuthView('register')} />;
  }

  // Page Routing & Strict Role Guard
  const renderContent = () => {
    if (role === 'admin') {
      switch (activeTab) {
        case 'admin-dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'admin-requests':
          return <AdminRoomRequests />;
        case 'admin-rooms':
          return <AdminRooms />;
        case 'admin-complaints':
          return <AdminComplaints />;
        case 'admin-students':
          return <AdminStudents />;
        case 'admin-profile':
          return <AdminProfile />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    } else {
      // Student routes
      switch (activeTab) {
        case 'student-dashboard':
          return <StudentDashboard onNavigate={setActiveTab} />;
        case 'student-request':
          return <StudentRoomRequest />;
        case 'student-complaints':
          return <StudentComplaints />;
        case 'student-profile':
          return <StudentProfile />;
        default:
          return <StudentDashboard onNavigate={setActiveTab} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200/80 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-500">
              HostelEase — Hostel Room Allotment & Complaint Management System
            </p>
            <p>
              B.Tech First-Year Engineering Project • Built with React, Vite, Tailwind CSS, Express & SQLite
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
