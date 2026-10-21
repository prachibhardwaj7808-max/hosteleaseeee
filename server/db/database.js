const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'hostelease.db');

const db = new Database(dbPath);
console.log('Connected to persistent SQLite database at:', dbPath);

// Enable SQLite Foreign Key support
db.pragma('foreign_keys = ON');

// Helper promise wrappers — keep same async/await API so no routes need changing
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      resolve({ id: result.lastInsertRowid, changes: result.changes });
    } catch (err) {
      reject(err);
    }
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      resolve(row);
    } catch (err) {
      reject(err);
    }
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
};

// exec runs multiple semicolon-separated SQL statements (used for schema init)
const exec = (sql) => {
  return new Promise((resolve, reject) => {
    try {
      db.exec(sql);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

// Initialize schema
const initDb = async () => {
  await exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
      student_id TEXT UNIQUE,
      department TEXT,
      year_of_study INTEGER,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
      phone TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Hostels / Blocks table
    CREATE TABLE IF NOT EXISTS hostels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      gender_type TEXT NOT NULL CHECK(gender_type IN ('Boys', 'Girls', 'Co-ed')),
      total_floors INTEGER DEFAULT 4,
      warden_name TEXT,
      warden_contact TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Rooms table
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostel_id INTEGER NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
      room_number TEXT NOT NULL,
      floor INTEGER NOT NULL,
      room_type TEXT NOT NULL CHECK(room_type IN ('Single', 'Double Sharing', 'Triple Sharing')),
      capacity INTEGER NOT NULL CHECK(capacity > 0),
      occupied INTEGER NOT NULL DEFAULT 0 CHECK(occupied >= 0),
      status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'Full', 'Maintenance')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hostel_id, room_number)
    );

    -- Room allotment requests table
    CREATE TABLE IF NOT EXISTS room_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_code TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hostel_id INTEGER NOT NULL REFERENCES hostels(id),
      room_type TEXT NOT NULL CHECK(room_type IN ('Single', 'Double Sharing', 'Triple Sharing')),
      preferred_floor INTEGER,
      additional_requirements TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
      assigned_room_id INTEGER REFERENCES rooms(id),
      rejection_reason TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Active Room Allocations
    CREATE TABLE IF NOT EXISTS room_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      request_id INTEGER REFERENCES room_requests(id),
      allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Vacated'))
    );

    -- Complaints table
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_code TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Electrical', 'Plumbing', 'Cleanliness', 'Internet', 'Furniture', 'Other')),
      hostel_block TEXT NOT NULL,
      room_number TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Resolved')),
      resolution_note TEXT,
      resolved_by INTEGER REFERENCES users(id),
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Complaint Status History Timeline
    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      updated_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- In-app Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'danger')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance lookup
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
    CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
    CREATE INDEX IF NOT EXISTS idx_requests_student ON room_requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON room_requests(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_student ON complaints(student_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
  console.log('HostelEase database tables and indexes initialized.');
};

module.exports = {
  db,
  run,
  get,
  all,
  exec,
  initDb,
};
