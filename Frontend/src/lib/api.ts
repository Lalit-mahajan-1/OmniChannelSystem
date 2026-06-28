// ─── Single source of truth for all API calls ────────────────────────────────
const BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data as T;
}

export const api = {
  employer: {
    login: (email: string, password: string) =>
      request<{ success: boolean; token: string; data: User }>("/employers/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  customer: {
    login: (email: string, password: string) =>
      request<{ success: boolean; token: string; data: User }>("/customers/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page)   qs.set("page",   String(params.page));
      if (params?.limit)  qs.set("limit",  String(params.limit));
      if (params?.search) qs.set("search", params.search);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return request<CustomersResponse>(`/customers${query}`);
    },
  },  tickets: {
    analyze: (payload: { message: string; channel: string; customerId: string; ticketId?: string; sourceId?: string }) =>
      request<{ success: boolean; data: any }>('/tickets/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getIntelligence: (params?: { customerId?: string; channel?: string; priority?: string; limit?: number; skip?: number }) => {
      const qs = new URLSearchParams();
      if (params?.customerId) qs.set('customerId', params.customerId);
      if (params?.channel) qs.set('channel', params.channel);
      if (params?.priority) qs.set('priority', params.priority);
      if (params?.limit !== undefined) qs.set('limit', String(params.limit));
      if (params?.skip !== undefined) qs.set('skip', String(params.skip));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/tickets/intelligence${query}`);
    },
    getAnalytics: () => request<{ success: boolean; data: TicketAnalytics }>('/tickets/analytics'),
    getAtRisk: () => request<{ success: boolean; data: AtRiskCustomer[] }>('/tickets/at-risk'),
  },
  marketing: {
    getCampaigns: () =>
      request<Campaign[]>("/marketing/campaigns"),
    createCampaign: (body: { name: string; type: string; content: string; targetSegment: string[]; scheduledAt?: string }) =>
      request<Campaign>("/marketing/campaigns", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateCampaign: (id: string, body: Partial<{ name: string; type: string; content: string; targetSegment: string[]; scheduledAt: string }>) =>
      request<{ success: boolean; data: Campaign }>(`/marketing/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    requestApproval: (id: string) =>
      request<Campaign>(`/marketing/campaigns/${id}/request-approval`, {
        method: "POST",
      }),
  },
  compliance: {
    getConsentStats: () =>
      request<{ success: boolean; data: { dncCount: number; marketingCount: number; totalCount: number } }>("/customers/consent-stats"),
    getApprovals: (status?: string) => {
      const qs = status ? `?status=${status}` : "";
      return request<{ success: boolean; data: ContentApprovalData[] }>(`/marketing/approvals${qs}`);
    },
    getApprovalStats: () =>
      request<{ success: boolean; data: { pending: number; approved: number; rejected: number; total: number } }>("/marketing/approvals/stats"),
    updateApproval: (id: string, status: "Approved" | "Rejected", comments?: string) =>
      request<{ success: boolean; data: ContentApprovalData }>(`/marketing/approvals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, comments }),
      }),
    getAuditLogs: (type?: string) => {
      const qs = type && type !== "all" ? `?type=${type}` : "";
      return request<{ success: boolean; data: AuditLogData[] }>(`/audit/logs${qs}`);
    },
  },
  churn: {
    getPredictions: (riskLevel?: string) => {
      const qs = riskLevel ? `?riskLevel=${riskLevel}` : "";
      return request<{ success: boolean; data: ChurnPrediction[] }>(`/churn${qs}`);
    },
    getStats: () =>
      request<{ success: boolean; data: ChurnStats }>("/churn/stats"),
    predict: (customerId: string) =>
      request<{ success: boolean; data: ChurnPrediction }>(`/churn/predict/${customerId}`, { method: "POST" }),
    markAction: (id: string, action: string) =>
      request<{ success: boolean; data: ChurnPrediction }>(`/churn/${id}/action`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),
  },
  agentAnalytics: {
    getStats: () =>
      request<{ success: boolean; data: AgentAnalyticsStats }>("/agent-analytics/stats"),
  },
  tasks: {
    getAll: () => request<{ success: boolean; data: any[] }>('/tasks'),
    getStats: () => request<{ success: boolean; data: any }>('/tasks/stats'),
    create: (task: any) => request<{ success: boolean; data: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
    update: (id: string, updates: any) => request<{ success: boolean; data: any }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    delete: (id: string) => request<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
  },
};

export interface AtRiskCustomer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  healthScore: number;
  healthStatus: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "employer" | "customer";
  company?: string;
  phone?: string;
  isActive: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  timezone: string;
  isActive: boolean;
  channel_ids?: {
    whatsapp?: string;
    chat_uid?: string;
    social_id?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomersResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data: Customer[];
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface Campaign {
  _id: string;
  name: string;
  type: "Email" | "WhatsApp" | "SMS";
  targetSegment: string[];
  status: "Draft" | "Pending Approval" | "Approved" | "Active" | "Completed" | "Rejected";
  content: string;
  scheduledAt?: string;
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

export interface ContentApprovalData {
  _id: string;
  relatedType: string;
  relatedId?: string;
  name: string;
  channel: string;
  status: string;
  submittedBy: string;
  risk: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogData {
  _id: string;
  action: string;
  type: string;
  title: string;
  description: string;
  rule: string;
  actionLabel: string;
  createdAt: string;
}

export interface ChurnPrediction {
  _id: string;
  customerId: string;
  churnProbability: number;
  riskLevel: string;
  features: Record<string, number>;
  recommendations: string[];
  actionTaken?: string;
  createdAt: string;
}

export interface ChurnStats {
  total: number;
  byRisk: Array<{ _id: string; count: number }>;
}

export interface AgentAnalyticsStats {
  totalReplies: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  avgGenerationMs: number;
  avgSendMs: number;
  avgTotalMs: number;
  byAgent: Array<{ _id: string; count: number; success: number }>;
  byChannel: Array<{ _id: string; count: number }>;
  recentActions: Array<{ agentType: string; actionType: string; status: string; channel: string; totalLatencyMs: number; createdAt: string; customerId: string }>;
}

export interface TicketAnalytics {
  criticalTickets: number;
  escalatedTickets: number;
  categoryDistribution: Array<{ category: string; count: number }>;
  sentimentDistribution: Array<{ sentiment: string; count: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
}
