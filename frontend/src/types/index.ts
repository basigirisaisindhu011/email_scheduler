export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEmail {
  id: string;
  userId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: EmailStatus;
  jobId?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  scheduled: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface EmailQuery {
  page?: number;
  limit?: number;
  status?: EmailStatus;
  search?: string;
  sortBy?: 'createdAt' | 'scheduledAt' | 'sentAt';
  order?: 'asc' | 'desc';
}
