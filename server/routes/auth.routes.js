const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 1. Student Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, student_id, department, year_of_study, gender, phone } = req.body;

    // Validation
    if (!name || !email || !password || !student_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and Student ID are required fields.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Check if email already registered
    const existingEmail = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Check if Student ID already exists
    const existingStudentId = await get('SELECT id FROM users WHERE student_id = ?', [student_id.trim().toUpperCase()]);
    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: 'A student with this Student ID is already registered.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student (strictly hardcode role = 'student' to prevent client privilege tampering)
    const result = await run(
      `INSERT INTO users (name, email, password, role, student_id, department, year_of_study, gender, phone)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        student_id.trim().toUpperCase(),
        department || 'General Engineering',
        Number(year_of_study) || 1,
        gender || 'Other',
        phone || '',
      ]
    );

    const newUser = await get(
      `SELECT id, name, email, role, student_id, department, year_of_study, gender, phone, created_at 
       FROM users WHERE id = ?`,
      [result.id]
    );

    // Welcome Notification
    await run(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'info')`,
      [
        newUser.id,
        'Welcome to HostelEase!',
        'Your student account is active. You can now browse available hostel rooms and submit room allotment requests.',
      ]
    );

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
});

// 2. Login (Supports both Student & Warden roles with verification)
router.post('/login', async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password.',
      });
    }

    const user = await get(
      `SELECT id, name, email, password, role, student_id, department, year_of_study, gender, phone, created_at 
       FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Role check: If login portal specified expectedRole (e.g. Warden vs Student), ensure role matches
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `This login portal is for ${expectedRole}s. Your account is registered as a ${user.role}.`,
      });
    }

    // Password verification
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Fetch active room allocation if student
    let activeAllocation = null;
    if (user.role === 'student') {
      activeAllocation = await get(
        `SELECT ra.id AS allocation_id, ra.allocated_at, r.room_number, r.floor, r.room_type, h.name AS hostel_name, h.code AS hostel_code
         FROM room_allocations ra
         JOIN rooms r ON ra.room_id = r.id
         JOIN hostels h ON r.hostel_id = h.id
         WHERE ra.student_id = ? AND ra.status = 'Active'`,
        [user.id]
      );
    }

    // Don't send password hash back to client
    delete user.password;

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        ...user,
        activeAllocation,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

// 3. Get Current Authenticated User & Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let activeAllocation = null;
    if (req.user.role === 'student') {
      activeAllocation = await get(
        `SELECT ra.id AS allocation_id, ra.allocated_at, r.room_number, r.floor, r.room_type, h.name AS hostel_name, h.code AS hostel_code
         FROM room_allocations ra
         JOIN rooms r ON ra.room_id = r.id
         JOIN hostels h ON r.hostel_id = h.id
         WHERE ra.student_id = ? AND ra.status = 'Active'`,
        [req.user.id]
      );
    }

    return res.status(200).json({
      success: true,
      user: {
        ...req.user,
        activeAllocation,
      },
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.',
    });
  }
});

// 4. Development-only Admin Setup Endpoint
// Allows bootstrapping an admin or changing credentials securely in development
router.post('/dev-admin-setup', async (req, res) => {
  try {
    const { setupKey, name, email, password, phone } = req.body;

    // Secret verification for dev setup
    const DEV_SECRET = process.env.DEV_SETUP_KEY || 'hostelease_dev_setup_2026';
    if (setupKey !== DEV_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid dev setup key. Unauthorized.',
      });
    }

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required for admin setup.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    if (existing) {
      await run(
        `UPDATE users SET name = ?, password = ?, role = 'admin', phone = ? WHERE id = ?`,
        [name, hashedPassword, phone || '', existing.id]
      );
      return res.status(200).json({
        success: true,
        message: `Existing user account (${email}) updated to Warden/Admin.`,
      });
    } else {
      const created = await run(
        `INSERT INTO users (name, email, password, role, phone)
         VALUES (?, ?, ?, 'admin', ?)`,
        [name, email.toLowerCase().trim(), hashedPassword, phone || '']
      );
      return res.status(201).json({
        success: true,
        message: `New Warden/Admin account created with ID ${created.id}.`,
      });
    }
  } catch (err) {
    console.error('Dev admin setup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete admin setup.',
    });
  }
});

module.exports = router;
