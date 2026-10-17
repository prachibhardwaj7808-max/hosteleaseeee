const express = require('express');
const { run, get, all } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. Get all Hostels / Blocks
router.get('/hostels', authenticateToken, async (req, res) => {
  try {
    const hostels = await all(`
      SELECT 
        h.*,
        COUNT(DISTINCT r.id) AS total_rooms,
        COALESCE(SUM(r.capacity), 0) AS total_capacity,
        COALESCE(SUM(r.occupied), 0) AS total_occupied,
        COALESCE(SUM(r.capacity - r.occupied), 0) AS available_beds
      FROM hostels h
      LEFT JOIN rooms r ON h.id = r.hostel_id
      GROUP BY h.id
      ORDER BY h.name ASC
    `);

    return res.status(200).json({
      success: true,
      hostels,
    });
  } catch (err) {
    console.error('Fetch hostels error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve hostels.' });
  }
});

// 2. Get Rooms with optional filters (hostel_id, room_type, status, floor)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hostel_id, room_type, status, floor, search } = req.query;

    let query = `
      SELECT 
        r.*,
        h.name AS hostel_name,
        h.code AS hostel_code,
        h.gender_type,
        (r.capacity - r.occupied) AS available_beds
      FROM rooms r
      JOIN hostels h ON r.hostel_id = h.id
      WHERE 1=1
    `;
    const params = [];

    if (hostel_id) {
      query += ` AND r.hostel_id = ?`;
      params.push(hostel_id);
    }

    if (room_type) {
      query += ` AND r.room_type = ?`;
      params.push(room_type);
    }

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (floor) {
      query += ` AND r.floor = ?`;
      params.push(Number(floor));
    }

    if (search) {
      query += ` AND (r.room_number LIKE ? OR h.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY h.name ASC, r.floor ASC, r.room_number ASC`;

    const rooms = await all(query, params);

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (err) {
    console.error('Fetch rooms error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve rooms.' });
  }
});

// 3. Get single room details with occupants (Students in this room)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const room = await get(
      `SELECT r.*, h.name AS hostel_name, h.code AS hostel_code, h.gender_type
       FROM rooms r
       JOIN hostels h ON r.hostel_id = h.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Get current occupants
    const occupants = await all(
      `SELECT u.id, u.name, u.email, u.student_id, u.department, u.year_of_study, u.phone, ra.allocated_at
       FROM room_allocations ra
       JOIN users u ON ra.student_id = u.id
       WHERE ra.room_id = ? AND ra.status = 'Active'`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      room: {
        ...room,
        occupants,
      },
    });
  } catch (err) {
    console.error('Fetch room details error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve room details.' });
  }
});

// 4. Admin: Add New Room
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { hostel_id, room_number, floor, room_type, capacity, notes } = req.body;

    if (!hostel_id || !room_number || !floor || !room_type || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Hostel, room number, floor, room type, and capacity are required.',
      });
    }

    // Check duplicate
    const existing = await get(
      `SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ?`,
      [hostel_id, room_number.trim()]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Room ${room_number} already exists in this hostel block.`,
      });
    }

    const result = await run(
      `INSERT INTO rooms (hostel_id, room_number, floor, room_type, capacity, occupied, status, notes)
       VALUES (?, ?, ?, ?, ?, 0, 'Available', ?)`,
      [hostel_id, room_number.trim(), Number(floor), room_type, Number(capacity), notes || '']
    );

    const newRoom = await get(`SELECT * FROM rooms WHERE id = ?`, [result.id]);

    return res.status(201).json({
      success: true,
      message: `Room ${room_number} created successfully.`,
      room: newRoom,
    });
  } catch (err) {
    console.error('Create room error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create room.' });
  }
});

// 5. Admin: Update Room Status (e.g. Maintenance) or Notes
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const roomId = req.params.id;

    const room = await get(`SELECT * FROM rooms WHERE id = ?`, [roomId]);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // If changing status to Maintenance, ensure it is permitted
    let newStatus = status || room.status;
    if (newStatus === 'Available' && room.occupied >= room.capacity) {
      newStatus = 'Full';
    }

    await run(
      `UPDATE rooms SET status = ?, notes = ? WHERE id = ?`,
      [newStatus, notes !== undefined ? notes : room.notes, roomId]
    );

    const updated = await get(`SELECT * FROM rooms WHERE id = ?`, [roomId]);

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully.',
      room: updated,
    });
  } catch (err) {
    console.error('Update room error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update room.' });
  }
});

module.exports = router;
