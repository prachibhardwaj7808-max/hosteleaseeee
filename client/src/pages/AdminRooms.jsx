import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  Plus, 
  Users, 
  Search, 
  Filter, 
  Wrench, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';
import { roomsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

export const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [submittingRoom, setSubmittingRoom] = useState(false);

  // Add Room form state
  const [newRoomData, setNewRoomData] = useState({
    hostel_id: '',
    room_number: '',
    floor: '1',
    room_type: 'Double Sharing',
    capacity: '2',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedHostel) params.hostel_id = selectedHostel;
      if (selectedType) params.room_type = selectedType;
      if (selectedStatus) params.status = selectedStatus;
      if (search) params.search = search;

      const [roomsRes, hostelsRes] = await Promise.all([
        roomsAPI.getRooms(params),
        roomsAPI.getHostels(),
      ]);

      if (roomsRes.success) {
        setRooms(roomsRes.rooms || []);
      }
      if (hostelsRes.success) {
        setHostels(hostelsRes.hostels || []);
        if (hostelsRes.hostels?.length > 0 && !newRoomData.hostel_id) {
          setNewRoomData((prev) => ({ ...prev, hostel_id: hostelsRes.hostels[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error('Failed to load room management data:', err);
      setFeedback({ type: 'error', message: 'Failed to load rooms.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHostel, selectedType, selectedStatus]);

  const handleRoomTypeChange = (type) => {
    let cap = '2';
    if (type === 'Single') cap = '1';
    if (type === 'Triple Sharing') cap = '3';
    setNewRoomData((prev) => ({
      ...prev,
      room_type: type,
      capacity: cap,
    }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!newRoomData.hostel_id || !newRoomData.room_number) {
      setFeedback({ type: 'error', message: 'Hostel and room number are required.' });
      return;
    }

    setSubmittingRoom(true);
    try {
      const res = await roomsAPI.createRoom({
        hostel_id: Number(newRoomData.hostel_id),
        room_number: newRoomData.room_number.trim(),
        floor: Number(newRoomData.floor),
        room_type: newRoomData.room_type,
        capacity: Number(newRoomData.capacity),
        notes: newRoomData.notes,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Room ${newRoomData.room_number} added successfully.`,
        });
        setIsAddModalOpen(false);
        setNewRoomData((prev) => ({ ...prev, room_number: '', notes: '' }));
        await loadData();
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to create room.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleViewOccupants = async (roomId) => {
    try {
      const res = await roomsAPI.getRoomById(roomId);
      if (res.success) {
        setSelectedRoomDetail(res.room);
      }
    } catch (err) {
      console.error('Failed to load room occupants:', err);
    }
  };

  const handleToggleMaintenance = async (room) => {
    const newStatus = room.status === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      await roomsAPI.updateRoom(room.id, { status: newStatus });
      setFeedback({
        type: 'info',
        message: `Room ${room.room_number} status set to ${newStatus}.`,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-teal-600" /> Hostel Room & Capacity Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain hostel inventory, inspect bed occupancy limits, and view residing students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      {feedback && (
        <Toast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Hostel Blocks Live Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hostels.map((h) => {
          const occPct = h.total_capacity > 0 
            ? Math.round((h.total_occupied / h.total_capacity) * 100) 
            : 0;

          return (
            <div
              key={h.id}
              onClick={() => setSelectedHostel(selectedHostel === h.id.toString() ? '' : h.id.toString())}
              className={`p-4 rounded-2xl bg-white border shadow-xs transition-all cursor-pointer ${
                selectedHostel === h.id.toString()
                  ? 'border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{h.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {h.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{h.gender_type} Residence</p>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Occupancy:</span>
                  <span className="font-bold text-slate-900">
                    {h.total_occupied} / {h.total_capacity} beds ({occPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, occPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-teal-700 font-semibold pt-0.5">
                  <span>{h.total_rooms} Rooms</span>
                  <span>{h.available_beds} beds free</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room number or hostel..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <select
          value={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
        >
          <option value="">All Hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
        >
          <option value="">All Room Types</option>
          <option value="Single">Single (1 Bed)</option>
          <option value="Double Sharing">Double Sharing (2 Beds)</option>
          <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Full">Full</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        {(selectedHostel || selectedType || selectedStatus || search) && (
          <button
            onClick={() => {
              setSelectedHostel('');
              setSelectedType('');
              setSelectedStatus('');
              setSearch('');
            }}
            className="text-rose-600 hover:text-rose-700 font-semibold underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Rooms Inventory</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {rooms.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Room No</th>
                <th className="px-6 py-3 font-semibold">Hostel Block</th>
                <th className="px-6 py-3 font-semibold">Floor</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Bed Occupancy</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Loading rooms...
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No rooms found matching the criteria.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => {
                  const free = room.capacity - room.occupied;
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900 text-sm">
                        {room.room_number}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800">
                        {room.hostel_name}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        Floor {room.floor}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {room.room_type}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {room.occupied} / {room.capacity}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({free > 0 ? `${free} free` : 'full'})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={room.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleViewOccupants(room.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Occupants ({room.occupied})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMaintenance(room)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            room.status === 'Maintenance'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          {room.status === 'Maintenance' ? 'Set Available' : 'Maintenance'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Room Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Hostel Room"
        subtitle="Create a new room in the campus hostel inventory"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hostel Block *
            </label>
            <select
              required
              value={newRoomData.hostel_id}
              onChange={(e) => setNewRoomData({ ...newRoomData, hostel_id: e.target.value })}
              className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.gender_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                value={newRoomData.room_number}
                onChange={(e) => setNewRoomData({ ...newRoomData, room_number: e.target.value })}
                placeholder="e.g. 104 or 302"
                className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Floor *
              </label>
              <select
                value={newRoomData.floor}
                onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="1">Floor 1</option>
                <option value="2">Floor 2</option>
                <option value="3">Floor 3</option>
                <option value="4">Floor 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room Sharing Type *
              </label>
              <select
                value={newRoomData.room_type}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Single">Single Room</option>
                <option value="Double Sharing">Double Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Capacity (Beds) *
              </label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={newRoomData.capacity}
                onChange={(e) => setNewRoomData({ ...newRoomData, capacity: e.target.value })}
                className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={newRoomData.notes}
              onChange={(e) => setNewRoomData({ ...newRoomData, notes: e.target.value })}
              placeholder="e.g. Balcony attached, corner room"
              className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRoom}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submittingRoom ? 'Saving...' : 'Add Room to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Room Occupants View Modal */}
      <Modal
        isOpen={!!selectedRoomDetail}
        onClose={() => setSelectedRoomDetail(null)}
        title={selectedRoomDetail ? `Room ${selectedRoomDetail.room_number} Occupants` : ''}
        subtitle={selectedRoomDetail ? `${selectedRoomDetail.hostel_name} — Floor ${selectedRoomDetail.floor} (${selectedRoomDetail.room_type})` : ''}
      >
        {selectedRoomDetail && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span>Occupancy Status:</span>
              <span className="font-bold text-slate-900">
                {selectedRoomDetail.occupied} of {selectedRoomDetail.capacity} beds filled
              </span>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Residing Students</h4>
              {selectedRoomDetail.occupants?.length > 0 ? (
                <div className="space-y-2">
                  {selectedRoomDetail.occupants.map((occ) => (
                    <div key={occ.id} className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{occ.name}</p>
                        <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                          {occ.student_id} • {occ.department} (Yr {occ.year_of_study})
                        </p>
                        <p className="text-slate-400 text-[10px]">{occ.email} • {occ.phone}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Since {new Date(occ.allocated_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 italic bg-slate-50 rounded-xl">
                  This room is currently empty with 0 occupants.
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRoomDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
