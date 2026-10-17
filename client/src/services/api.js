const envUrl = import.meta.env.VITE_API_URL;
const API_BASE = envUrl
  ? (envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`)
  : '/api';

// Helper to make API requests with JWT auth and uniform error handling
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('hostelease_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { 
        message: 'Unable to reach backend API. If deployed on Netlify, make sure your backend is running or set the VITE_API_URL environment variable.' 
      };
    }

    if (!res.ok) {
      const error = new Error(data.message || 'An error occurred during request.');
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status === 401 && !endpoint.includes('/auth/login')) {
      // Token expired or invalid
      localStorage.removeItem('hostelease_token');
      localStorage.removeItem('hostelease_user');
      window.dispatchEvent(new Event('hostelease_auth_expired'));
    }
    if (!err.status && err.name === 'TypeError') {
      const netError = new Error('Cannot connect to backend server. If using Netlify, please configure your backend API URL in environment variables (VITE_API_URL).');
      netError.data = { message: netError.message };
      throw netError;
    }
    throw err;
  }
}

// 1. Auth API
export const authAPI = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (studentData) => request('/auth/register', { method: 'POST', body: studentData }),
  getMe: () => request('/auth/me'),
  devAdminSetup: (setupData) => request('/auth/dev-admin-setup', { method: 'POST', body: setupData }),
};

// 2. Rooms & Hostels API
export const roomsAPI = {
  getHostels: () => request('/rooms/hostels'),
  getRooms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rooms${query ? `?${query}` : ''}`);
  },
  getRoomById: (id) => request(`/rooms/${id}`),
  createRoom: (roomData) => request('/rooms', { method: 'POST', body: roomData }),
  updateRoom: (id, updateData) => request(`/rooms/${id}`, { method: 'PUT', body: updateData }),
};

// 3. Room Allotment Requests API
export const requestsAPI = {
  submitRequest: (requestData) => request('/requests', { method: 'POST', body: requestData }),
  getMyRequests: () => request('/requests/my-requests'),
  getAllRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/requests${query ? `?${query}` : ''}`);
  },
  approveRequest: (id, roomId) => request(`/requests/${id}/approve`, { method: 'PUT', body: { room_id: roomId } }),
  rejectRequest: (id, reason) => request(`/requests/${id}/reject`, { method: 'PUT', body: { reason } }),
};

// 4. Complaints API
export const complaintsAPI = {
  submitComplaint: (complaintData) => request('/complaints', { method: 'POST', body: complaintData }),
  getMyComplaints: () => request('/complaints/my-complaints'),
  getAllComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },
  getComplaintById: (id) => request(`/complaints/${id}`),
  updateStatus: (id, status, note) => request(`/complaints/${id}/status`, { method: 'PUT', body: { status, note } }),
};

// 5. Students API (Admin)
export const studentsAPI = {
  getStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ''}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
};

// 6. Statistics API
export const statsAPI = {
  getStudentStats: () => request('/stats/student'),
  getAdminStats: () => request('/stats/admin'),
};

// 7. Notifications API
export const notificationsAPI = {
  getNotifications: () => request('/notifications'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
