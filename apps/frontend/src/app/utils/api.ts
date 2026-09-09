// Base URL — uses Vite proxy in dev, real URL in production
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// ─── User & Token helpers ───────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('ff_token');
export const setToken = (token: string) => localStorage.setItem('ff_token', token);
export const clearToken = () => {
  localStorage.removeItem('ff_token');
  localStorage.removeItem('ff_user');
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF';
  businessId?: string;
  businessName?: string;
}

export const setUser = (user: AuthUser) => localStorage.setItem('ff_user', JSON.stringify(user));
export const getUser = (): AuthUser | null => {
  const data = localStorage.getItem('ff_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getToken();

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(error.message)
      ? error.message[0]
      : (error.message || error.error || 'Request failed');
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await request<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(response.access_token);
    setUser(response.user);
    return response;
  },

  getMe: async () => {
    const user = await request<AuthUser>('/auth/me');
    setUser(user);
    return user;
  },

  logout: () => {
    clearToken();
    window.location.href = '/login';
  },
};

// ─── Invoice Settings ───────────────────────────────────────────────────────
export interface InvoiceSettings {
  id: string;
  businessId: string;
  companyName: string;
  tagline?: string;
  website?: string;
  logoUrl?: string;
  headerColor?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  termsAndConditions?: string;
  declaration?: string;
  signatureTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export const invoiceSettingsApi = {
  get: () => request<InvoiceSettings>('/invoice-settings'),

  update: (data: Partial<InvoiceSettings>) => {
    const { id, businessId, createdAt, updatedAt, ...payload } = data as any;
    return request<InvoiceSettings>('/invoice-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/invoice-settings/logo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || 'Failed to upload logo');
    }

    return res.json();
  },
};

// ─── Admin API (Tenant Provisioning) ─────────────────────────────────────────
export interface CreateTenantPayload {
  businessName: string;
  businessEmail?: string;
  phone?: string;
  address?: string;
  plan?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export const adminApi = {
  createTenant: (data: CreateTenantPayload) =>
    request<{ message: string; business: any; adminUser: any }>('/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTenants: () => request<any[]>('/admin/tenants'),

  updateTenantStatus: (businessId: string, status: string) =>
    request<any>(`/admin/tenants/${businessId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ─── Core Domain Types ───────────────────────────────────────────────────────
export interface Address {
  id: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  totalOrders: number;
  addresses: Address[];
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  orders: OrderSummary[];
}

export interface Product {
  id: string;
  name: string;
  price?: number;
  discountedPrice?: number;
  inventory?: { availableStock: number; dailyProductionRate: number };
  createdAt: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  priceType?: 'STANDARD' | 'DISCOUNTED' | 'CUSTOM' | string;
  totalPrice?: number;
}

export interface OrderSummary {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerId: string;
  orderDate: string;
  deliveryDate: string;
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED' | string;
  paymentStatus?: 'PENDING' | 'COMPLETED' | string;
  paymentMethod?: string;
  grandTotal?: number;
  productsCount: number;
}

export interface OrderDetail {
  id: string;
  orderId: string;
  orderNumber: number;
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED' | string;
  paymentStatus?: 'PENDING' | 'COMPLETED' | string;
  paymentMethod?: string;
  subtotal?: number;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  discountReason?: string;
  additionalCharges?: string;
  grandTotal?: number;
  orderDate: string;
  deliveryDate: string;
  notes?: string;
  customer: { id: string; name: string; phone: string; email?: string };
  address: Address;
  items: OrderItem[];
}

export interface ActivityLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: string;
  createdAt: string;
}

export interface InventoryItem {
  productId: string;
  productName: string;
  availableStock: number;
  bookedStock: number;
  freeStock: number;
  dailyProductionRate: number;
}

export interface ProductionEntry {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  date: string;
  createdAt: string;
}

export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  change: number;
  newStock: number;
  reason: string | null;
  date: string;
  createdAt: string;
}

export interface DashboardData {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  ordersInProduction: number;
  pendingOrders?: number;
  totalAvailableStock: number;
  productionToday: number;
  recentOrders: {
    id: string;
    orderId: string;
    customerName: string;
    deliveryDate: string;
    status: string;
  }[];
  stockOverview: InventoryItem[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => request<DashboardData>('/dashboard'),
};

// ─── Customers ───────────────────────────────────────────────────────────────
export const customersApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    q.append('limit', String(params?.limit ?? 10));
    return request<PaginatedResponse<Customer>>(`/customers?${q.toString()}`);
  },

  get: (id: string) => request<CustomerDetail>(`/customers/${id}`),

  create: (data: {
    name: string;
    phone: string;
    email?: string;
    addresses?: { addressLine: string; city: string; state: string; pincode: string }[];
  }) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; phone?: string; email?: string }) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/customers/${id}`, {
      method: 'DELETE',
    }),

  addAddress: (customerId: string, data: { addressLine: string; city: string; state: string; pincode: string }) =>
    request<Address>(`/customers/${customerId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddress: (addressId: string, data: { addressLine?: string; city?: string; state?: string; pincode?: string }) =>
    request<Address>(`/customers/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    q.append('limit', String(params?.limit ?? 10));
    return request<PaginatedResponse<Product>>(`/products?${q.toString()}`);
  },

  create: (data: { name: string; price?: number; discountedPrice?: number; initialStock?: number }) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; price?: number; discountedPrice?: number }) =>
    request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status && params.status !== 'ALL') q.append('status', params.status);
    if (params?.page) q.append('page', String(params.page));
    q.append('limit', String(params?.limit ?? 10));
    return request<PaginatedResponse<OrderSummary>>(`/orders?${q.toString()}`);
  },

  get: (id: string) => request<OrderDetail>(`/orders/${id}`),

  create: (data: {
    customerId: string;
    addressId: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice?: number;
      priceType?: string;
      totalPrice?: number;
    }[];
    deliveryDate: string;
    notes?: string;
    subtotal?: number;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    discountReason?: string;
    additionalCharges?: string;
    grandTotal?: number;
    paymentStatus?: string;
    paymentMethod?: string;
  }) =>
    request<OrderDetail>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePaymentStatus: (id: string, paymentStatus: string, paymentMethod?: string) =>
    request(`/orders/${id}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, paymentMethod }),
    }),
};

// ─── Activity Logs ───────────────────────────────────────────────────────────
export const activityLogsApi = {
  list: (query?: { search?: string; entity?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.entity) params.append('entity', query.entity);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    const queryString = params.toString();
    return request<{ data: ActivityLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/activity-logs${queryString ? `?${queryString}` : ''}`,
    );
  },
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  getOverview: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    q.append('limit', String(params?.limit ?? 10));
    return request<PaginatedResponse<InventoryItem>>(`/inventory?${q.toString()}`);
  },

  updateStock: (productId: string, data: { availableStock: number; dailyProductionRate: number }) =>
    request(`/inventory/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createProductionEntry: (data: { productId: string; quantity: number; date: string }) =>
    request<ProductionEntry>('/inventory/production', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProductionHistory: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    q.append('limit', String(params?.limit ?? 10));
    return request<PaginatedResponse<ProductionEntry>>(`/inventory/production?${q.toString()}`);
  },

  adjustStock: (productId: string, data: { change: number; reason?: string; date: string }) =>
    request<StockHistoryEntry>(`/inventory/${productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStockHistory: (productId: string) =>
    request<StockHistoryEntry[]>(`/inventory/${productId}/history`),
};
