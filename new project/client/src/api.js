import axios from 'axios';
import { auth } from './firebase.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchGyms() {
  const { data } = await api.get('/gyms');
  return data;
}

export async function fetchProfile() {
  const { data } = await api.get('/profile');
  return data;
}

export async function createGym(payload) {
  const { data } = await api.post('/gyms', payload);
  return data;
}

export async function createReview(gymId, payload) {
  const { data } = await api.post(`/gyms/${gymId}/reviews`, payload);
  return data;
}
