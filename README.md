# 🏨 HostelEase — Hostel Room Allotment & Complaint Management System

**A Full-Stack Campus Residence Management Portal built for B.Tech First-Year Project Evaluation**

---

## 📌 Project Overview

**HostelEase** is a web portal designed to digitize and automate college hostel operations. It replaces manual paper forms and spreadsheet-based tracking with role-based access control, real-time room capacity tracking, and an interactive maintenance ticket timeline.

### Core Objectives:
1. **Automated Room Allotment**: Students can select hostel blocks, sharing types (Single, Double, Triple), and floor preferences. The system generates unique IDs, tracks review status, and prevents over-allocation.
2. **Safe Warden Approval Workflow**: Wardens can review applications, assign available beds with automatic occupancy updates, or reject requests with clear reasons.
3. **Complaint & Maintenance Tracking**: Students report electrical, plumbing, Wi-Fi, and cleanliness issues with priority levels. Wardens update statuses (*Pending* → *In Progress* → *Resolved*) with resolution notes and live timeline history.
4. **Role-Based Security**: Complete separation of Student and Warden privileges. Passwords are securely hashed with `bcrypt`, APIs are protected by `JWT` middleware, and data is stored in persistent `SQLite3`.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS | High-performance SPA with modern navy/teal responsive styling |
| **Icons & UI** | Lucide React | Clean, intuitive status icons and metric badges |
| **Backend** | Node.js, Express.js | Modular RESTful API server with route controllers |
| **Database** | SQLite3 (`hostelease.db`) | Persistent SQL database with foreign keys and atomic transactions |
| **Authentication** | JSON Web Tokens (JWT), `bcryptjs` | Salted password hashing and role-aware authorization middleware |

---

## 📁 Project Structure

```text
hostelease/
├── client/                      # React Frontend (Vite + Tailwind CSS)
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Modal.jsx        # Accessible dialog for approvals & timelines
│   │   │   ├── Navbar.jsx       # Top bar with role badge & notification popover
│   │   │   ├── Sidebar.jsx      # Responsive desktop/mobile navigation drawer
│   │   │   ├── StatCard.jsx     # Metric KPI cards with trends
│   │   │   ├── StatusBadge.jsx  # Color-coded status & priority badges
│   │   │   └── Toast.jsx        # Floating alert messages
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT token & user profile state manager
│   │   ├── pages/               # Application pages
│   │   │   ├── Login.jsx        # Role-aware login with 1-click evaluator chips
│   │   │   ├── Register.jsx     # Student registration form
│   │   │   ├── StudentDashboard.jsx    # Student home with active room card
│   │   │   ├── StudentRoomRequest.jsx  # Feature 1: Room request form
│   │   │   ├── StudentComplaints.jsx   # Feature 3: Complaint desk & timeline
│   │   │   ├── StudentProfile.jsx      # Personal credentials & room badge
│   │   │   ├── AdminDashboard.jsx      # Warden overview & occupancy meters
│   │   │   ├── AdminRoomRequests.jsx   # Feature 2: Approve/reject workflow
│   │   │   ├── AdminRooms.jsx          # Room capacity inventory & occupants
│   │   │   ├── AdminComplaints.jsx     # Complaint status updater & remarks
│   │   │   ├── AdminStudents.jsx       # Student directory & dossiers
│   │   │   └── AdminProfile.jsx        # Warden profile & dev admin setup
│   │   ├── services/
│   │   │   └── api.js           # Centralized API client with JWT interceptor
│   │   ├── App.jsx              # Main layout & role-protected router
│   │   ├── index.css            # Tailwind directives & custom scrollbars
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js       # Navy, white, and subtle teal color theme
│   └── vite.config.js           # Dev server with /api proxy to port 5000
│
├── server/                      # Node.js + Express Backend
│   ├── db/
│   │   ├── database.js          # SQLite connection, schema, and queries
│   │   ├── seed.js              # Realistic college demo data seeder
│   │   └── hostelease.db        # Persistent SQLite database file
│   ├── middleware/
│   │   └── auth.js              # authenticateToken & requireRole('admin')
│   ├── routes/
│   │   ├── auth.routes.js       # Register, login, me, and dev admin setup
│   │   ├── rooms.routes.js      # Hostels and rooms inventory
│   │   ├── requests.routes.js   # Room request submission & safe approval
│   │   ├── complaints.routes.js # Complaint tickets & status timeline
│   │   ├── students.routes.js   # Student records directory for warden
│   │   ├── stats.routes.js      # Live dashboard statistics calculation
│   │   └── notifications.routes.js # In-app notifications
│   ├── .env                     # Backend configuration (PORT, JWT_SECRET)
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Express app entry point
│
├── package.json                 # Monorepo startup scripts (concurrently)
├── .gitignore
└── README.md                    # Documentation & evaluation guide
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js** (v18, v20 LTS, or higher)
- **npm** (v9 or v10)

### 1. Initialize the Database with Realistic Demo Data
From the `server` directory, run the database seed script:
```powershell
cd server
npm run seed
```
*This initializes `hostelease.db`, sets up all 8 SQL tables, and populates realistic hostels, rooms, students, sample requests, and complaints.*

### 2. Start Both Backend & Frontend Simultaneously
From the root `hostelease` folder:
```powershell
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend Portal**: `http://localhost:3000`

*(Alternatively, you can run them in separate terminals)*:
- **Terminal 1 (Backend)**: `cd server && npm start`
- **Terminal 2 (Frontend)**: `cd client && npm run dev`

---

## 🔑 Demo Evaluator Accounts

For easy testing during college evaluation, one-click preset buttons are available on the Login page:

| Role | Email | Password | Name / Details |
|---|---|---|---|
| **Chief Warden (Admin)** | `warden@hostelease.edu` | `AdminPassword123!` | Dr. Ramesh Sharma (Chief Warden) |
| **Student 1 (Allocated)** | `student@hostelease.edu` | `StudentPassword123!` | Aarav Sharma (Room 101, Aryabhata Block) |
| **Student 2 (Pending)** | `priya@hostelease.edu` | `StudentPassword123!` | Priya Patel (Gargi Block, Double Sharing) |
| **Student 3 (Rejected)** | `rohit@hostelease.edu` | `StudentPassword123!` | Rohit Verma (Mechanical, Year 2) |

---

## 📋 Evaluator Step-by-Step Demonstration Guide

### Feature 1: Student Room Request Submission
1. Log in as a Student (`student@hostelease.edu` or register a new account).
2. Click **Room Allotment** on the sidebar.
3. Fill out the application:
   - Select Preferred Hostel (e.g. *Aryabhata Block* or *Gargi Block*).
   - Select Room Sharing Type (*Single*, *Double Sharing*, or *Triple Sharing*).
   - Select Preferred Floor.
   - Enter special requirements (e.g. *"Quiet study area"*).
4. Click **Submit Room Allotment Request**.
5. Observe:
   - A unique Request ID is generated (e.g. `REQ-2026-004-729`).
   - The status is marked as **Pending Review**.
   - An in-app notification confirms submission.
   - The application appears immediately in the student's history table.

### Feature 2: Warden Review & Safe Bed Allocation
1. Log in as Chief Warden (`warden@hostelease.edu`).
2. Navigate to **Room Requests** on the sidebar.
3. Locate any pending request and click **Approve**:
   - The system queries rooms in the chosen hostel that have free capacity.
   - Select an available room (e.g. *Room 102*).
   - Click **Confirm Room Allotment**.
4. Observe safe concurrency & capacity management:
   - The room occupancy count automatically increments (e.g. `0/2` → `1/2`).
   - If the room becomes full, its status changes to `Full` to prevent over-allocation.
   - The request status updates to **Approved**.
   - The student receives an in-app notification confirming their new room number.
5. Alternatively, click **Reject**, enter an explanation (e.g. *"Single rooms currently reserved"*), and confirm. The student's portal reflects this reason immediately.

### Feature 3: Complaint Submission & Live Status Timeline
1. Log in as a Student.
2. Click **Complaints** on the sidebar.
3. Fill out a ticket:
   - Title (e.g. *"Study lamp plug point sparked"*).
   - Category (*Electrical*, *Plumbing*, *Cleanliness*, *Internet*, *Furniture*, or *Other*).
   - Priority level (*High*, *Medium*, *Low*).
   - Detailed description.
4. Click **Submit Complaint Ticket** → Generates code `CMP-2026-XXX`.
5. Log in as Warden → Go to **Complaints Tracker**.
6. Click **Update Status** on the complaint:
   - Change status to **In Progress** or **Resolved**.
   - Enter technician remarks (e.g. *"Electrician replaced damaged 16A socket"*).
   - Click **Save Status & Notify Student**.
7. Return to the student account and click **View** on the complaint ticket to view the **Interactive Resolution Timeline** showing each timestamped step.

### Feature 4: Role-Based Access Control & Security
1. Try accessing an admin route as a student (e.g. selecting admin management tools).
2. The UI guards redirect to the Student Dashboard.
3. Direct API requests without an admin token return `403 Forbidden: Access denied. This endpoint is restricted to: admin.`
4. Restart the Node.js server. Log in again to verify that all room allocations and complaints persist seamlessly in `hostelease.db`.

---

## 🛡️ Secure Development-Only Admin Setup

To provision or reset the Warden/Admin account without exposing secrets:
- Endpoint: `POST /api/auth/dev-admin-setup`
- Body:
  ```json
  {
    "setupKey": "hostelease_dev_setup_2026",
    "name": "Dr. Ramesh Sharma (Chief Warden)",
    "email": "warden@hostelease.edu",
    "password": "AdminPassword123!",
    "phone": "+91 98765 00001"
  }
  ```
- Alternatively, use the **Warden Profile & Setup** page inside the Warden Console to provision new admin accounts directly with secret key verification.

---

## 🗄️ Database Schema Summary (`SQLite3`)

```sql
users                (id, name, email, password, role, student_id, department, year_of_study, gender, phone, created_at)
hostels              (id, name, code, gender_type, total_floors, warden_name, warden_contact, description, created_at)
rooms                (id, hostel_id, room_number, floor, room_type, capacity, occupied, status, notes, created_at)
room_requests        (id, request_code, student_id, hostel_id, room_type, preferred_floor, additional_requirements, status, assigned_room_id, rejection_reason, reviewed_by, reviewed_at, created_at)
room_allocations     (id, student_id, room_id, request_id, allocated_at, status)
complaints           (id, complaint_code, student_id, title, category, hostel_block, room_number, description, priority, status, resolution_note, resolved_by, resolved_at, created_at, updated_at)
complaint_status_history (id, complaint_id, status, note, updated_by, created_at)
notifications        (id, user_id, title, message, type, is_read, created_at)
```

---

## 🚀 Presentation Tips for First-Year B.Tech Viva

1. **Highlight Full-Stack Integration**: Explain how React state (`useState`, `useEffect`) makes REST calls (`fetch`) to Express controllers, which execute SQL queries on persistent SQLite tables.
2. **Explain Capacity Safety**: Show how the backend runs an atomic check before approving a room request:
   $$\text{occupied} < \text{capacity}$$
   This guarantees that no room ever exceeds its physical bed count.
3. **Showcase Real Data**: Emphasize that dashboard figures are not hardcoded static mockups; they are calculated live using SQL aggregate functions (`COUNT(*)`, `SUM(capacity)`).
4. **Demonstrate Mobile Usability**: Press `F12` in Chrome/Edge, toggle mobile view, and showcase the responsive drawer navigation and touch-friendly cards.
#   h o s t e l e a s e e e e  
 #   h o s t e l e a s e e e e  
 