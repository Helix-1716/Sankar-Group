import { firebaseAuth } from '../firebase';

const API_BASE = 'http://localhost:5000/api';

async function getAuthHeaders() {
  const user = firebaseAuth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function apiFetch(endpoint, options = {}) {
  const authHeaders = await getAuthHeaders();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiFetch('/auth/me'),

  // Projects
  getProjects: () => apiFetch('/projects'),
  getProject: (id) => apiFetch(`/projects/${id}`),
  createProject: (data) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (projectId, userId) => apiFetch(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeMember: (projectId, userId) => apiFetch(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (projectId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/projects/${projectId}/tasks${params ? '?' + params : ''}`);
  },
  createTask: (projectId, data) => apiFetch(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (projectId, taskId, data) => apiFetch(`/tasks/${projectId}/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (projectId, taskId) => apiFetch(`/tasks/${projectId}/${taskId}`, { method: 'DELETE' }),

  // Users
  getUsers: () => apiFetch('/users'),
  getUser: (id) => apiFetch(`/users/${id}`),

  // Dashboard
  getStats: () => apiFetch('/dashboard/stats'),
  getActivity: () => apiFetch('/dashboard/activity'),
};
