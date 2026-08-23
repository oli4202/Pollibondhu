export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  totalServices: number;
  pendingServices: number;
  totalPosts: number;
  pendingComplaints: number;
  recentActivities: any[];
}
