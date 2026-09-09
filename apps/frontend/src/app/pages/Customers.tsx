import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { customersApi, type Customer, type PaginationMeta } from "../utils/api";
import { PaginationBar } from "../components/ui/PaginationBar";
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

export function Customers() {
  const { searchQuery = "" } = useOutletContext<OutletContextType>() || {};

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    addresses: [{ addressLine: "", city: "", state: "", pincode: "" }]
  });

  // Edit customer modal
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });

  // Delete customer modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadCustomers = (query: string, page: number) => {
    setLoading(true);
    customersApi.list({ search: query, page, limit: 10 })
      .then(({ data, meta }) => {
        setCustomers(data);
        setMeta(meta);
      })
      .catch(() => setError("Failed to load customers."))
      .finally(() => setLoading(false));
  };

  // Reset page on search change (avoids double-fetch)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch whenever page or search changes
  useEffect(() => {
    loadCustomers(searchQuery, currentPage);
  }, [searchQuery, currentPage]);

  const handleAddAddress = () => {
    setFormData({
      ...formData,
      addresses: [...formData.addresses, { addressLine: "", city: "", state: "", pincode: "" }]
    });
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    const updated = [...formData.addresses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, addresses: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await customersApi.create({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        addresses: formData.addresses.filter(a => a.addressLine.trim()),
      });
      setCustomers([created, ...customers]);
      setShowAddForm(false);
      setFormData({ name: "", phone: "", email: "", addresses: [{ addressLine: "", city: "", state: "", pincode: "" }] });
      toast.success("Customer created successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setEditForm({ name: customer.name, phone: customer.phone, email: customer.email ?? "" });
  };

  const handleEditSave = async () => {
    if (!editCustomer) return;
    setSaving(true);
    try {
      const updated = await customersApi.update(editCustomer.id, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email || undefined,
      });
      setCustomers(customers.map(c => c.id === editCustomer.id ? { ...c, ...updated } : c));
      setEditCustomer(null);
      toast.success("Customer updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirmId) return;
    setSaving(true);
    try {
      await customersApi.delete(deleteConfirmId);
      setCustomers(customers.filter(c => c.id !== deleteConfirmId));
      toast.success("Customer deleted successfully.");
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete customer.");
    } finally {
      setSaving(false);
    }
  };

  // Backend handles filtering & pagination
  const paginatedCustomers = customers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500">Manage customer records and addresses</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6">Add New Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Email (optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900 text-sm">Addresses</h4>
                <button type="button" onClick={handleAddAddress} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                  + Add Another Address
                </button>
              </div>
              {formData.addresses.map((address, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address Line</label>
                      <input type="text" value={address.addressLine} onChange={(e) => handleAddressChange(index, 'addressLine', e.target.value)} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <input type="text" value={address.city} onChange={(e) => handleAddressChange(index, 'city', e.target.value)} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                      <input type="text" value={address.state} onChange={(e) => handleAddressChange(index, 'state', e.target.value)} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                      <input type="text" value={address.pincode} onChange={(e) => handleAddressChange(index, 'pincode', e.target.value)} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold text-xs shadow-xs">
                {saving ? "Saving..." : "Save Customer"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="text-center py-12 text-gray-500">Loading customers...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">City</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Total Orders</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs italic">
                      {searchQuery ? `No customer matching "${searchQuery}"` : "No customers added yet."}
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{customer.city || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{customer.totalOrders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/customers/${customer.id}`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View details">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => openEdit(customer)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Edit customer">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirmId(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete customer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Edit Customer Modal */}
      <AlertDialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Customer</AlertDialogTitle>
            <AlertDialogDescription>Update customer details below.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Phone *</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditSave}
              disabled={saving || !editForm.name || !editForm.phone}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {saving ? "Saving..." : "Save Changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Customer Confirmation Modal */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? The customer record will be archived safely without losing order histories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {saving ? "Deleting..." : "Delete Customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
