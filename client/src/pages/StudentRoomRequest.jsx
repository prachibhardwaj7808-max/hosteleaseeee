import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Building2, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, roomsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';

export const StudentRoomRequest = () => {
  const { user, refreshUser } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const [formData, setFormData] = useState({
    hostel_id: '',
    room_type: 'Double Sharing',
    preferred_floor: '1',
    additional_requirements: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [hostelsRes, requestsRes] = await Promise.all([
        roomsAPI.getHostels(),
        requestsAPI.getMyRequests(),
      ]);

      if (hostelsRes.success) {
        setHostels(hostelsRes.hostels || []);
        if (hostelsRes.hostels?.length > 0 && !formData.hostel_id) {
          // Default to first hostel matching student gender if possible
          const matched = hostelsRes.hostels.find(
            (h) => h.gender_type.toLowerCase() === (user?.gender || '').toLowerCase()
          ) || hostelsRes.hostels[0];
          setFormData((prev) => ({ ...prev, hostel_id: matched.id.toString() }));
        }
      }

      if (requestsRes.success) {
        setMyRequests(requestsRes.requests || []);
      }
    } catch (err) {
      console.error('Failed to load room request data:', err);
      setFeedback({ type: 'error', message: 'Failed to load hostels list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.hostel_id) {
      setFeedback({ type: 'error', message: 'Please select a preferred hostel block.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestsAPI.submitRequest({
        hostel_id: Number(formData.hostel_id),
        room_type: formData.room_type,
        preferred_floor: Number(formData.preferred_floor),
        additional_requirements: formData.additional_requirements,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Request ${res.request.request_code} successfully submitted! The Warden office will review your application.`,
        });
        setFormData((prev) => ({ ...prev, additional_requirements: '' }));
        // Reload requests & refresh user session
        await loadData();
        await refreshUser();
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Submission failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveAllocation = !!user?.activeAllocation;
  const hasPendingRequest = myRequests.some((r) => r.status === 'Pending');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bed className="w-6 h-6 text-teal-600" /> Hostel Room Allotment Application
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Submit your preference for hostel residence, sharing type, and floor for the upcoming semester.
        </p>
      </div>

      {/* Notice Banners */}
      {hasActiveAllocation && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">You already have an active room allocation!</p>
            <p className="mt-0.5">
              Assigned: Room <span className="font-bold">{user.activeAllocation.room_number}</span> in{' '}
              <span className="font-bold">{user.activeAllocation.hostel_name}</span>. If you require a room swap or transfer, please contact the Chief Warden directly.
            </p>
          </div>
        </div>
      )}

      {hasPendingRequest && !hasActiveAllocation && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Application Under Review</p>
            <p className="mt-0.5">
              You already have a pending room request being processed by the Warden office. You cannot submit multiple concurrent applications.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <Toast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Main Grid: Form on Left, Guidelines on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Room Request Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Allotment Request Form</h2>
            <span className="text-xs text-slate-400 font-medium">* Required fields</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Student Verified Details (Read Only) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-600" /> Student Verification Details
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Student Name</span>
                  <span className="font-semibold text-slate-800">{user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Student ID / Roll</span>
                  <span className="font-mono font-semibold text-teal-700">{user?.student_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <span className="font-semibold text-slate-800 truncate block">{user?.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Year & Gender</span>
                  <span className="font-semibold text-slate-800">
                    Year {user?.year_of_study} • {user?.gender}
                  </span>
                </div>
              </div>
            </div>

            {/* Hostel Block Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Hostel / Block *
              </label>
              <select
                required
                name="hostel_id"
                value={formData.hostel_id}
                onChange={handleChange}
                disabled={hasActiveAllocation || hasPendingRequest}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.gender_type} — {h.available_beds} beds available)
                  </option>
                ))}
              </select>
            </div>

            {/* Room Type & Floor Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Room Sharing Type *
                </label>
                <select
                  required
                  name="room_type"
                  value={formData.room_type}
                  onChange={handleChange}
                  disabled={hasActiveAllocation || hasPendingRequest}
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
                >
                  <option value="Single">Single Room (1 Bed)</option>
                  <option value="Double Sharing">Double Sharing (2 Beds)</option>
                  <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Floor
                </label>
                <select
                  name="preferred_floor"
                  value={formData.preferred_floor}
                  onChange={handleChange}
                  disabled={hasActiveAllocation || hasPendingRequest}
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
                >
                  <option value="1">1st Floor (Ground / Low)</option>
                  <option value="2">2nd Floor</option>
                  <option value="3">3rd Floor</option>
                  <option value="4">4th Floor (Top)</option>
                </select>
              </div>
            </div>

            {/* Additional Requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Special Needs / Additional Requirements (Optional)
              </label>
              <textarea
                rows={3}
                name="additional_requirements"
                value={formData.additional_requirements}
                onChange={handleChange}
                disabled={hasActiveAllocation || hasPendingRequest}
                placeholder="e.g. Near corner study area, ground floor preference due to sports injury, etc."
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || hasActiveAllocation || hasPendingRequest}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Room Allotment Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Allotment Policy & Info Card */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs border border-slate-800">
            <h3 className="text-sm font-bold flex items-center gap-2 text-teal-300 mb-3">
              <Sparkles className="w-4 h-4" /> Allotment Guidelines
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">•</span>
                <span>Requests are prioritized based on academic year and application submission order.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">•</span>
                <span>Single occupancy rooms have limited availability and are verified by the warden.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">•</span>
                <span>Room occupancy is capped strictly to capacity to prevent overcrowding.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">•</span>
                <span>Once approved, bed details are automatically linked to your student profile.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-xs">
            <h4 className="font-bold text-slate-900 mb-2">Hostel Blocks Overview</h4>
            <div className="space-y-2 text-slate-600">
              {hostels.map((h) => (
                <div key={h.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{h.name}</p>
                    <p className="text-[11px] text-slate-400">{h.gender_type} • {h.total_floors} Floors</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700">
                    {h.available_beds} beds free
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Student Request History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" /> My Room Request History
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {myRequests.length} {myRequests.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Request ID</th>
                <th className="px-6 py-3 font-semibold">Hostel Block</th>
                <th className="px-6 py-3 font-semibold">Room Type</th>
                <th className="px-6 py-3 font-semibold">Pref. Floor</th>
                <th className="px-6 py-3 font-semibold">Submitted On</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Allocation / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading requests...
                  </td>
                </tr>
              ) : myRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    You have not submitted any room allotment requests yet.
                  </td>
                </tr>
              ) : (
                myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {req.request_code}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">
                      {req.hostel_name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {req.room_type}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      Floor {req.preferred_floor || 'Any'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {req.status === 'Approved' && (
                        <span className="font-semibold text-emerald-700">
                          Allocated: Room {req.assigned_room_number} (Floor {req.assigned_room_floor})
                        </span>
                      )}
                      {req.status === 'Rejected' && (
                        <span className="text-rose-600">
                          {req.rejection_reason || 'No specific reason provided.'}
                        </span>
                      )}
                      {req.status === 'Pending' && (
                        <span className="text-slate-400 italic">
                          Awaiting warden review
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
