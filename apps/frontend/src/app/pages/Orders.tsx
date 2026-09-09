import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { Plus, Eye } from "lucide-react";
import { ordersApi, type OrderSummary, type PaginationMeta } from "../utils/api";
import { PaginationBar } from "../components/ui/PaginationBar";

interface OutletContextType {
  searchQuery?: string;
}

const DEFAULT_META: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

type OrderStatusFilter = 'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED';

export function Orders() {
  const { searchQuery = "" } = useOutletContext<OutletContextType>() || {};

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("ALL");

  const fetchOrders = (search: string, status: OrderStatusFilter, page: number) => {
    setLoading(true);
    setError("");
    ordersApi.list({ search, status: status === "ALL" ? undefined : status, page, limit: 10 })
      .then(({ data, meta }) => {
        setOrders(data);
        setMeta(meta);
      })
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  };

  // Reset page on search or status change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Fetch whenever page, search, or status changes
  useEffect(() => {
    fetchOrders(searchQuery, statusFilter, currentPage);
  }, [searchQuery, statusFilter, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-50 text-amber-800 border border-amber-300";
      case "DELIVERED": return "bg-emerald-50 text-emerald-800 border border-emerald-300";
      case "CANCELLED": return "bg-red-50 text-red-800 border border-red-300";
      default: return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Pending";
      case "DELIVERED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">Track factory orders, payment status, and delivery schedules</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/orders/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs / Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-1">
        <div className="flex items-center gap-1 sm:gap-2">
          {(
            [
              { id: "ALL", label: "All Orders" },
              { id: "PENDING", label: "Pending" },
              { id: "DELIVERED", label: "Completed" },
              { id: "CANCELLED", label: "Cancelled" },

            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors relative ${
                  isActive
                    ? "text-indigo-600 bg-indigo-50/80 shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-gray-500">
          <span>Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatusFilter)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Loading orders...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Delivery Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grand Total</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-xs italic">
                      {searchQuery
                        ? `No orders matching "${searchQuery}"${statusFilter !== 'ALL' ? ` with status ${statusFilter === 'DELIVERED' ? 'Completed' : 'Pending'}` : ''}`
                        : statusFilter !== 'ALL'
                        ? `No ${statusFilter === 'DELIVERED' ? 'completed' : statusFilter === 'CANCELLED' ? 'cancelled' : 'pending'} orders found.`
                        : "No orders placed yet."}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{order.orderId}</div>
                        <div className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{order.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{Number(order.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          order.paymentStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <Link to={`/orders/${order.id}`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex items-center" title="View Order Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            itemsPerPage={meta.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
