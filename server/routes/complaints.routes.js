const express = require('express');
const { run, get, all } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = ['Electrical', 'Plumbing', 'Cleanliness', 'Internet', 'Furniture', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved'];

// 1. Submit a New Complaint (Student only)
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { title, category, hostel_block, room_number, description, priority } = req.body;

    if (!title || !category || !hostel_block || !room_number || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, hostel block, room number, and description are required.',
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    const complaintPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'Medium';

    // Generate unique complaint code: CMP-YYYY-NUM
    const year = new Date().getFullYear();
    const countRow = await get(`SELECT COUNT(*) AS total FROM complaints`);
    const nextNum = (countRow.total + 1).toString().padStart(3, '0');
    const complaintCode = `CMP-${year}-${nextNum}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await run(
      `INSERT INTO complaints (
        complaint_code, student_id, title, category, hostel_block, room_number, description, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        complaintCode,
        studentId,
        title.trim(),
        category,
        hostel_block.trim(),
        room_number.trim(),
        description.trim(),
        complaintPriority,
      ]
    );

    const complaintId = result.id;

    // Log initial history step
    await run(
      `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
       VALUES (?, 'Pending', 'Complaint registered by student.', ?)`,
      [complaintId, studentId]
    );

    // Create in-app confirmation notification
    await run(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'info')`,
      [
        studentId,
        'Complaint Registered',
        `Your complaint (${complaintCode}) "${title.trim()}" has been received. Status: Pending.`,
      ]
    );

    const createdComplaint = await get(`SELECT * FROM complaints WHERE id = ?`, [complaintId]);

    return res.status(201).json({
      success: true,
      message: `Complaint ${complaintCode} registered successfully.`,
      complaint: createdComplaint,
    });
  } catch (err) {
    console.error('Submit complaint error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit complaint. Please try again.',
    });
  }
});

// 2. Get Student's Own Complaints (Student)
router.get('/my-complaints', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const complaints = await all(
      `SELECT c.*, u.name AS resolver_name
       FROM complaints c
       LEFT JOIN users u ON c.resolved_by = u.id
       WHERE c.student_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (err) {
    console.error('Fetch my complaints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your complaints.' });
  }
});

// 3. Get All Complaints with Search & Filter (Admin / Warden)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;

    let query = `
      SELECT 
        c.*,
        u.name AS student_name,
        u.email AS student_email,
        u.student_id AS student_roll,
        u.phone AS student_phone,
        w.name AS resolver_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users w ON c.resolved_by = w.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (priority) {
      query += ` AND c.priority = ?`;
      params.push(priority);
    }

    if (search) {
      query += ` AND (c.title LIKE ? OR c.complaint_code LIKE ? OR u.name LIKE ? OR c.room_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY 
      CASE c.status 
        WHEN 'Pending' THEN 1 
        WHEN 'In Progress' THEN 2 
        ELSE 3 
      END,
      CASE c.priority 
        WHEN 'High' THEN 1 
        WHEN 'Medium' THEN 2 
        ELSE 3 
      END,
      c.created_at DESC`;

    const complaints = await all(query, params);

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (err) {
    console.error('Fetch all complaints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve complaints.' });
  }
});

// 4. Get Single Complaint Details + Timeline History (Student & Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const complaintId = req.params.id;

    const complaint = await get(
      `SELECT 
        c.*,
        u.name AS student_name,
        u.email AS student_email,
        u.student_id AS student_roll,
        u.phone AS student_phone,
        w.name AS resolver_name
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       LEFT JOIN users w ON c.resolved_by = w.id
       WHERE c.id = ?`,
      [complaintId]
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Role check: Student can only view their own complaint
    if (req.user.role === 'student' && complaint.student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this complaint.' });
    }

    // Fetch status history timeline
    const history = await all(
      `SELECT csh.*, u.name AS updated_by_name, u.role AS updated_by_role
       FROM complaint_status_history csh
       LEFT JOIN users u ON csh.updated_by = u.id
       WHERE csh.complaint_id = ?
       ORDER BY csh.created_at ASC`,
      [complaintId]
    );

    return res.status(200).json({
      success: true,
      complaint: {
        ...complaint,
        history,
      },
    });
  } catch (err) {
    console.error('Fetch complaint details error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve complaint details.' });
  }
});

// 5. Update Complaint Status & Add Resolution Note (Admin / Warden)
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const adminId = req.user.id;
    const { status, note } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Valid status is required (${VALID_STATUSES.join(', ')}).`,
      });
    }

    const complaint = await get(`SELECT * FROM complaints WHERE id = ?`, [complaintId]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const resolutionNote = note && note.trim() ? note.trim() : (status === 'Resolved' ? 'Issue resolved by hostel maintenance staff.' : 'Status updated by warden.');

    // Update complaint
    if (status === 'Resolved') {
      await run(
        `UPDATE complaints 
         SET status = ?, resolution_note = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, resolutionNote, adminId, complaintId]
      );
    } else {
      await run(
        `UPDATE complaints 
         SET status = ?, resolution_note = ?, resolved_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, resolutionNote, adminId, complaintId]
      );
    }

    // Add to history timeline
    await run(
      `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
       VALUES (?, ?, ?, ?)`,
      [complaintId, status, resolutionNote, adminId]
    );

    // Notify student
    const notifType = status === 'Resolved' ? 'success' : 'info';
    await run(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        complaint.student_id,
        `Complaint Update: ${status}`,
        `Your complaint (${complaint.complaint_code}) "${complaint.title}" is now marked as ${status}. Note: ${resolutionNote}`,
        notifType,
      ]
    );

    const updatedComplaint = await get(
      `SELECT c.*, w.name AS resolver_name
       FROM complaints c
       LEFT JOIN users w ON c.resolved_by = w.id
       WHERE c.id = ?`,
      [complaintId]
    );

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      complaint: updatedComplaint,
    });
  } catch (err) {
    console.error('Update complaint status error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.',
    });
  }
});

module.exports = router;
