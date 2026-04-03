import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Universities
export const getUniversities = (params?: Record<string, string>) =>
  api.get('/universities', { params }).then(r => r.data);

export const getUniversity = (id: number | string) =>
  api.get(`/universities/${id}`).then(r => r.data);

export const getUniversityProfessors = (id: number | string, params?: Record<string, string>) =>
  api.get(`/universities/${id}/professors`, { params }).then(r => r.data);

export const getUniversityDepartments = (id: number | string) =>
  api.get(`/universities/${id}/departments`).then(r => r.data);

export const getUniversityCourses = (id: number | string, params?: Record<string, string>) =>
  api.get(`/universities/${id}/courses`, { params }).then(r => r.data);

// Professors
export const getProfessors = (params?: Record<string, string>) =>
  api.get('/professors', { params }).then(r => r.data);

export const getProfessor = (id: number | string) =>
  api.get(`/professors/${id}`).then(r => r.data);

export const addProfessor = (data: Record<string, any>) =>
  api.post('/professors', data).then(r => r.data);

// Reviews
export const addReview = (data: Record<string, any>) =>
  api.post('/reviews', data).then(r => r.data);

export const voteReview = (id: number, is_helpful: boolean) =>
  api.post(`/reviews/${id}/vote`, { is_helpful }).then(r => r.data);

export const getRecentReviews = () =>
  api.get('/reviews/recent').then(r => r.data);

// Courses
export const addCourse = (professorId: number | string, data: { code: string; name: string }) =>
  api.post(`/professors/${professorId}/courses`, data).then(r => r.data);

export const getCourses = (params?: Record<string, string>) =>
  api.get('/courses', { params }).then(r => r.data);

export const getSchedule = (params?: Record<string, string>) =>
  api.get('/courses/schedule', { params }).then(r => r.data);

// Search
export const search = (q: string) =>
  api.get('/search', { params: { q } }).then(r => r.data);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const register = (data: {
  name: string; email: string; password: string;
  university_id?: number; is_graduate?: boolean; graduation_year?: number;
}) => api.post('/auth/register', data).then(r => r.data);

export const verifyEmail = (code: string) =>
  api.post('/auth/verify-email', { code }).then(r => r.data);

export const resendVerification = () =>
  api.post('/auth/resend-verification').then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

export const getMyReviews = () =>
  api.get('/auth/reviews').then(r => r.data);

export const reportReview = (id: number, reason: string) =>
  api.post(`/reviews/${id}/report`, { reason }).then(r => r.data);

export const getStats = () =>
  api.get('/stats').then(r => r.data);
