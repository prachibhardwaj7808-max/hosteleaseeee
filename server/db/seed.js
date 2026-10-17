const bcrypt = require('bcryptjs');
const { initDb, run, get, all, exec } = require('./database');

async function seed() {
  console.log('--- Starting HostelEase Database Seeding ---');
  await initDb();

  // Clear existing demo records to ensure fresh state if re-seeded
  await exec(`
    DELETE FROM notifications;
    DELETE FROM complaint_status_history;
    DELETE FROM complaints;
    DELETE FROM room_allocations;
    DELETE FROM room_requests;
    DELETE FROM rooms;
    DELETE FROM hostels;
    DELETE FROM users;
  `);

  console.log('Cleared existing data.');

  // 1. Create Users
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const studentPasswordHash = await bcrypt.hash('StudentPassword123!', 10);

  // Warden / Admin
  const adminRes = await run(
    `INSERT INTO users (name, email, password, role, phone)
     VALUES (?, ?, ?, 'admin', ?)`,
    ['Dr. Ramesh Sharma (Chief Warden)', 'warden@hostelease.edu', adminPasswordHash, '+91 98765 00001']
  );
  const adminId = adminRes.id;

  // Student 1: Aarav Sharma (CS)
  const student1Res = await run(
    `INSERT INTO users (name, email, password, role, student_id, department, year_of_study, gender, phone)
     VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
    ['Aarav Sharma', 'student@hostelease.edu', studentPasswordHash, '2024CS0101', 'Computer Science & Engineering', 1, 'Male', '+91 98765 43210']
  );
  const student1Id = student1Res.id;

  // Student 2: Priya Patel (EC)
  const student2Res = await run(
    `INSERT INTO users (name, email, password, role, student_id, department, year_of_study, gender, phone)
     VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
    ['Priya Patel', 'priya@hostelease.edu', studentPasswordHash, '2024EC0204', 'Electronics & Communication', 1, 'Female', '+91 98765 43211']
  );
  const student2Id = student2Res.id;

  // Student 3: Rohit Verma (ME)
  const student3Res = await run(
    `INSERT INTO users (name, email, password, role, student_id, department, year_of_study, gender, phone)
     VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
    ['Rohit Verma', 'rohit@hostelease.edu', studentPasswordHash, '2024ME0305', 'Mechanical Engineering', 2, 'Male', '+91 98765 43212']
  );
  const student3Id = student3Res.id;

  console.log('Seeded Users: Warden and 3 Students.');

  // 2. Create Hostels / Blocks
  const hostelA = await run(
    `INSERT INTO hostels (name, code, gender_type, total_floors, warden_name, warden_contact, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Aryabhata Block (Boys)', 'BLK-A', 'Boys', 3, 'Dr. Ramesh Sharma', '+91 98765 00001', 'First-year undergraduate boys hostel with library, recreation room, and 24x7 Wi-Fi.']
  );

  const hostelB = await run(
    `INSERT INTO hostels (name, code, gender_type, total_floors, warden_name, warden_contact, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Gargi Block (Girls)', 'BLK-B', 'Girls', 3, 'Dr. Ananya Sen', '+91 98765 00002', 'Undergraduate girls hostel featuring biometric access, reading hall, and round-the-clock security.']
  );

  const hostelC = await run(
    `INSERT INTO hostels (name, code, gender_type, total_floors, warden_name, warden_contact, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Ramanujan Block (Boys - Senior)', 'BLK-C', 'Boys', 3, 'Prof. K. Verma', '+91 98765 00003', 'Hostel for 2nd and 3rd year engineering boys with individual study cubicles.']
  );

  const hostelD = await run(
    `INSERT INTO hostels (name, code, gender_type, total_floors, warden_name, warden_contact, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Sarojini Block (Girls - Senior)', 'BLK-D', 'Girls', 3, 'Prof. Sunita Rao', '+91 98765 00004', 'Senior girls residence block equipped with gym, indoor badminton court, and study lounge.']
  );

  console.log('Seeded 4 Hostel Blocks.');

  // 3. Create Realistic Rooms across Hostels
  const roomsData = [
    // Block A (Boys)
    { hostel_id: hostelA.id, room_number: '101', floor: 1, room_type: 'Double Sharing', capacity: 2, occupied: 1, status: 'Available' },
    { hostel_id: hostelA.id, room_number: '102', floor: 1, room_type: 'Single', capacity: 1, occupied: 0, status: 'Available' },
    { hostel_id: hostelA.id, room_number: '103', floor: 1, room_type: 'Triple Sharing', capacity: 3, occupied: 0, status: 'Available' },
    { hostel_id: hostelA.id, room_number: '201', floor: 2, room_type: 'Double Sharing', capacity: 2, occupied: 2, status: 'Full' },
    { hostel_id: hostelA.id, room_number: '202', floor: 2, room_type: 'Single', capacity: 1, occupied: 0, status: 'Available' },
    { hostel_id: hostelA.id, room_number: '203', floor: 2, room_type: 'Triple Sharing', capacity: 3, occupied: 1, status: 'Available' },
    { hostel_id: hostelA.id, room_number: '301', floor: 3, room_type: 'Double Sharing', capacity: 2, occupied: 0, status: 'Available' },
    { hostel_id: hostelA.id, room_number: '302', floor: 3, room_type: 'Single', capacity: 1, occupied: 1, status: 'Full' },

    // Block B (Girls)
    { hostel_id: hostelB.id, room_number: '101', floor: 1, room_type: 'Single', capacity: 1, occupied: 0, status: 'Available' },
    { hostel_id: hostelB.id, room_number: '102', floor: 1, room_type: 'Double Sharing', capacity: 2, occupied: 0, status: 'Available' },
    { hostel_id: hostelB.id, room_number: '103', floor: 1, room_type: 'Triple Sharing', capacity: 3, occupied: 2, status: 'Available' },
    { hostel_id: hostelB.id, room_number: '201', floor: 2, room_type: 'Double Sharing', capacity: 2, occupied: 0, status: 'Available' },
    { hostel_id: hostelB.id, room_number: '202', floor: 2, room_type: 'Single', capacity: 1, occupied: 0, status: 'Available' },
    { hostel_id: hostelB.id, room_number: '301', floor: 3, room_type: 'Triple Sharing', capacity: 3, occupied: 3, status: 'Full' },

    // Block C (Boys Senior)
    { hostel_id: hostelC.id, room_number: '101', floor: 1, room_type: 'Single', capacity: 1, occupied: 1, status: 'Full' },
    { hostel_id: hostelC.id, room_number: '102', floor: 1, room_type: 'Double Sharing', capacity: 2, occupied: 1, status: 'Available' },
    { hostel_id: hostelC.id, room_number: '201', floor: 2, room_type: 'Double Sharing', capacity: 2, occupied: 0, status: 'Available' },

    // Block D (Girls Senior)
    { hostel_id: hostelD.id, room_number: '101', floor: 1, room_type: 'Single', capacity: 1, occupied: 0, status: 'Available' },
    { hostel_id: hostelD.id, room_number: '102', floor: 1, room_type: 'Double Sharing', capacity: 2, occupied: 0, status: 'Available' },
  ];

  const createdRooms = [];
  for (const r of roomsData) {
    const res = await run(
      `INSERT INTO rooms (hostel_id, room_number, floor, room_type, capacity, occupied, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [r.hostel_id, r.room_number, r.floor, r.room_type, r.capacity, r.occupied, r.status]
    );
    createdRooms.push({ id: res.id, ...r });
  }
  console.log(`Seeded ${createdRooms.length} Rooms.`);

  // 4. Sample Room Request 1: Approved for Aarav (Assigned to Block A, Room 101)
  const room101 = createdRooms.find((r) => r.hostel_id === hostelA.id && r.room_number === '101');
  const req1 = await run(
    `INSERT INTO room_requests (request_code, student_id, hostel_id, room_type, preferred_floor, additional_requirements, status, assigned_room_id, reviewed_by, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Approved', ?, ?, datetime('now', '-2 days'))`,
    ['REQ-2026-001', student1Id, hostelA.id, 'Double Sharing', 1, 'Near study table, quiet corner preferred.', room101.id, adminId]
  );

  // Active Allocation for Aarav
  await run(
    `INSERT INTO room_allocations (student_id, room_id, request_id, status)
     VALUES (?, ?, ?, 'Active')`,
    [student1Id, room101.id, req1.id]
  );

  // Sample Room Request 2: Pending for Priya (Gargi Block, Double Sharing)
  await run(
    `INSERT INTO room_requests (request_code, student_id, hostel_id, room_type, preferred_floor, additional_requirements, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
    ['REQ-2026-002', student2Id, hostelB.id, 'Double Sharing', 2, 'Prefers room with morning sunlight.']
  );

  // Sample Room Request 3: Rejected for Rohit
  await run(
    `INSERT INTO room_requests (request_code, student_id, hostel_id, room_type, preferred_floor, additional_requirements, status, rejection_reason, reviewed_by, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Rejected', ?, ?, datetime('now', '-1 day'))`,
    ['REQ-2026-003', student3Id, hostelC.id, 'Single', 1, 'Need single room for project work.', 'Single rooms in Ramanujan Block are currently reserved for final year students. Please submit a request for Double Sharing.', adminId]
  );

  console.log('Seeded 3 Sample Room Requests with Approved, Pending, and Rejected states.');

  // 5. Sample Complaints
  // Complaint 1: Pending (Aarav)
  const cmp1 = await run(
    `INSERT INTO complaints (complaint_code, student_id, title, category, hostel_block, room_number, description, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [
      'CMP-2026-001',
      student1Id,
      'Ceiling fan speed regulator faulty',
      'Electrical',
      'Aryabhata Block (Boys)',
      '101',
      'The fan regulator is stuck at full speed and emits a humming noise during night hours. Needs replacement.',
      'High'
    ]
  );
  await run(
    `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
     VALUES (?, 'Pending', 'Complaint filed by student.', ?)`,
    [cmp1.id, student1Id]
  );

  // Complaint 2: In Progress (Priya)
  const cmp2 = await run(
    `INSERT INTO complaints (complaint_code, student_id, title, category, hostel_block, room_number, description, priority, status, resolution_note, resolved_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'In Progress', ?, ?)`,
    [
      'CMP-2026-002',
      student2Id,
      'Wi-Fi router on 2nd floor disconnecting intermittently',
      'Internet',
      'Gargi Block (Girls)',
      '201',
      'High packet loss on 2nd floor corridor access point during evening study hours (8 PM - 11 PM).',
      'Medium',
      'IT Support team has rebooted the switch and scheduled cable inspection for tomorrow 10:00 AM.',
      adminId
    ]
  );
  await run(
    `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
     VALUES (?, 'Pending', 'Complaint filed by student.', ?)`,
    [cmp2.id, student2Id]
  );
  await run(
    `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
     VALUES (?, 'In Progress', 'IT Support team assigned. Technician visit scheduled.', ?)`,
    [cmp2.id, adminId]
  );

  // Complaint 3: Resolved (Rohit)
  const cmp3 = await run(
    `INSERT INTO complaints (complaint_code, student_id, title, category, hostel_block, room_number, description, priority, status, resolution_note, resolved_by, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Resolved', ?, ?, datetime('now', '-3 hours'))`,
    [
      'CMP-2026-003',
      student3Id,
      'Bathroom washbasin faucet leaking steadily',
      'Plumbing',
      'Ramanujan Block (Boys - Senior)',
      '102',
      'Cold water tap valve is loose, causing constant dripping and water waste on floor 1 washroom.',
      'Medium',
      'Washer replaced and valve tightened by campus plumbing staff. Tested leak-free.',
      adminId
    ]
  );
  await run(
    `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
     VALUES (?, 'Pending', 'Complaint filed by student.', ?)`,
    [cmp3.id, student3Id]
  );
  await run(
    `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
     VALUES (?, 'In Progress', 'Plumber assigned: Work Order #PL-44.', ?)`,
    [cmp3.id, adminId]
  );
  await run(
    `INSERT INTO complaint_status_history (complaint_id, status, note, updated_by)
     VALUES (?, 'Resolved', 'Washer replaced and valve tightened. Tested leak-free.', ?)`,
    [cmp3.id, adminId]
  );

  console.log('Seeded 3 Sample Complaints with full timeline history.');

  // 6. Sample Notifications
  await run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [
      student1Id,
      'Room Request Approved',
      'Congratulations! Your room allotment request REQ-2026-001 has been approved. You are allocated Room 101 in Aryabhata Block.',
      'success'
    ]
  );

  await run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [
      student2Id,
      'Room Request Under Review',
      'Your request REQ-2026-002 for Gargi Block has been received and is currently under review by the Warden.',
      'info'
    ]
  );

  await run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [
      student3Id,
      'Room Request Update',
      'Your request REQ-2026-003 was rejected. Reason: Single rooms reserved for final year. Please apply for Double Sharing.',
      'warning'
    ]
  );

  console.log('--- HostelEase Database Seeding Completed Successfully ---');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
