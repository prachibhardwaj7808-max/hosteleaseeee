const express = require('express');
const { all, get } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. Get all students with their room allocation and statistics (Admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { department, year, allocated, search } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.student_id,
        u.department,
        u.year_of_study,
        u.gender,
        u.phone,
        u.created_at,
        ra.id AS allocation_id,
        ra.allocated_at,
        r.room_number,
        r.floor,
        r.room_type,
        h.name AS hostel_name,
        h.code AS hostel_code,
        (SELECT COUNT(*) FROM room_requests rr WHERE rr.student_id = u.id) AS total_requests,
        (SELECT COUNT(*) FROM complaints c WHERE c.student_id = u.id) AS total_complaints,
        (SELECT COUNT(*) FROM complaints c WHERE c.student_id = u.id AND c.status = 'Resolved') AS resolved_complaints
      FROM users u
      LEFT JOIN room_allocations ra ON u.id = ra.student_id AND ra.status = 'Active'
      LEFT JOIN rooms r ON ra.room_id = r.id
      LEFT JOIN hostels h ON r.hostel_id = h.id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (department) {
      query += ` AND u.department = ?`;
      params.push(department);
    }

    if (year) {
      query += ` AND u.year_of_study = ?`;
      params.push(Number(year));
    }

    if (allocated === 'yes') {
      query += ` AND ra.id IS NOT NULL`;
    } else if (allocated === 'no') {
      query += ` AND ra.id IS NULL`;
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.student_id LIKE ? OR u.email LIKE ? OR r.room_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.name ASC`;

    const students = await all(query, params);

    return res.status(200).json({
      success: true,
      students,
    });
  } catch (err) {
    console.error('Fetch students error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve students list.' });
  }
});

// 2. Get Single Student Profile and History (Admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const student = await get(
      `SELECT u.id, u.name, u.email, u.student_id, u.department, u.year_of_study, u.gender, u.phone, u.created_at
       FROM users u
       WHERE u.id = ? AND u.role = 'student'`,
      [req.params.id]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Active room allocation
    const allocation = await get(
      `SELECT ra.*, r.room_number, r.floor, r.room_type, h.name AS hostel_name, h.code AS hostel_code
       FROM room_allocations ra
       JOIN rooms r ON ra.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE ra.student_id = ? AND ra.status = 'Active'`,
      [student.id]
    );

    // Requests
    const requests = await all(
      `SELECT rr.*, h.name AS hostel_name, r.room_number AS assigned_room_number
       FROM room_requests rr
       JOIN hostels h ON rr.hostel_id = h.id
       LEFT JOIN rooms r ON rr.assigned_room_id = r.id
       WHERE rr.student_id = ?
       ORDER BY rr.created_at DESC`,
      [student.id]
    );

    // Complaints
    const complaints = await all(
      `SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC`,
      [student.id]
    );

    return res.status(200).json({
      success: true,
      student: {
        ...student,
        allocation,
        requests,
        complaints,
      },
    });
  } catch (err) {
    console.error('Fetch student detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student details.' });
  }
});

module.exports = router;
