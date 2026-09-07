import { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { inventoryApi, productsApi, type InventoryItem, type ProductionEntry, type Product } from "../utils/api";
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

export function Inventory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "production">("overview");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [production, setProduction] = useState<ProductionEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Adjust stock modal
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustChange, setAdjustChange] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustDate, setAdjustDate] = useState(new Date().toISOString().split("T")[0]);

  // Stock form state
  const [stockProductId, setStockProductId] = useState("");
  const [stockAvailable, setStockAvailable] = useState("");
  const [stockDailyRate, setStockDailyRate] = useState("");

  // Production form state
  const [prodProductId, setProdProductId] = useState("");
  const [prodQuantity, setProdQuantity] = useState("");
  const [prodDate, setProdDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      inventoryApi.getOverview(),
      inventoryApi.getProductionHistory(),
      productsApi.list(),
    ]).then(([inv, prod, prods]) => {
      setInventory(inv);
      setProduction(prod);
      setProducts(prods);
      if (prods.length > 0) {
        setStockProductId(prods[0].id);
        setProdProductId(prods[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.updateStock(stockProductId, {
        availableStock: Number(stockAvailable),
        dailyProductionRate: Number(stockDailyRate),
      });
      const updated = await inventoryApi.getOverview();
      setInventory(updated);
      setShowStockForm(false);
      setStockAvailable("");
      setStockDailyRate("");
      toast.success("Stock updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!adjustProductId || !adjustChange) return;
    const change = parseInt(adjustChange, 10);
    if (isNaN(change) || change === 0) {
      toast.error("Please enter a valid non-zero number.");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.adjustStock(adjustProductId, {
        change,
        reason: adjustReason.trim() || undefined,
        date: adjustDate,
      });
      const updated = await inventoryApi.getOverview();
      setInventory(updated);
      toast.success(`Stock ${change > 0 ? "added" : "deducted"} successfully.`);
      setAdjustProductId(null);
      setAdjustChange("");
      setAdjustReason("");
      setAdjustDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock.");
    } finally {
      setSaving(false);
    }
  };

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const entry = await inventoryApi.createProductionEntry({
        productId: prodProductId,
        quantity: Number(prodQuantity),
        date: prodDate,
      });
      setProduction([entry, ...production]);
      setShowProductionForm(false);
      setProdQuantity("");
      toast.success("Production entry saved.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save production entry.");
    } finally {
      setSaving(false);
    }
  };

  const adjustProduct = adjustProductId
    ? inventory.find((i) => i.productId === adjustProductId)
    : null;

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Inventory</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
          >
            Stock Overview
          </button>
          <button
            onClick={() => setActiveTab("production")}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === "production" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
          >
            Inventory Tracking
          </button>
        </nav>
      </div>

      {/* Stock Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowStockForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Update Stock
            </button>
          </div>

          {showStockForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Update Stock</h3>
              <form className="space-y-4" onSubmit={handleStockSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                  <select
                    value={stockProductId}
                    onChange={(e) => setStockProductId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Available Stock *</label>
                  <input
                    type="number" min="0" required value={stockAvailable}
                    onChange={(e) => setStockAvailable(e.target.value)}
                    placeholder="Enter stock quantity"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Production Rate</label>
                  <input
                    type="number" min="0" value={stockDailyRate}
                    onChange={(e) => setStockDailyRate(e.target.value)}
                    placeholder="Units produced per day"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Updating..." : "Update Stock"}
                  </button>
                  <button type="button" onClick={() => setShowStockForm(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Booked Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Free Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Daily Production</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <>
                      <tr key={item.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/inventory/${item.productId}/history`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {item.productName}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.availableStock.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{item.bookedStock.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{item.freeStock.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">{item.dailyProductionRate.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => { setAdjustProductId(item.productId); setAdjustChange(""); setAdjustReason(""); setAdjustDate(new Date().toISOString().split("T")[0]); }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Adjust stock"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Production Tracking Tab */}
      {activeTab === "production" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowProductionForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" />
              Add Production Entry
            </button>
          </div>

          {showProductionForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Production Entry</h3>
              <form className="space-y-4" onSubmit={handleProductionSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                  <select
                    value={prodProductId}
                    onChange={(e) => setProdProductId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Produced *</label>
                  <input
                    type="number" min="1" required value={prodQuantity}
                    onChange={(e) => setProdQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Production Date *</label>
                  <input
                    type="date" value={prodDate}
                    onChange={(e) => setProdDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Entry"}
                  </button>
                  <button type="button" onClick={() => setShowProductionForm(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Production History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {production.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.productName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <AlertDialog open={!!adjustProductId} onOpenChange={(open) => !open && setAdjustProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust Stock — {adjustProduct?.productName}</AlertDialogTitle>
            <AlertDialogDescription>
              Current stock: <strong>{adjustProduct?.availableStock.toLocaleString()}</strong>. Enter a positive number to add stock or a negative number to deduct.
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
              {adjustChange && !isNaN(parseInt(adjustChange, 10)) && adjustProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  New stock after update: <span className="font-medium text-gray-900">{(adjustProduct.availableStock + parseInt(adjustChange, 10)).toLocaleString()}</span>
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
