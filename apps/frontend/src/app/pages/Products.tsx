import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { Plus, Pencil, Trash2, Tag, Package } from "lucide-react";
import { toast } from "sonner";
import { productsApi, type Product, type PaginationMeta } from "../utils/api";
import { PaginationBar } from "../components/ui/PaginationBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
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

interface OutletContextType {
  searchQuery?: string;
}

export function Products() {
  const { searchQuery = "" } = useOutletContext<OutletContextType>() || {};

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Add form fields
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [discountedPrice, setDiscountedPrice] = useState<string>("");
  const [initialStock, setInitialStock] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editDiscountedPrice, setEditDiscountedPrice] = useState<string>("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchProducts = (query: string, page: number) => {
    setLoading(true);
    productsApi.list({ search: query, page, limit: 10 })
      .then(({ data, meta }) => {
        setProducts(data);
        setMeta(meta);
      })
      .catch(() => setError("Failed to load products."))
      .finally(() => setLoading(false));
  };

  // Reset page on search change (avoids double-fetch)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch whenever page or search changes
  useEffect(() => {
    fetchProducts(searchQuery, currentPage);
  }, [searchQuery, currentPage]);

  const resetAddForm = () => {
    setProductName("");
    setPrice("");
    setDiscountedPrice("");
    setInitialStock("0");
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const p = price ? parseFloat(price) : undefined;
    const dp = discountedPrice ? parseFloat(discountedPrice) : undefined;

    if (p !== undefined && p < 1) {
      toast.error("Standard price must be at least ₹1.");
      return;
    }

    if (dp !== undefined && dp < 1) {
      toast.error("Discounted price must be at least ₹1.");
      return;
    }

    if (p !== undefined && dp !== undefined && dp >= p) {
      toast.error("Discounted price must be less than standard price.");
      return;
    }

    setSaving(true);
    try {
      const created = await productsApi.create({
        name: productName.trim(),
        price: p,
        discountedPrice: dp,
        initialStock: initialStock ? parseInt(initialStock, 10) : 0,
      });
      toast.success("Product created successfully!");
      setProducts([created, ...products]);
      resetAddForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to create product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    setSaving(true);
    try {
      await productsApi.delete(deleteConfirmId);
      setProducts(products.filter(p => p.id !== deleteConfirmId));
      toast.success("Product deleted successfully");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete product.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price !== undefined && product.price !== null ? String(product.price) : "");
    setEditDiscountedPrice(product.discountedPrice !== undefined && product.discountedPrice !== null ? String(product.discountedPrice) : "");
  };

  const handleEditSave = async (id: string) => {
    if (!editName.trim()) return;

    const p = editPrice ? parseFloat(editPrice) : undefined;
    const dp = editDiscountedPrice ? parseFloat(editDiscountedPrice) : undefined;

    if (p !== undefined && dp !== undefined && dp >= p) {
      toast.error("Discounted price must be less than standard price.");
      return;
    }

    setSaving(true);
    try {
      const updated = await productsApi.update(id, {
        name: editName.trim(),
        price: p,
        discountedPrice: dp,
      });
      toast.success("Product updated successfully!");
      setProducts(products.map(prod => prod.id === id ? updated : prod));
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  // Backend handles filtering & pagination
  const paginatedProducts = products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Manage catalog, pricing, and stock levels</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Add Product Modal Popup */}
      <Dialog open={showAddForm} onOpenChange={(open) => { if (!open) resetAddForm(); else setShowAddForm(true); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add New Product</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create a new catalog item with pricing and initial inventory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="enter name"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Standard Price (₹) <span className="text-gray-400 font-normal"></span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={discountedPrice ? Number(discountedPrice) + 0.01 : 1}
                  value={price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setPrice('');
                      return;
                    }
                    const numVal = Number(value);
                    if (numVal >= 1) {
                      setPrice(value);
                      if (discountedPrice && Number(discountedPrice) >= numVal) {
                        setDiscountedPrice('');
                      }
                    }
                  }}
                  placeholder="e.g. 5.50"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Discounted Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={price ? Number(price) - 0.01 : undefined}
                  value={discountedPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setDiscountedPrice('');
                      return;
                    }
                    const disc = Number(value);
                    const prc = Number(price);
                    if (disc >= 1 && (!price || disc < prc)) {
                      setDiscountedPrice(value);
                    }
                  }}
                  placeholder="e.g. 4.80"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Initial Stock <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <button
                type="button"
                onClick={resetAddForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !productName.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold text-xs shadow-xs"
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading && <div className="text-center py-12 text-gray-500">Loading products...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Standard Price</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discounted Price</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Available Stock</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs italic">
                      {searchQuery ? `No product matching "${searchQuery}"` : "No products added yet."}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        {editingId === product.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {editingId === product.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min={editDiscountedPrice ? Number(editDiscountedPrice) + 0.01 : 1}
                            value={editPrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setEditPrice('');
                                return;
                              }
                              const numVal = Number(value);
                              if (numVal >= 1) {
                                setEditPrice(value);
                                // If discounted price exists and is >= new price, adjust or clear it
                                if (editDiscountedPrice && Number(editDiscountedPrice) >= numVal) {
                                  setEditDiscountedPrice('');
                                }
                              }
                            }}
                            placeholder="Price (₹)"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        ) : product.price !== undefined && product.price !== null ? (
                          <span className="font-semibold text-gray-900">₹{Number(product.price).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not set</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingId === product.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            max={editPrice ? Number(editPrice) - 0.01 : undefined}
                            value={editDiscountedPrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setEditDiscountedPrice('');
                                return;
                              }
                              const discountedPrice = Number(value);
                              const price = Number(editPrice);

                              if (
                                discountedPrice >= 1 &&
                                (!editPrice || discountedPrice < price)
                              ) {
                                setEditDiscountedPrice(value);
                              }
                            }}
                            placeholder="Disc (₹)"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        ) : product.discountedPrice !== undefined && product.discountedPrice !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Tag className="w-3 h-3" />
                            ₹{Number(product.discountedPrice).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not set</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-medium text-xs">
                          <Package className="w-3.5 h-3.5 text-gray-500" />
                          {product.inventory?.availableStock ?? 0} units
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {editingId === product.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditSave(product.id)} disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50 font-medium">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 font-medium">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit product details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(product.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and all associated inventory data, production history, and order references.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
