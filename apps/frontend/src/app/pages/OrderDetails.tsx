import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, MapPin, Calendar, FileText, Edit2, Check, X } from "lucide-react";
import { ordersApi, type OrderDetail } from "../utils/api";

const STATUSES = ["PENDING", "IN_PRODUCTION", "DELIVERED"] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  IN_PRODUCTION: "In Production",
  DELIVERED: "Delivered",
};

export function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status editing state
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PENDING");
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    ordersApi.get(id)
      .then((data) => {
        setOrder(data);
        setSelectedStatus(data.status as OrderStatus);
      })
      .catch(() => setError("Order not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "IN_PRODUCTION": return "bg-blue-100 text-blue-800";
      case "DELIVERED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const saveStatusChange = async () => {
    if (!order || !id) return;
    setSavingStatus(true);
    try {
      await ordersApi.updateStatus(id, selectedStatus);
      setOrder({ ...order, status: selectedStatus });
      setIsEditingStatus(false);
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setSavingStatus(false);
    }
  };

  const cancelStatusChange = () => {
    setSelectedStatus(order?.status as OrderStatus ?? "PENDING");
    setIsEditingStatus(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (error || !order) return <div className="text-center py-12 text-red-500">{error || "Order not found"}</div>;

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Header row: order ID + status editor */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{order.orderId}</h2>
            <p className="text-gray-600 mt-1">Order Details</p>
          </div>

          {/* Status editor */}
          {isEditingStatus ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={saveStatusChange}
                  disabled={savingStatus}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {savingStatus ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelStatusChange}
                  disabled={savingStatus}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
              </span>
              <button
                onClick={() => setIsEditingStatus(true)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit status"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium text-gray-900">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{order.customer.phone}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Date</p>
                  <p className="font-medium text-gray-900">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                </div>
              </div>
              {order.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium text-gray-900">{order.address.addressLine}</p>
                    <p className="text-sm text-gray-600">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-900">{order.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Products Ordered</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
