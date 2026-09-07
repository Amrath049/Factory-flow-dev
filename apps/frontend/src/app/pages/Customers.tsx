import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { customersApi, type Customer } from "../utils/api";
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

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    addresses: [{ addressLine: "", city: "", state: "", pincode: "" }]
  });

  // Edit customer modal
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    customersApi.list()
      .then(setCustomers)
      .catch(() => setError("Failed to load customers."))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Customers</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Addresses</h4>
                <button type="button" onClick={handleAddAddress} className="text-sm text-blue-600 hover:text-blue-700">
                  + Add Another Address
                </button>
              </div>
              {formData.addresses.map((address, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line</label>
                      <input type="text" value={address.addressLine} onChange={(e) => handleAddressChange(index, 'addressLine', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input type="text" value={address.city} onChange={(e) => handleAddressChange(index, 'city', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input type="text" value={address.state} onChange={(e) => handleAddressChange(index, 'state', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input type="text" value={address.pincode} onChange={(e) => handleAddressChange(index, 'pincode', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save Customer"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="text-center py-12 text-gray-500">Loading customers...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Total Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{customer.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{customer.totalOrders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Link to={`/customers/${customer.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(customer)} className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      <AlertDialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Customer</AlertDialogTitle>
            <AlertDialogDescription>Update the customer's details below.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditSave}
              disabled={saving || !editForm.name || !editForm.phone}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
