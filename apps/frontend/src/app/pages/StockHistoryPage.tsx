import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { inventoryApi, type InventoryItem, type StockHistoryEntry } from "../utils/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const PAGE_SIZE = 15;

export function StockHistoryPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [productName, setProductName] = useState("...");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Adjust stock modal
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustChange, setAdjustChange] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustDate, setAdjustDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    if (!productId) return;
    Promise.all([
      inventoryApi.getStockHistory(productId),
      inventoryApi.getOverview(),
    ]).then(([hist, overview]) => {
      setHistory(hist);
      const item: InventoryItem | undefined = overview.find((i) => i.productId === productId);
      if (item) {
        setProductName(item.productName);
        setCurrentStock(item.availableStock);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const handleAdjustSubmit = async () => {
    if (!productId || !adjustChange) return;
    const change = parseInt(adjustChange, 10);
    if (isNaN(change) || change === 0) {
      toast.error("Please enter a valid non-zero number.");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.adjustStock(productId, {
        change,
        reason: adjustReason.trim() || undefined,
        date: adjustDate,
      });
      // Refresh data inline
      const [hist, overview] = await Promise.all([
        inventoryApi.getStockHistory(productId),
        inventoryApi.getOverview(),
      ]);
      setHistory(hist);
      const item = overview.find((i) => i.productId === productId);
      if (item) setCurrentStock(item.availableStock);
      setPage(1);
      toast.success(`Stock ${change > 0 ? "added" : "deducted"} successfully.`);
      setShowAdjust(false);
      setAdjustChange("");
      setAdjustReason("");
      setAdjustDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const paginated = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/inventory")}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Stock History</h2>
          <p className="text-sm text-gray-500 mt-0.5">{productName}</p>
        </div>
        {currentStock !== null && (
          <div className="ml-auto flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <span className="text-gray-500">Current Stock:</span>{" "}
              <span className="font-semibold text-gray-900">{currentStock.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowAdjust(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Pencil className="w-4 h-4" />
              Adjust Stock
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Before</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock After</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No stock history found for this product.
                    </td>
                  </tr>
                ) : (
                  paginated.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${entry.change > 0 ? "text-green-600" : "text-red-600"}`}>
                          {entry.change > 0 ? `+${entry.change.toLocaleString()}` : entry.change.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.previousStock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.newStock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.reason ?? <span className="italic text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, history.length)} of {history.length} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-500">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={`px-3 py-1.5 text-sm border rounded-lg ${
                          page === item
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      <AlertDialog open={showAdjust} onOpenChange={(open) => !open && setShowAdjust(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust Stock — {productName}</AlertDialogTitle>
            <AlertDialogDescription>
              Current stock: <strong>{currentStock?.toLocaleString()}</strong>. Enter a positive number to add stock or a negative number to deduct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Change *</label>
              <input
                type="number"
                value={adjustChange}
                onChange={(e) => setAdjustChange(e.target.value)}
                placeholder="e.g. +500 or -100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {adjustChange && !isNaN(parseInt(adjustChange, 10)) && currentStock !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  New stock after update: <span className="font-medium text-gray-900">{(currentStock + parseInt(adjustChange, 10)).toLocaleString()}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Stock count correction"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={adjustDate}
                onChange={(e) => setAdjustDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdjustSubmit} disabled={saving || !adjustChange} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
