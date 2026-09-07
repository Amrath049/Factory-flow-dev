import { useEffect, useState } from "react";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Factory,
  TrendingUp,
  Warehouse
} from "lucide-react";
import { dashboardApi, type DashboardData } from "../utils/api";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.getSummary()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "IN_PRODUCTION": return "bg-blue-100 text-blue-800";
      case "DELIVERED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Pending";
      case "IN_PRODUCTION": return "In Production";
      case "DELIVERED": return "Delivered";
      default: return status;
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!data) return null;

  const metrics = [
    { label: "Total Customers", value: data.totalCustomers, icon: Users, color: "blue" },
    { label: "Total Products", value: data.totalProducts, icon: Package, color: "green" },
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingCart, color: "purple" },
    { label: "Orders in Production", value: data.ordersInProduction, icon: Factory, color: "orange" },
    { label: "Available Stock", value: data.totalAvailableStock.toLocaleString(), icon: Warehouse, color: "indigo" },
    { label: "Production Today", value: data.productionToday.toLocaleString(), icon: TrendingUp, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stock Overview</h3>
          </div>
          <div className="p-6 space-y-4">
            {data.stockOverview.map((item) => (
              <div key={item.productId} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{item.productName}</h4>
                  <span className="text-xs text-gray-500">Daily: {item.dailyProductionRate}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Available:</span>
                    <p className="font-medium text-gray-900">{item.availableStock.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Booked:</span>
                    <p className="font-medium text-gray-900">{item.bookedStock.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Free:</span>
                    <p className="font-medium text-gray-900">{item.freeStock.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
