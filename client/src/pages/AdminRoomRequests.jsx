import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Bed, 
  Building2, 
  User, 
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { requestsAPI, roomsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

export const AdminRoomRequests = () => {
  const [requests, setRequests] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (hostelFilter) params.hostel_id = hostelFilter;
      if (typeFilter) params.room_type = typeFilter;
      if (search) params.search = search;

      const [reqRes, hostRes] = await Promise.all([
        requestsAPI.getAllRequests(params),
        roomsAPI.getHostels(),
      ]);

      if (reqRes.success) {
        setRequests(reqRes.requests || []);
      }
      if (hostRes.success) {
        setHostels(hostRes.hostels || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      setFeedback({ type: 'error', message: 'Failed to load room requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, hostelFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRequests();
  };

  // Open Approve Modal & Fetch Available Rooms in the requested hostel
  const handleOpenApproveModal = async (request) => {
    setApprovingRequest(request);
    setSelectedRoomId('');
    setActionLoading(true);

    try {
      const res = await roomsAPI.getRooms({
        hostel_id: request.hostel_id,
        status: 'Available',
      });

      if (res.success) {
        // Filter rooms that have room.occupied < room.capacity
        const validRooms = (res.rooms || []).filter(
          (r) => r.capacity > r.occupied && r.status !== 'Maintenance'
        );
        setAvailableRooms(validRooms);
        if (validRooms.length > 0) {
          // Pre-select first matching room type if possible
          const matching = validRooms.find((r) => r.room_type === request.room_type) || validRooms[0];
          setSelectedRoomId(matching.id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to load eligible rooms:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Approval
  const handleConfirmApproval = async () => {
    if (!selectedRoomId) {
      setFeedback({ type: 'error', message: 'Please select a room to assign.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await requestsAPI.approveRequest(approvingRequest.id, Number(selectedRoomId));
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Request ${approvingRequest.request_code} approved! Bed allocated successfully in Room ${res.request.assigned_room_number}.`,
        });
        setApprovingRequest(null);
        await loadRequests();
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Approval failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Rejection
  const handleConfirmRejection = async () => {
    setActionLoading(true);
    try {
      const res = await requestsAPI.rejectRequest(rejectingRequest.id, rejectionReason);
      if (res.success) {
        setFeedback({
          type: 'info',
          message: `Request ${rejectingRequest.request_code} has been rejected. Student notified.`,
        });
        setRejectingRequest(null);
        setRejectionReason('');
        await loadRequests();
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Rejection failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-teal-600" /> Room Allotment Request Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review, approve, or reject student room applications with automatic room bed allocation and capacity validation.
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
              placeholder="Search by student name, roll number, or request code..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors cursor-pointer shrink-0"
          >
            Search Records
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-2">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Status buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {['', 'Pending', 'Approved', 'Rejected'].map((st) => (
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
                {st || 'All Statuses'}
              </button>
            ))}
          </div>

          {/* Hostel Filter */}
          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">All Hostel Blocks</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Room Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">All Room Types</option>
            <option value="Single">Single</option>
            <option value="Double Sharing">Double Sharing</option>
            <option value="Triple Sharing">Triple Sharing</option>
          </select>

          {(statusFilter || hostelFilter || typeFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setHostelFilter('');
                setTypeFilter('');
                setSearch('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Student Allotment Requests</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {requests.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {requests.filter((r) => r.status === 'Pending').length} pending review
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Request Code</th>
                <th className="px-6 py-3 font-semibold">Student Details</th>
                <th className="px-6 py-3 font-semibold">Preference</th>
                <th className="px-6 py-3 font-semibold">Floor / Special Needs</th>
                <th className="px-6 py-3 font-semibold">Submission Date</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Loading requests from database...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No room requests matching the selected filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {req.request_code}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.student_name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">
                        {req.student_roll} • {req.student_department} (Yr {req.student_year})
                      </div>
                      <div className="text-slate-400 text-[10px]">{req.student_email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{req.hostel_name}</div>
                      <div className="text-teal-700 font-medium text-[11px]">{req.room_type}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 max-w-xs">
                      <div>Floor: <span className="font-semibold text-slate-800">{req.preferred_floor ? `Floor ${req.preferred_floor}` : 'Any'}</span></div>
                      {req.additional_requirements ? (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                          "{req.additional_requirements}"
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No special needs noted</div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                      {req.status === 'Approved' && req.assigned_room_number && (
                        <div className="text-[11px] font-bold text-emerald-700 mt-1">
                          Room {req.assigned_room_number}
                        </div>
                      )}
                      {req.status === 'Rejected' && req.rejection_reason && (
                        <div className="text-[10px] text-rose-600 mt-1 truncate max-w-[150px]" title={req.rejection_reason}>
                          {req.rejection_reason}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(req)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectionReason('Requested room category is currently full. Please submit an application for double sharing.');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Reviewed
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

      {/* Approve Modal: Safe Room Assignment */}
      <Modal
        isOpen={!!approvingRequest}
        onClose={() => setApprovingRequest(null)}
        title="Approve Room Allotment"
        subtitle={`Application: ${approvingRequest?.request_code} — ${approvingRequest?.student_name}`}
      >
        {approvingRequest && (
          <div className="space-y-4">
            
            {/* Applicant Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900">{approvingRequest.student_name} ({approvingRequest.student_roll})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hostel Requested:</span>
                <span className="font-semibold text-slate-800">{approvingRequest.hostel_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Preferred Room Type:</span>
                <span className="font-semibold text-teal-700">{approvingRequest.room_type} (Pref Floor: {approvingRequest.preferred_floor || 'Any'})</span>
              </div>
            </div>

            {/* Room Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Select Available Room to Allocate *
              </label>

              {availableRooms.length === 0 ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    No available rooms found in {approvingRequest.hostel_name} with free capacity. You may need to create a new room or reject the request.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {availableRooms.map((room) => {
                      const freeBeds = room.capacity - room.occupied;
                      return (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number} (Floor {room.floor}) — {room.room_type} [{room.occupied}/{room.capacity} beds filled, {freeBeds} free]
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-teal-600" />
                    Allocating will atomically increment occupancy and notify the student.
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || availableRooms.length === 0}
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {actionLoading ? 'Allocating Room...' : 'Confirm Room Allotment'}
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="Reject Room Application"
        subtitle={`Application: ${rejectingRequest?.request_code} — ${rejectingRequest?.student_name}`}
      >
        {rejectingRequest && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Please provide a clear reason for the rejection. This explanation will be visible on the student's dashboard.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Single room category is currently full. Please re-apply for Double Sharing."
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
