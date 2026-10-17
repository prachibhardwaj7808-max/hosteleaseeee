import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  GraduationCap, 
  Bed, 
  MessageSquareWarning, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Building
} from 'lucide-react';
import { studentsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [allocatedFilter, setAllocatedFilter] = useState('');

  // Selected Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
  ];

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (departmentFilter) params.department = departmentFilter;
      if (yearFilter) params.year = yearFilter;
      if (allocatedFilter) params.allocated = allocatedFilter;
      if (search) params.search = search;

      const res = await studentsAPI.getStudents(params);
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setFeedback({ type: 'error', message: 'Failed to load student directory.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [departmentFilter, yearFilter, allocatedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleViewStudent = async (studentId) => {
    try {
      setLoadingStudent(true);
      const res = await studentsAPI.getStudentById(studentId);
      if (res.success) {
        setSelectedStudent(res.student);
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoadingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-teal-600" /> Student Directory & Residence Records
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete register of students, their current hostel room assignments, and history.
        </p>
      </div>

      {feedback && (
        <Toast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or assigned room..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors cursor-pointer shrink-0"
          >
            Search Students
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>

          {/* Allocation status */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {[
              { id: '', label: 'All Students' },
              { id: 'yes', label: 'Allocated' },
              { id: 'no', label: 'Unassigned' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setAllocatedFilter(st.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  allocatedFilter === st.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Year of study */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">All Academic Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {(departmentFilter || yearFilter || allocatedFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setDepartmentFilter('');
                setYearFilter('');
                setAllocatedFilter('');
                setSearch('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Enrolled Students</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {students.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {students.filter((s) => s.allocation_id).length} currently accommodated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Student Name</th>
                <th className="px-6 py-3 font-semibold">Student ID / Roll</th>
                <th className="px-6 py-3 font-semibold">Department & Year</th>
                <th className="px-6 py-3 font-semibold">Assigned Room</th>
                <th className="px-6 py-3 font-semibold">Requests</th>
                <th className="px-6 py-3 font-semibold">Complaints</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No student records found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-slate-400 text-[10px]">{student.email}</div>
                    </td>

                    <td className="px-6 py-3.5 font-mono font-bold text-teal-800">
                      {student.student_id}
                    </td>

                    <td className="px-6 py-3.5 text-slate-700">
                      <div>{student.department}</div>
                      <div className="text-[11px] text-slate-400">Year {student.year_of_study} • {student.gender}</div>
                    </td>

                    <td className="px-6 py-3.5">
                      {student.allocation_id ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Room {student.room_number} ({student.hostel_name})</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 bg-slate-50 border border-slate-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-slate-600">
                      <span className="font-semibold text-slate-800">{student.total_requests}</span> submitted
                    </td>

                    <td className="px-6 py-3.5 text-slate-600">
                      <span className="font-semibold text-slate-800">{student.total_complaints}</span> filed{' '}
                      {student.resolved_complaints > 0 && (
                        <span className="text-teal-700 font-semibold text-[11px]">
                          ({student.resolved_complaints} fixed)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewStudent(student.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent ? `${selectedStudent.name} (${selectedStudent.student_id})` : ''}
        subtitle="Complete Student Residence Dossier"
        maxWidth="max-w-2xl"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs">
            
            {/* Profile Overview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Email</span>
                <span className="font-medium text-slate-800 truncate block">{selectedStudent.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Phone</span>
                <span className="font-medium text-slate-800">{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Department</span>
                <span className="font-medium text-slate-800 truncate block">{selectedStudent.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Year / Gender</span>
                <span className="font-medium text-slate-800">Yr {selectedStudent.year_of_study} • {selectedStudent.gender}</span>
              </div>
            </div>

            {/* Active Accommodation */}
            <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50">
              <span className="font-bold text-teal-900 block mb-1">Active Room Allocation:</span>
              {selectedStudent.allocation ? (
                <div className="text-slate-700">
                  Residing in <strong>Room {selectedStudent.allocation.room_number}</strong> (Floor {selectedStudent.allocation.floor}, {selectedStudent.allocation.room_type}) in <strong>{selectedStudent.allocation.hostel_name}</strong> since {new Date(selectedStudent.allocation.allocated_at).toLocaleDateString()}.
                </div>
              ) : (
                <span className="text-slate-500 italic">No room allocated to this student yet.</span>
              )}
            </div>

            {/* Requests History */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Room Requests History ({selectedStudent.requests?.length || 0})</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedStudent.requests?.length > 0 ? (
                  selectedStudent.requests.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{r.request_code}</span> — {r.hostel_name} ({r.room_type})
                        {r.rejection_reason && <p className="text-rose-600 text-[10px] mt-0.5">{r.rejection_reason}</p>}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No requests submitted.</p>
                )}
              </div>
            </div>

            {/* Complaints History */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Reported Complaints ({selectedStudent.complaints?.length || 0})</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedStudent.complaints?.length > 0 ? (
                  selectedStudent.complaints.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{c.complaint_code}</span>: {c.title}
                        <p className="text-slate-400 text-[10px]">{c.category} • Room {c.room_number}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No complaints submitted.</p>
                )}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
