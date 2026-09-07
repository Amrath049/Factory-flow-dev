// Base URL — uses Vite proxy in dev, real URL in production
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// ─── Token helpers ──────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('ff_token');
export const setToken = (token: string) => localStorage.setItem('ff_token', token);
export const clearToken = () => localStorage.removeItem('ff_token');
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
  login: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// ─── Types ───────────────────────────────────────────────────────────────────
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
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface OrderSummary {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerId: string;
  orderDate: string;
  deliveryDate: string;
  status: 'PENDING' | 'IN_PRODUCTION' | 'DELIVERED';
  productsCount: number;
}

export interface OrderDetail {
  id: string;
  orderId: string;
  status: 'PENDING' | 'IN_PRODUCTION' | 'DELIVERED';
  orderDate: string;
  deliveryDate: string;
  notes?: string;
  customer: { id: string; name: string; phone: string };
  address: Address;
  items: OrderItem[];
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

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => request<DashboardData>('/dashboard'),
};

// ─── Customers ───────────────────────────────────────────────────────────────
export const customersApi = {
  list: () => request<Customer[]>('/customers'),

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
  list: () => request<Product[]>('/products'),

  create: (name: string) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  update: (id: string, name: string) =>
    request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  delete: (id: string) =>
    request(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: () => request<OrderSummary[]>('/orders'),

  get: (id: string) => request<OrderDetail>(`/orders/${id}`),

  create: (data: {
    customerId: string;
    addressId: string;
    items: { productId: string; quantity: number }[];
    deliveryDate: string;
    notes?: string;
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
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  getOverview: () => request<InventoryItem[]>('/inventory'),

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

  getProductionHistory: () => request<ProductionEntry[]>('/inventory/production'),

  adjustStock: (productId: string, data: { change: number; reason?: string; date: string }) =>
    request<StockHistoryEntry>(`/inventory/${productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStockHistory: (productId: string) =>
    request<StockHistoryEntry[]>(`/inventory/${productId}/history`),
};
