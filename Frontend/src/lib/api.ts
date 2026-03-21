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
  },
};

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
