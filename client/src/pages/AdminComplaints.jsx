import React, { useState, useEffect } from 'react';
import { 
  MessageSquareWarning, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertCircle, 
  ChevronRight, 
  Send,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { complaintsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updatingComplaint, setUpdatingComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('In Progress');
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const categories = ['Electrical', 'Plumbing', 'Cleanliness', 'Internet', 'Furniture', 'Other'];
  const priorities = ['High', 'Medium', 'Low'];

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;

      const res = await complaintsAPI.getAllComplaints(params);
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setFeedback({ type: 'error', message: 'Failed to retrieve complaints.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleOpenUpdateModal = (complaint) => {
    setUpdatingComplaint(complaint);
    setNewStatus(complaint.status === 'Pending' ? 'In Progress' : 'Resolved');
    setResolutionNote(
      complaint.status === 'Pending' 
        ? 'Assigned to campus maintenance technician. Inspection scheduled.' 
        : 'Maintenance completed and verified by hostel staff.'
    );
  };

  const handleConfirmStatusUpdate = async () => {
    if (!newStatus) return;

    setActionLoading(true);
    try {
      const res = await complaintsAPI.updateStatus(
        updatingComplaint.id,
        newStatus,
        resolutionNote
      );

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Complaint ${updatingComplaint.complaint_code} updated to ${newStatus}.`,
        });
        setUpdatingComplaint(null);
        await loadComplaints();
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Status update failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewTimeline = async (complaintId) => {
    try {
      const res = await complaintsAPI.getComplaintById(complaintId);
      if (res.success) {
        setSelectedComplaint(res.complaint);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <MessageSquareWarning className="w-6 h-6 text-rose-600" /> Hostel Complaint & Maintenance Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review student maintenance tickets, dispatch facility technicians, and track resolution timelines.
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
              placeholder="Search by student name, room number, or ticket code..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors cursor-pointer shrink-0"
          >
            Search Complaints
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-2">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Status buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {['', 'Pending', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st || 'all'}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p} Priority</option>
            ))}
          </select>

          {(statusFilter || categoryFilter || priorityFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setCategoryFilter('');
                setPriorityFilter('');
                setSearch('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Maintenance Tickets</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {complaints.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {complaints.filter((c) => c.status !== 'Resolved').length} open tickets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Ticket ID</th>
                <th className="px-6 py-3 font-semibold">Student & Room</th>
                <th className="px-6 py-3 font-semibold">Issue Title & Category</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Reported Date</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Loading complaints...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No complaints matching the criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {cmp.complaint_code}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{cmp.student_name}</div>
                      <div className="text-slate-500 text-[11px]">
                        Room <strong className="text-slate-800">{cmp.room_number}</strong> ({cmp.hostel_block})
                      </div>
                      <div className="text-slate-400 text-[10px]">{cmp.student_phone}</div>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-slate-800 truncate" title={cmp.title}>
                        {cmp.title}
                      </div>
                      <div className="text-teal-700 font-semibold text-[11px] mt-0.5">
                        {cmp.category}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={cmp.priority} type="priority" />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={cmp.status} />
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(cmp.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewTimeline(cmp.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        Timeline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenUpdateModal(cmp)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer shadow-xs"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Complaint Status Modal */}
      <Modal
        isOpen={!!updatingComplaint}
        onClose={() => setUpdatingComplaint(null)}
        title="Update Complaint Progress"
        subtitle={`Ticket: ${updatingComplaint?.complaint_code} — ${updatingComplaint?.title}`}
      >
        {updatingComplaint && (
          <div className="space-y-4 text-xs">
            
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div>Student: <strong className="text-slate-900">{updatingComplaint.student_name}</strong></div>
              <div>Location: <strong>{updatingComplaint.hostel_block} (Room {updatingComplaint.room_number})</strong></div>
              <div>Category: <strong>{updatingComplaint.category}</strong> (Priority: {updatingComplaint.priority})</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Target Status *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Pending', 'In Progress', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-3 rounded-xl font-semibold border text-center transition-all ${
                      newStatus === st
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Resolution Note / Maintenance Remarks *
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Electrician dispatched, replaced faulty breaker switch on 17 Oct."
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This note will be logged in the public status timeline and notified to the student.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdatingComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmStatusUpdate}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {actionLoading ? 'Saving...' : 'Save Status & Notify Student'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Timeline Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Ticket ${selectedComplaint.complaint_code}` : ''}
        subtitle="Complete Activity Log & Resolution Timeline"
      >
        {selectedComplaint && (
          <div className="space-y-5 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{selectedComplaint.title}</span>
                <StatusBadge status={selectedComplaint.status} />
              </div>
              <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100 mt-1">
                "{selectedComplaint.description}"
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3">
                Timeline History
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedComplaint.history?.map((step, idx) => (
                  <div key={step.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-slate-800 font-semibold">
                        <span>{step.status}</span>
                        <span className="text-[10px] text-slate-400">{new Date(step.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
