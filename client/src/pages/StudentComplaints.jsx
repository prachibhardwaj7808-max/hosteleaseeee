import React, { useState, useEffect } from 'react';
import { 
  MessageSquareWarning, 
  Send, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  Info,
  Calendar,
  UserCheck,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

export const StudentComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Selected complaint for timeline modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electrical',
    hostel_block: user?.activeAllocation?.hostel_name || 'Aryabhata Block (Boys)',
    room_number: user?.activeAllocation?.room_number || '',
    priority: 'Medium',
    description: '',
  });

  const categories = ['Electrical', 'Plumbing', 'Cleanliness', 'Internet', 'Furniture', 'Other'];
  const priorities = ['Low', 'Medium', 'High'];

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintsAPI.getMyComplaints();
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setFeedback({ type: 'error', message: 'Failed to retrieve your complaints.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    // Update default room if user allocation changes
    if (user?.activeAllocation) {
      setFormData((prev) => ({
        ...prev,
        hostel_block: user.activeAllocation.hostel_name,
        room_number: user.activeAllocation.room_number,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.title || !formData.room_number || !formData.description) {
      setFeedback({ type: 'error', message: 'Please fill in all required complaint fields.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await complaintsAPI.submitComplaint({
        title: formData.title,
        category: formData.category,
        hostel_block: formData.hostel_block,
        room_number: formData.room_number,
        priority: formData.priority,
        description: formData.description,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Complaint ${res.complaint.complaint_code} filed successfully. Status: Pending. Maintenance team has been notified.`,
        });
        setFormData((prev) => ({
          ...prev,
          title: '',
          description: '',
        }));
        await loadComplaints();
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Complaint submission failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTimeline = async (complaintId) => {
    try {
      setLoadingDetail(true);
      const res = await complaintsAPI.getComplaintById(complaintId);
      if (res.success) {
        setSelectedComplaint(res.complaint);
      }
    } catch (err) {
      console.error('Failed to view timeline:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <MessageSquareWarning className="w-6 h-6 text-rose-600" /> Hostel Complaint & Maintenance Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Report electrical, plumbing, Wi-Fi, or cleanliness issues directly to hostel staff and monitor resolution in real time.
        </p>
      </div>

      {feedback && (
        <Toast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Main Grid: Form on Left, FAQ/Service info on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Complaint Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">File a New Complaint</h2>
            <span className="text-xs text-slate-400 font-medium">* Required fields</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Complaint Title *
              </label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Bathroom light flickering or Ceiling fan capacitor burnt"
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority {p === 'High' ? '(Urgent)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hostel Block & Room Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hostel Block *
                </label>
                <input
                  type="text"
                  required
                  name="hostel_block"
                  value={formData.hostel_block}
                  onChange={handleChange}
                  placeholder="e.g. Aryabhata Block (Boys)"
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Room / Location Number *
                </label>
                <input
                  type="text"
                  required
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  placeholder="e.g. 101 or 2nd Floor Corridor"
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Issue Description *
              </label>
              <textarea
                required
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Explain the issue clearly. Mention if any technician was already called or specific timings you are available in room."
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Registering Complaint...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Complaint Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Maintenance Turnaround SLA Info */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs border border-slate-800">
            <h3 className="text-sm font-bold flex items-center gap-2 text-rose-400 mb-3">
              <Clock className="w-4 h-4" /> Resolution SLA Times
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-semibold text-white block">Electrical & Power</span>
                <span className="text-teal-300 font-medium">Within 4 - 8 Hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-semibold text-white block">Plumbing & Water Supply</span>
                <span className="text-teal-300 font-medium">Within 12 Hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-semibold text-white block">Wi-Fi & LAN Network</span>
                <span className="text-teal-300 font-medium">Same Day (IT Support)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-600" /> Interactive Status Tracker
            </h4>
            <p className="leading-relaxed">
              Click on any complaint ticket in the table below to open its live status timeline. You can review technician notes and warden updates.
            </p>
          </div>
        </div>

      </div>

      {/* Complaints History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-rose-600" /> My Reported Complaints
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {complaints.length} {complaints.length === 1 ? 'ticket' : 'tickets'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Ticket ID</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Filed Date</th>
                <th className="px-6 py-3 font-semibold text-right">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading complaints...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No maintenance complaints submitted yet. Everything looks good!
                  </td>
                </tr>
              ) : (
                complaints.map((cmp) => (
                  <tr 
                    key={cmp.id} 
                    onClick={() => handleViewTimeline(cmp.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {cmp.complaint_code}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      {cmp.title}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {cmp.category}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      Room {cmp.room_number}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={cmp.priority} type="priority" />
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={cmp.status} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(cmp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Status Timeline Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Complaint ${selectedComplaint.complaint_code}` : ''}
        subtitle="Live Maintenance Status & Resolution Timeline"
      >
        {selectedComplaint && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{selectedComplaint.title}</span>
                <StatusBadge status={selectedComplaint.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-500 pt-1">
                <div>Category: <span className="font-semibold text-slate-800">{selectedComplaint.category}</span></div>
                <div>Location: <span className="font-semibold text-slate-800">{selectedComplaint.hostel_block} (Room {selectedComplaint.room_number})</span></div>
                <div>Priority: <span className="font-semibold text-slate-800">{selectedComplaint.priority}</span></div>
                <div>Filed on: <span className="font-semibold text-slate-800">{new Date(selectedComplaint.created_at).toLocaleString()}</span></div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60">
                <p className="text-slate-400 text-[11px] mb-0.5">Problem Description:</p>
                <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100">
                  "{selectedComplaint.description}"
                </p>
              </div>
            </div>

            {/* Timeline View */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" /> Resolution Progress History
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedComplaint.history?.map((step, idx) => (
                  <div key={step.id || idx} className="relative text-xs">
                    {/* Circle icon */}
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                      step.status === 'Resolved' 
                        ? 'bg-teal-600 text-white' 
                        : (step.status === 'In Progress' ? 'bg-sky-500 text-white' : 'bg-amber-500 text-white')
                    }`}>
                      {step.status === 'Resolved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (step.status === 'In Progress' ? (
                        <Wrench className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      ))}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Status updated to {step.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(step.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{step.note}</p>
                      {step.updated_by_name && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Updated by: {step.updated_by_name} ({step.updated_by_role})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Note if resolved */}
            {selectedComplaint.resolution_note && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
                <span className="font-bold block mb-1">Warden / Maintenance Remarks:</span>
                <p>{selectedComplaint.resolution_note}</p>
              </div>
            )}

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Close Timeline
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
