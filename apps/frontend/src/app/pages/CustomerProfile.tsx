import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { customersApi, type CustomerDetail, type Address } from "../utils/api";
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

export function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit customer
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });

  // Add address
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressLine: "", city: "", state: "", pincode: "" });

  // Edit address
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [editAddressForm, setEditAddressForm] = useState({ addressLine: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    if (!id) return;
    customersApi.get(id)
      .then((data) => { setCustomer(data); setEditForm({ name: data.name, phone: data.phone, email: data.email ?? "" }); })
      .catch(() => setError("Customer not found."))
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Pending";
      case "IN_PRODUCTION": return "In Production";
      case "DELIVERED": return "Delivered";
      default: return status;
    }
  };

  const handleEditCustomerSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await customersApi.update(customer.id, { name: editForm.name, phone: editForm.phone, email: editForm.email || undefined });
      setCustomer({ ...customer, name: editForm.name, phone: editForm.phone, email: editForm.email || customer.email });
      setShowEditCustomer(false);
      toast.success("Customer updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!customer || !newAddress.addressLine.trim()) return;
    setSaving(true);
    try {
      const created = await customersApi.addAddress(customer.id, newAddress);
      setCustomer({ ...customer, addresses: [...customer.addresses, created] });
      setShowAddAddress(false);
      setNewAddress({ addressLine: "", city: "", state: "", pincode: "" });
      toast.success("Address added.");
    } catch (err: any) {
      toast.error(err.message || "Failed to add address.");
    } finally {
      setSaving(false);
    }
  };

  const openEditAddress = (addr: Address) => {
    setEditAddress(addr);
    setEditAddressForm({ addressLine: addr.addressLine, city: addr.city, state: addr.state, pincode: addr.pincode });
  };

  const handleEditAddressSave = async () => {
    if (!customer || !editAddress) return;
    setSaving(true);
    try {
      const updated = await customersApi.updateAddress(editAddress.id, editAddressForm);
      setCustomer({ ...customer, addresses: customer.addresses.map(a => a.id === editAddress.id ? { ...a, ...updated } : a) });
      setEditAddress(null);
      toast.success("Address updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update address.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (error || !customer) return <div className="text-center py-12 text-red-500">{error || "Customer not found"}</div>;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Customer details card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{customer.name}</h2>
          <button onClick={() => setShowEditCustomer(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit customer">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{customer.phone}</p>
            </div>
          </div>

          {customer.email && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{customer.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Addresses card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
          <button
            onClick={() => setShowAddAddress(true)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>

        {showAddAddress && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
            <p className="text-sm font-medium text-gray-700">New Address</p>
            <input type="text" placeholder="Address Line *" value={newAddress.addressLine} onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAddress} disabled={saving || !newAddress.addressLine.trim()} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => { setShowAddAddress(false); setNewAddress({ addressLine: "", city: "", state: "", pincode: "" }); }} className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {customer.addresses.length === 0 && !showAddAddress && (
            <p className="text-sm text-gray-500 py-2">No addresses yet.</p>
          )}
          {customer.addresses.map((address) => (
            <div key={address.id} className="flex gap-3 p-4 border border-gray-200 rounded-lg group">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{address.addressLine}</p>
                <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
              </div>
              <button onClick={() => openEditAddress(address)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Edit address">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Products</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customer.orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/orders/${order.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      {order.orderId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                    {order.productsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      <AlertDialog open={showEditCustomer} onOpenChange={(open) => !open && setShowEditCustomer(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Customer</AlertDialogTitle>
            <AlertDialogDescription>Update the customer's details.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditCustomerSave} disabled={saving || !editForm.name || !editForm.phone} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Address Modal */}
      <AlertDialog open={!!editAddress} onOpenChange={(open) => !open && setEditAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Address</AlertDialogTitle>
            <AlertDialogDescription>Update the address details below.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
              <input type="text" value={editAddressForm.addressLine} onChange={(e) => setEditAddressForm({ ...editAddressForm, addressLine: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={editAddressForm.city} onChange={(e) => setEditAddressForm({ ...editAddressForm, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={editAddressForm.state} onChange={(e) => setEditAddressForm({ ...editAddressForm, state: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input type="text" value={editAddressForm.pincode} onChange={(e) => setEditAddressForm({ ...editAddressForm, pincode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditAddressSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
