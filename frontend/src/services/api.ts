import axios from 'axios';
import {
  AuthResponse,
  DashboardStats,
  EmailQuery,
  PaginatedResponse,
  ScheduledEmail,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const emailService = {
  async scheduleEmail(payload: {
    recipient: string;
    subject: string;
    body: string;
    scheduledAt: string;
  }): Promise<ScheduledEmail> {
    const res = await api.post<ScheduledEmail>('/emails', payload);
    return res.data;
  },

  async getEmails(query: EmailQuery = {}): Promise<PaginatedResponse<ScheduledEmail>> {
    const res = await api.get<PaginatedResponse<ScheduledEmail>>('/emails', { params: query });
    return res.data;
  },

  async getScheduledEmails(query: EmailQuery = {}): Promise<PaginatedResponse<ScheduledEmail>> {
    const res = await api.get<PaginatedResponse<ScheduledEmail>>('/emails/scheduled', { params: query });
    return res.data;
  },

  async getSentEmails(query: EmailQuery = {}): Promise<PaginatedResponse<ScheduledEmail>> {
    const res = await api.get<PaginatedResponse<ScheduledEmail>>('/emails/sent', { params: query });
    return res.data;
  },

  async getFailedEmails(query: EmailQuery = {}): Promise<PaginatedResponse<ScheduledEmail>> {
    const res = await api.get<PaginatedResponse<ScheduledEmail>>('/emails/failed', { params: query });
    return res.data;
  },

  async getEmailById(id: string): Promise<ScheduledEmail> {
    const res = await api.get<ScheduledEmail>(`/emails/${id}`);
    return res.data;
  },

  async cancelEmail(id: string): Promise<ScheduledEmail> {
    const res = await api.delete<ScheduledEmail>(`/emails/${id}`);
    return res.data;
  },

  async rescheduleEmail(id: string, scheduledAt: string): Promise<ScheduledEmail> {
    const res = await api.put<ScheduledEmail>(`/emails/${id}/reschedule`, { scheduledAt });
    return res.data;
  },

  async getStats(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};
