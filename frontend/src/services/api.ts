import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  register: (userData: { email: string; password: string; name: string }) =>
    apiClient.post('/auth/register', userData),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  
  logout: () => apiClient.post('/auth/logout'),
  
  getProfile: () => apiClient.get('/auth/profile'),
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
  
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/users', { params }),
  
  getUserById: (id: string) => apiClient.get(`/users/${id}`),
  
  updateUser: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
};

// Conversations API
export const conversationsAPI = {
  getConversations: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    sortBy?: string; 
    sortOrder?: string 
  }) => apiClient.get('/conversations', { params }),
  
  getConversation: (id: string) => apiClient.get(`/conversations/${id}`),
  
  createConversation: (data: { customerName?: string; customerPhone?: string }) =>
    apiClient.post('/conversations', data),
  
  updateConversation: (id: string, data: any) =>
    apiClient.put(`/conversations/${id}`, data),
  
  endConversation: (id: string) => apiClient.post(`/conversations/${id}/end`),
  
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/conversations/analytics/summary', { params }),
};

// Content API
export const contentAPI = {
  getTemplates: () => apiClient.get('/content/templates'),
  
  generateContent: (data: {
    templateId: string;
    formData: Record<string, any>;
    instructions?: string;
  }) => apiClient.post('/content/generate', data),
  
  saveContent: (data: {
    templateId: string;
    generatedContent: any;
    formData: Record<string, any>;
  }) => apiClient.post('/content/save', data),
  
  getContentHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/content/history', { params }),
  
  publishToSocial: (data: {
    contentId: string;
    platforms: string[];
    scheduledTime?: string;
  }) => apiClient.post('/content/publish', data),
};

// Uploads API
export const uploadsAPI = {
  uploadImage: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiClient.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  
  uploadMultipleImages: (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    
    return apiClient.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  
  getUploads: (params?: { page?: number; limit?: number; type?: string }) =>
    apiClient.get('/uploads', { params }),
  
  deleteUpload: (id: string) => apiClient.delete(`/uploads/${id}`),
};

// Remote Execution API
export const remoteExecutionAPI = {
  getConnections: () => apiClient.get('/remote-execution/connections'),
  
  createConnection: (data: {
    name: string;
    host: string;
    port: number;
    username: string;
    privateKey?: string;
    password?: string;
  }) => apiClient.post('/remote-execution/connections', data),
  
  updateConnection: (id: string, data: any) =>
    apiClient.put(`/remote-execution/connections/${id}`, data),
  
  deleteConnection: (id: string) => apiClient.delete(`/remote-execution/connections/${id}`),
  
  testConnection: (id: string) => apiClient.post(`/remote-execution/connections/${id}/test`),
  
  executeScript: (data: {
    connectionId: string;
    scriptPath: string;
    parameters?: Record<string, any>;
  }) => apiClient.post('/remote-execution/execute', data),
  
  getExecutions: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    connectionId?: string 
  }) => apiClient.get('/remote-execution/executions', { params }),
  
  getExecution: (id: string) => apiClient.get(`/remote-execution/executions/${id}`),
  
  cancelExecution: (id: string) => apiClient.post(`/remote-execution/executions/${id}/cancel`),
  
  // Background removal specific
  removeBackground: (data: {
    connectionId: string;
    imagePath: string;
    model?: string;
    batchMode?: boolean;
  }) => apiClient.post('/remote-execution/background-removal', data),
  
  getBackgroundRemovalJobs: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string 
  }) => apiClient.get('/remote-execution/background-removal', { params }),
  
  downloadResult: (jobId: string) => apiClient.get(`/remote-execution/background-removal/${jobId}/download`),
};

// File Transfer API
export const fileTransferAPI = {
  uploadFile: (connectionId: string, file: File, remotePath: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remotePath', remotePath);
    
    return apiClient.post(`/remote-execution/connections/${connectionId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  downloadFile: (connectionId: string, remotePath: string) =>
    apiClient.get(`/remote-execution/connections/${connectionId}/download`, {
      params: { remotePath },
      responseType: 'blob',
    }),
  
  listFiles: (connectionId: string, path: string) =>
    apiClient.get(`/remote-execution/connections/${connectionId}/files`, {
      params: { path },
    }),
  
  deleteFile: (connectionId: string, remotePath: string) =>
    apiClient.delete(`/remote-execution/connections/${connectionId}/files`, {
      params: { remotePath },
    }),
};

// Quality Assessment API
export const qualityAssessmentAPI = {
  assessQuality: (data: {
    imagePath: string;
    originalPath: string;
    jobId: string;
  }) => apiClient.post('/quality-assessment/assess', data),
  
  getAssessments: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string 
  }) => apiClient.get('/quality-assessment', { params }),
  
  getAssessment: (id: string) => apiClient.get(`/quality-assessment/${id}`),
  
  reviewAssessment: (id: string, data: {
    approved: boolean;
    notes?: string;
    qualityScore?: number;
  }) => apiClient.post(`/quality-assessment/${id}/review`, data),
};

// Social Media API
export const socialMediaAPI = {
  getAccounts: () => apiClient.get('/social-media/accounts'),
  
  connectAccount: (platform: string, authData: any) =>
    apiClient.post('/social-media/accounts/connect', { platform, authData }),
  
  disconnectAccount: (accountId: string) =>
    apiClient.delete(`/social-media/accounts/${accountId}`),
  
  publishPost: (data: {
    content: string;
    images?: string[];
    platforms: string[];
    scheduledTime?: string;
  }) => apiClient.post('/social-media/publish', data),
  
  getPublishedPosts: (params?: { 
    page?: number; 
    limit?: number; 
    platform?: string 
  }) => apiClient.get('/social-media/posts', { params }),
};

// Analytics API
export const analyticsAPI = {
  getSalesMetrics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/sales', { params }),
  
  getTrainingMetrics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/training', { params }),
  
  getContentMetrics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/content', { params }),
  
  getSystemMetrics: () => apiClient.get('/analytics/system'),
};

// Health check
export const healthAPI = {
  check: () => apiClient.get('/health'),
};

export default apiClient;
