const express = require('express');
const { get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 1. Student Dashboard Stats
router.get('/student', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Requests breakdown
    const reqStats = await get(
      `SELECT 
        COUNT(*) AS total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved_requests,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_requests
       FROM room_requests
       WHERE student_id = ?`,
      [studentId]
    );

    // Complaints breakdown
    const cmpStats = await get(
      `SELECT 
        COUNT(*) AS total_complaints,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_complaints,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_complaints,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_complaints
       FROM complaints
       WHERE student_id = ?`,
      [studentId]
    );

    // Active room allocation
    const allocation = await get(
      `SELECT ra.allocated_at, r.room_number, r.floor, r.room_type, h.name AS hostel_name, h.code AS hostel_code, h.warden_name, h.warden_contact
       FROM room_allocations ra
       JOIN rooms r ON ra.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE ra.student_id = ? AND ra.status = 'Active'`,
      [studentId]
    );

    // Recent room requests (limit 3)
    const recentRequests = await all(
      `SELECT rr.*, h.name AS hostel_name, r.room_number AS assigned_room_number
       FROM room_requests rr
       JOIN hostels h ON rr.hostel_id = h.id
       LEFT JOIN rooms r ON rr.assigned_room_id = r.id
       WHERE rr.student_id = ?
       ORDER BY rr.created_at DESC
       LIMIT 3`,
      [studentId]
    );

    // Recent complaints (limit 3)
    const recentComplaints = await all(
      `SELECT * FROM complaints 
       WHERE student_id = ?
       ORDER BY created_at DESC
       LIMIT 3`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalRequests: reqStats.total_requests || 0,
        pendingRequests: reqStats.pending_requests || 0,
        approvedRequests: reqStats.approved_requests || 0,
        rejectedRequests: reqStats.rejected_requests || 0,
        totalComplaints: cmpStats.total_complaints || 0,
        pendingComplaints: cmpStats.pending_complaints || 0,
        inProgressComplaints: cmpStats.in_progress_complaints || 0,
        resolvedComplaints: cmpStats.resolved_complaints || 0,
        allocation: allocation || null,
        recentRequests,
        recentComplaints,
      },
    });
  } catch (err) {
    console.error('Student stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate student statistics.' });
  }
});

// 2. Admin Dashboard Stats
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    // Total Students
    const studentCount = await get(`SELECT COUNT(*) AS total FROM users WHERE role = 'student'`);

    // Total Rooms, Capacity, Occupied, Available Beds
    const roomMetrics = await get(`
      SELECT 
        COUNT(*) AS total_rooms,
        COALESCE(SUM(capacity), 0) AS total_capacity,
        COALESCE(SUM(occupied), 0) AS total_occupied,
        COALESCE(SUM(capacity - occupied), 0) AS available_beds,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_rooms,
        SUM(CASE WHEN status = 'Full' THEN 1 ELSE 0 END) AS full_rooms,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_rooms
      FROM rooms
    `);

    // Requests breakdown
    const requestMetrics = await get(`
      SELECT 
        COUNT(*) AS total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved_requests,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_requests
      FROM room_requests
    `);

    // Active Allocations
    const allocationCount = await get(`SELECT COUNT(*) AS total FROM room_allocations WHERE status = 'Active'`);

    // Complaints breakdown
    const complaintMetrics = await get(`
      SELECT 
        COUNT(*) AS total_complaints,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_complaints,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_complaints,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_complaints,
        SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) AS unresolved_complaints
      FROM complaints
    `);

    // Category distribution for complaints chart
    const complaintsByCategory = await all(`
      SELECT category, COUNT(*) AS count
      FROM complaints
      GROUP BY category
    `);

    // Hostel block occupancy summary for charts
    const hostelOccupancy = await all(`
      SELECT 
        h.name,
        h.code,
        COALESCE(SUM(r.capacity), 0) AS capacity,
        COALESCE(SUM(r.occupied), 0) AS occupied,
        COALESCE(SUM(r.capacity - r.occupied), 0) AS available
      FROM hostels h
      LEFT JOIN rooms r ON h.id = r.hostel_id
      GROUP BY h.id
    `);

    // Recent activity feed (combining recent requests & complaints)
    const recentRequests = await all(`
      SELECT 
        'request' AS type,
        rr.id,
        rr.request_code AS code,
        rr.status,
        rr.created_at,
        u.name AS student_name,
        h.name AS extra_info
      FROM room_requests rr
      JOIN users u ON rr.student_id = u.id
      JOIN hostels h ON rr.hostel_id = h.id
      ORDER BY rr.created_at DESC
      LIMIT 4
    `);

    const recentComplaints = await all(`
      SELECT 
        'complaint' AS type,
        c.id,
        c.complaint_code AS code,
        c.status,
        c.created_at,
        u.name AS student_name,
        c.title AS extra_info
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 4
    `);

    // Merge and sort
    const recentActivity = [...recentRequests, ...recentComplaints].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 6);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: studentCount.total || 0,
        totalRooms: roomMetrics.total_rooms || 0,
        totalCapacity: roomMetrics.total_capacity || 0,
        totalOccupied: roomMetrics.total_occupied || 0,
        availableBeds: roomMetrics.available_beds || 0,
        availableRooms: roomMetrics.available_rooms || 0,
        fullRooms: roomMetrics.full_rooms || 0,
        maintenanceRooms: roomMetrics.maintenance_rooms || 0,
        totalRequests: requestMetrics.total_requests || 0,
        pendingRequests: requestMetrics.pending_requests || 0,
        approvedRequests: requestMetrics.approved_requests || 0,
        rejectedRequests: requestMetrics.rejected_requests || 0,
        totalAllocations: allocationCount.total || 0,
        totalComplaints: complaintMetrics.total_complaints || 0,
        unresolvedComplaints: complaintMetrics.unresolved_complaints || 0,
        pendingComplaints: complaintMetrics.pending_complaints || 0,
        inProgressComplaints: complaintMetrics.in_progress_complaints || 0,
        resolvedComplaints: complaintMetrics.resolved_complaints || 0,
        complaintsByCategory,
        hostelOccupancy,
        recentActivity,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate admin statistics.' });
  }
});

module.exports = router;
