import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { customersApi, productsApi, ordersApi, type Customer, type Product } from "../utils/api";

export function CreateOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add customer inline
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", addressLine: "", city: "", state: "", pincode: "" });

  // Add address inline (step 2)
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressLine: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    customersApi.list().then(setCustomers);
    productsApi.list().then(setProducts);
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleAddItem = () => {
    if (products.length > 0) {
      setOrderItems([...orderItems, { productId: products[0].id, quantity: 0 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: "productId" | "quantity", value: string | number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const addresses = newCustomer.addressLine.trim()
        ? [{ addressLine: newCustomer.addressLine, city: newCustomer.city, state: newCustomer.state, pincode: newCustomer.pincode }]
        : [];
      const created = await customersApi.create({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
        addresses,
      });
      const updated = [created, ...customers];
      setCustomers(updated);
      setSelectedCustomerId(created.id);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "", addressLine: "", city: "", state: "", pincode: "" });
      toast.success("Customer created and selected.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!selectedCustomer || !newAddress.addressLine.trim()) return;
    setSaving(true);
    try {
      const created = await customersApi.addAddress(selectedCustomer.id, newAddress);
      // Update local customers list with new address
      setCustomers(customers.map(c =>
        c.id === selectedCustomer.id
          ? { ...c, addresses: [...c.addresses, created] }
          : c
      ));
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewAddress({ addressLine: "", city: "", state: "", pincode: "" });
      toast.success("Address added and selected.");
    } catch (err: any) {
      toast.error(err.message || "Failed to add address.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ordersApi.create({
        customerId: selectedCustomerId,
        addressId: selectedAddressId,
        items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        deliveryDate,
        notes: notes || undefined,
      });
      navigate("/orders");
      toast.success("Order created successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to create order: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create New Order</h2>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center min-w-fit">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s === step ? "bg-blue-600 text-white" : s < step ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                {s}
              </div>
              {s < 5 && <div className={`w-12 sm:w-16 h-1 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Customer */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Customer</h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => { setSelectedCustomerId(e.target.value); setShowAddCustomer(false); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddCustomer(!showAddCustomer)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              {showAddCustomer ? "Cancel" : "Add New Customer"}
            </button>

            {showAddCustomer && (
              <form onSubmit={handleCreateCustomer} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">New Customer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                    <input type="tel" required value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                    <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 mt-2">Address (optional)</p>
                <input type="text" placeholder="Address Line" value={newCustomer.addressLine} onChange={(e) => setNewCustomer({ ...newCustomer, addressLine: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="City" value={newCustomer.city} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="State" value={newCustomer.state} onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Pincode" value={newCustomer.pincode} onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Create & Select"}</button>
                  <button type="button" onClick={() => setShowAddCustomer(false)} className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedCustomerId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Select Address */}
        {step === 2 && selectedCustomer && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Delivery Address</h3>
            <div className="space-y-3">
              {selectedCustomer.addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer ${selectedAddressId === address.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{address.addressLine}</p>
                    <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                  </div>
                </label>
              ))}

              {selectedCustomer.addresses.length === 0 && !showAddAddress && (
                <p className="text-sm text-gray-500 py-2">No addresses found for this customer.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              {showAddAddress ? "Cancel" : "Add New Address"}
            </button>

            {showAddAddress && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                <p className="text-sm font-medium text-gray-700">New Address</p>
                <input type="text" placeholder="Address Line *" value={newAddress.addressLine} onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddAddress} disabled={saving || !newAddress.addressLine.trim()} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save & Select"}</button>
                  <button type="button" onClick={() => { setShowAddAddress(false); setNewAddress({ addressLine: "", city: "", state: "", pincode: "" }); }} className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(3)} disabled={!selectedAddressId} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Add Products */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Add Products</h3>
              <button onClick={handleAddItem} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products added yet</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateItem(index, "productId", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) => handleUpdateItem(index, "quantity", Number(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button onClick={() => handleRemoveItem(index)} className="p-2 text-red-600 hover:bg-red-50 rounded mt-6">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Back</button>
              <button
                onClick={() => setStep(4)}
                disabled={orderItems.length === 0 || orderItems.some(i => i.quantity <= 0)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Delivery Details */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Delivery Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                // min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any special instructions or notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(5)} disabled={!deliveryDate} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}

        {/* Step 5: Review and Create */}
        {step === 5 && selectedCustomer && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Review Order</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                <p className="text-gray-700">{selectedCustomer.name}</p>
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              </div>

              {selectedCustomer.addresses.find(a => a.id === selectedAddressId) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  {(() => {
                    const addr = selectedCustomer.addresses.find(a => a.id === selectedAddressId)!;
                    return <>
                      <p className="text-gray-700">{addr.addressLine}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </>;
                  })()}
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Products</h4>
                <div className="space-y-2">
                  {orderItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{product?.name}</span>
                        <span className="text-gray-600">{item.quantity.toLocaleString()} units</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Delivery Date</h4>
                <p className="text-gray-700">{new Date(deliveryDate).toLocaleDateString()}</p>
              </div>

              {notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700">{notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
