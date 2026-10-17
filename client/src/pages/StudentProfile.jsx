import React from 'react';
import { 
  UserCircle, 
  GraduationCap, 
  Mail, 
  Phone, 
  Building, 
  Bed, 
  Calendar, 
  ShieldCheck, 
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StudentProfile = () => {
  const { user } = useAuth();
  const allocation = user?.activeAllocation;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <UserCircle className="w-6 h-6 text-teal-600" /> Student Profile & Residence Record
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your enrolled academic credentials and active hostel room allotment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Student Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-navy-900 to-teal-700 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md border-2 border-white mb-3 uppercase">
              {user?.name ? user.name.charAt(0) : 'S'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs font-mono font-semibold text-teal-700 mt-0.5">{user?.student_id}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Undergraduate Student
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{user?.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{user?.department}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Year {user?.year_of_study} ({user?.gender})</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Registered: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Right: Active Allotment Certificate Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-teal-600" /> Active Campus Accommodation
            </h3>

            {allocation ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                      Confirmed Bed Allotment
                    </span>
                    <h4 className="text-xl font-extrabold text-navy-950 mt-0.5">
                      {allocation.hostel_name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Room <span className="font-bold text-teal-900 font-mono text-sm">{allocation.room_number}</span> • Floor {allocation.floor} ({allocation.room_type})
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Hostel Code</span>
                    <span className="font-mono font-bold text-slate-800">{allocation.hostel_code}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Room Number</span>
                    <span className="font-mono font-bold text-slate-800">{allocation.room_number}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Allotment Date</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(allocation.allocated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block mb-1">Hostel Rules & Security Notice:</span>
                  <p className="leading-relaxed text-[11px]">
                    Resident identity cards must be carried when entering hostel premises after 9:30 PM. Room furniture must not be swapped without written permission from the Chief Warden.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <Bed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-600">No active room allotment registered.</p>
                <p className="mt-1">Head over to the Room Allotment tab to submit your room request.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
