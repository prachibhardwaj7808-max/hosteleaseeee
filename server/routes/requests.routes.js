const express = require('express');
const { run, get, all, exec } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. Submit Room Request (Student only)
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { hostel_id, room_type, preferred_floor, additional_requirements } = req.body;

    // Validate fields
    if (!hostel_id || !room_type) {
      return res.status(400).json({
        success: false,
        message: 'Hostel block and room type are required.',
      });
    }

    const validRoomTypes = ['Single', 'Double Sharing', 'Triple Sharing'];
    if (!validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room type selected.',
      });
    }

    // Check if student already has an active room allocation
    const existingAllocation = await get(
      `SELECT ra.id, r.room_number, h.name AS hostel_name
       FROM room_allocations ra
       JOIN rooms r ON ra.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE ra.student_id = ? AND ra.status = 'Active'`,
      [studentId]
    );

    if (existingAllocation) {
      return res.status(400).json({
        success: false,
        message: `You already have an active room allocation (${existingAllocation.room_number} in ${existingAllocation.hostel_name}). Please contact the warden if you require a room change.`,
      });
    }

    // Check if student already has a pending request
    const pendingRequest = await get(
      `SELECT id, request_code FROM room_requests WHERE student_id = ? AND status = 'Pending'`,
      [studentId]
    );

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have an active pending room request (${pendingRequest.request_code}). Please wait for warden review.`,
      });
    }

    // Verify hostel exists
    const hostel = await get(`SELECT id, name FROM hostels WHERE id = ?`, [hostel_id]);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Selected hostel does not exist.' });
    }

    // Generate unique request code: REQ-YYYY-RANDOM
    const year = new Date().getFullYear();
    const countRow = await get(`SELECT COUNT(*) AS total FROM room_requests`);
    const nextNum = (countRow.total + 1).toString().padStart(3, '0');
    const requestCode = `REQ-${year}-${nextNum}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await run(
      `INSERT INTO room_requests (
        request_code, student_id, hostel_id, room_type, preferred_floor, additional_requirements, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        requestCode,
        studentId,
        hostel_id,
        room_type,
        preferred_floor ? Number(preferred_floor) : null,
        additional_requirements ? additional_requirements.trim() : '',
      ]
    );

    // Create confirmation notification for student
    await run(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'info')`,
      [
        studentId,
        'Room Request Submitted',
        `Your allotment request (${requestCode}) for ${room_type} in ${hostel.name} has been submitted. Status: Pending.`,
      ]
    );

    const createdRequest = await get(
      `SELECT rr.*, h.name AS hostel_name, h.code AS hostel_code
       FROM room_requests rr
       JOIN hostels h ON rr.hostel_id = h.id
       WHERE rr.id = ?`,
      [result.id]
    );

    return res.status(201).json({
      success: true,
      message: `Room allotment request ${requestCode} submitted successfully.`,
      request: createdRequest,
    });
  } catch (err) {
    console.error('Submit room request error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit room request. Please try again.',
    });
  }
});

// 2. Get Student's Own Room Requests (Student)
router.get('/my-requests', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const requests = await all(
      `SELECT 
        rr.*,
        h.name AS hostel_name,
        h.code AS hostel_code,
        r.room_number AS assigned_room_number,
        r.floor AS assigned_room_floor,
        w.name AS reviewer_name
       FROM room_requests rr
       JOIN hostels h ON rr.hostel_id = h.id
       LEFT JOIN rooms r ON rr.assigned_room_id = r.id
       LEFT JOIN users w ON rr.reviewed_by = w.id
       WHERE rr.student_id = ?
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error('Fetch my requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your room requests.' });
  }
});

// 3. Get All Room Requests (Admin / Warden) with Search and Filters
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, hostel_id, room_type, search } = req.query;

    let query = `
      SELECT 
        rr.*,
        u.name AS student_name,
        u.email AS student_email,
        u.student_id AS student_roll,
        u.department AS student_department,
        u.year_of_study AS student_year,
        u.gender AS student_gender,
        u.phone AS student_phone,
        h.name AS hostel_name,
        h.code AS hostel_code,
        r.room_number AS assigned_room_number,
        w.name AS reviewer_name
      FROM room_requests rr
      JOIN users u ON rr.student_id = u.id
      JOIN hostels h ON rr.hostel_id = h.id
      LEFT JOIN rooms r ON rr.assigned_room_id = r.id
      LEFT JOIN users w ON rr.reviewed_by = w.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND rr.status = ?`;
      params.push(status);
    }

    if (hostel_id) {
      query += ` AND rr.hostel_id = ?`;
      params.push(hostel_id);
    }

    if (room_type) {
      query += ` AND rr.room_type = ?`;
      params.push(room_type);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.student_id LIKE ? OR rr.request_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY CASE rr.status WHEN 'Pending' THEN 1 WHEN 'Approved' THEN 2 ELSE 3 END, rr.created_at DESC`;

    const requests = await all(query, params);

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error('Fetch all requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve room requests.' });
  }
});

// 4. Admin Approve Room Request
router.put('/:id/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  const requestId = req.params.id;
  const adminId = req.user.id;
  const { room_id } = req.body;

  if (!room_id) {
    return res.status(400).json({
      success: false,
      message: 'Please select an available room to allocate to this student.',
    });
  }

  try {
    // 1. Fetch Request
    const request = await get(`SELECT * FROM room_requests WHERE id = ?`, [requestId]);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Room request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status.toLowerCase()}. Cannot re-approve.`,
      });
    }

    // 2. Check if student already has active allocation
    const existingAlloc = await get(
      `SELECT id FROM room_allocations WHERE student_id = ? AND status = 'Active'`,
      [request.student_id]
    );
    if (existingAlloc) {
      return res.status(400).json({
        success: false,
        message: 'This student already has an active room allocation.',
      });
    }

    // 3. Check selected room capacity & status
    const room = await get(
      `SELECT r.*, h.name AS hostel_name 
       FROM rooms r 
       JOIN hostels h ON r.hostel_id = h.id 
       WHERE r.id = ?`,
      [room_id]
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Selected room not found.' });
    }

    if (room.status === 'Maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Selected room is currently marked as Maintenance and cannot be allocated.',
      });
    }

    if (room.occupied >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: `Room ${room.room_number} is already at full capacity (${room.occupied}/${room.capacity}). Please select another room.`,
      });
    }

    // 4. Execute atomic allocation
    await exec('BEGIN TRANSACTION;');

    try {
      // Re-verify under transaction
      const liveRoom = await get(`SELECT capacity, occupied FROM rooms WHERE id = ?`, [room_id]);
      if (liveRoom.occupied >= liveRoom.capacity) {
        throw new Error(`Room is full (${liveRoom.occupied}/${liveRoom.capacity}).`);
      }

      const newOccupied = liveRoom.occupied + 1;
      const newStatus = newOccupied >= liveRoom.capacity ? 'Full' : 'Available';

      // Update room occupancy
      await run(
        `UPDATE rooms SET occupied = ?, status = ? WHERE id = ?`,
        [newOccupied, newStatus, room_id]
      );

      // Create allocation record
      await run(
        `INSERT INTO room_allocations (student_id, room_id, request_id, status)
         VALUES (?, ?, ?, 'Active')`,
        [request.student_id, room_id, requestId]
      );

      // Update request status
      await run(
        `UPDATE room_requests 
         SET status = 'Approved', assigned_room_id = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [room_id, adminId, requestId]
      );

      // Send student in-app notification
      await run(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'success')`,
        [
          request.student_id,
          'Room Allotment Approved! 🎉',
          `Your room request (${request.request_code}) has been approved! You have been allocated Room ${room.room_number} (Floor ${room.floor}) in ${room.hostel_name}.`,
        ]
      );

      await exec('COMMIT;');

      const updatedRequest = await get(
        `SELECT rr.*, h.name AS hostel_name, r.room_number AS assigned_room_number, w.name AS reviewer_name
         FROM room_requests rr
         JOIN hostels h ON rr.hostel_id = h.id
         LEFT JOIN rooms r ON rr.assigned_room_id = r.id
         LEFT JOIN users w ON rr.reviewed_by = w.id
         WHERE rr.id = ?`,
        [requestId]
      );

      return res.status(200).json({
        success: true,
        message: `Room ${room.room_number} allocated and request approved successfully.`,
        request: updatedRequest,
      });
    } catch (txErr) {
      await exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    console.error('Approve request error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to approve room request.',
    });
  }
});

// 5. Admin Reject Room Request
router.put('/:id/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  const requestId = req.params.id;
  const adminId = req.user.id;
  const { reason } = req.body;

  try {
    const request = await get(`SELECT * FROM room_requests WHERE id = ?`, [requestId]);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Room request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status.toLowerCase()}. Cannot reject.`,
      });
    }

    const rejectionReason = reason && reason.trim() ? reason.trim() : 'Requested room category or hostel block is currently unavailable.';

    await run(
      `UPDATE room_requests 
       SET status = 'Rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [rejectionReason, adminId, requestId]
    );

    // Notify student
    await run(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'warning')`,
      [
        request.student_id,
        'Room Request Status Update',
        `Your room request (${request.request_code}) was not approved. Reason: ${rejectionReason}`,
      ]
    );

    const updatedRequest = await get(
      `SELECT rr.*, h.name AS hostel_name, w.name AS reviewer_name
       FROM room_requests rr
       JOIN hostels h ON rr.hostel_id = h.id
       LEFT JOIN users w ON rr.reviewed_by = w.id
       WHERE rr.id = ?`,
      [requestId]
    );

    return res.status(200).json({
      success: true,
      message: 'Room request rejected.',
      request: updatedRequest,
    });
  } catch (err) {
    console.error('Reject request error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject room request.',
    });
  }
});

module.exports = router;
