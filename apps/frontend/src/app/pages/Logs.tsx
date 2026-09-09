import { useState, useEffect } from "react";
import { Search, Clock, Filter, RefreshCw } from "lucide-react";
import { activityLogsApi, type ActivityLog } from "../utils/api";
import { toast } from "sonner";

export function Logs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async (currentPage = page, currentSearch = search, currentEntity = selectedEntity) => {
    setLoading(true);
    try {
      const res = await activityLogsApi.list({
        page: currentPage,
        limit: 15,
        search: currentSearch.trim() || undefined,
        entity: currentEntity !== "ALL" ? currentEntity : undefined,
      });
      setLogs(res.data);
      setTotalPages(res.meta.totalPages || 1);
      setTotalLogs(res.meta.total || 0);
    } catch {
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, search, selectedEntity);
  }, [page, selectedEntity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1, search, selectedEntity);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-50 text-green-700 border-green-200";
    if (action.includes("UPDATE")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (action.includes("DELETE")) return "bg-red-50 text-red-700 border-red-200";
    if (action.includes("STATUS") || action.includes("PAYMENT")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">System Activity Logs</h2>
          {/* <p className="text-sm text-gray-500">Industry-standard audit trail tracking user changes and system actions</p> */}
        </div>
        <button
          onClick={() => fetchLogs()}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, description, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600 uppercase">Entity:</span>
          <select
            value={selectedEntity}
            onChange={(e) => { setSelectedEntity(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Entities</option>
            <option value="Customer">Customer</option>
            <option value="Product">Product</option>
            <option value="Order">Order</option>
            <option value="InvoiceSettings">Invoice Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No activity logs recorded matching your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Timestamp</th>
                  <th className="px-6 py-3.5 text-left">User</th>
                  <th className="px-6 py-3.5 text-left">Action</th>
                  <th className="px-6 py-3.5 text-left">Entity</th>
                  <th className="px-6 py-3.5 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs">{log.userName}</div>
                          <div className="text-xs text-gray-400">{log.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 text-xs">
                      {log.entity}
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-xs max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <div>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalLogs} total entries)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
