import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Plus, Trash2, Percent } from "lucide-react";
import { customersApi, productsApi, Customer, Product } from "../utils/api";

interface ProductRow {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface AdditionalCharge {
  id: string;
  title: string;
  amount: number;
  reason: string;
}

export function InvoiceGenerator() {
  const navigate = useNavigate();
  const location = useLocation();

  // Restore data if coming back from "Edit Invoice"
  const edit = location.state as null | {
    customer: { name: string; phone: string; address: string };
    products: Array<{ productName: string; quantity: number; price: number; total: number }>;
    discount: { type: "flat" | "percentage"; value: number; amount: number; reason: string };
    additionalCharges: Array<{ title: string; amount: number; reason: string }>;
  };

  // API data
  const [apiCustomers, setApiCustomers] = useState<Customer[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([customersApi.list(), productsApi.list()])
      .then(([customers, products]) => {
        setApiCustomers(customers);
        setApiProducts(products);
      })
      .finally(() => setLoading(false));
  }, []);

  // Customer Details — pre-filled from edit state if present
  const [selectedCustomer, setSelectedCustomer] = useState(edit?.customer.name ?? "");
  const [phone, setPhone] = useState(edit?.customer.phone ?? "");
  const [address, setAddress] = useState(edit?.customer.address ?? "");

  // Product Details — restored from edit state or start with one empty row
  const [products, setProducts] = useState<ProductRow[]>(
    edit?.products.map((p, i) => ({ ...p, id: `edit-${i}` })) ??
    [{ id: "1", productName: "", quantity: 0, price: 0, total: 0 }]
  );

  // Discount — restored from edit state
  const [discountType, setDiscountType] = useState<"flat" | "percentage">(edit?.discount.type ?? "flat");
  const [discountValue, setDiscountValue] = useState(edit?.discount.value ?? 0);
  const [discountReason, setDiscountReason] = useState(edit?.discount.reason ?? "");

  // Additional Charges — restored from edit state
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(
    edit?.additionalCharges.map((c, i) => ({ ...c, id: `edit-charge-${i}` })) ?? []
  );

  // Auto-populate customer details
  const handleCustomerChange = (customerName: string) => {
    setSelectedCustomer(customerName);
    const customer = apiCustomers.find((c) => c.name === customerName);
    if (customer) {
      setPhone(customer.phone);
      const primaryAddress = customer.addresses[0];
      if (primaryAddress) {
        setAddress(
          `${primaryAddress.addressLine}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.pincode}`
        );
      }
    }
  };

  // Product handlers
  const addProduct = () => {
    setProducts([
      ...products,
      { id: Date.now().toString(), productName: "", quantity: 0, price: 0, total: 0 }
    ]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: string | number) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === "quantity" || field === "price") {
          updated.total = Number(updated.quantity) * Number(updated.price);
        }
        return updated;
      }
      return p;
    }));
  };

  // Additional Charges handlers
  const addAdditionalCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now().toString(), title: "", amount: 0, reason: "" }
    ]);
  };

  const removeAdditionalCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter(c => c.id !== id));
  };

  const updateAdditionalCharge = (id: string, field: keyof AdditionalCharge, value: string | number) => {
    setAdditionalCharges(additionalCharges.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // Calculations
  const subtotal = products.reduce((sum, p) => sum + p.total, 0);
  const discountAmount = discountType === "flat" 
    ? discountValue 
    : (subtotal * discountValue) / 100;
  const additionalChargesTotal = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
  const grandTotal = subtotal - discountAmount + additionalChargesTotal;

  // Validation
  const hasValidProducts = products.some(p => p.productName && p.quantity > 0 && p.price > 0);
  const hasCustomerDetails = selectedCustomer && phone && address;

  const handleGenerateInvoice = () => {
    if (!hasValidProducts || !hasCustomerDetails) return;

    const invoiceData = {
      customer: { name: selectedCustomer, phone, address },
      products: products.filter(p => p.productName && p.quantity > 0),
      discount: { type: discountType, value: discountValue, amount: discountAmount, reason: discountReason },
      additionalCharges,
      subtotal,
      grandTotal,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    };

    navigate("/invoice/preview", { state: invoiceData });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Generate Invoice</h1>
        <p className="text-gray-600 mt-1">Create and download professional invoices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{loading ? "Loading customers..." : "Select a customer"}</option>
                  {apiCustomers.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter delivery address"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Product {index + 1}</span>
                    {products.length > 1 && (
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <select
                        value={product.productName}
                        onChange={(e) => updateProduct(product.id, "productName", e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">{loading ? "Loading products..." : "Select product"}</option>
                        {apiProducts.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={product.quantity || ""}
                        onChange={(e) => updateProduct(product.id, "quantity", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.price || ""}
                        onChange={(e) => updateProduct(product.id, "price", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {product.total > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-semibold text-gray-900">₹{product.total.toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addProduct}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Discount */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount (Optional)</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setDiscountType("flat")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    discountType === "flat"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Flat Amount
                </button>
                <button
                  onClick={() => setDiscountType("percentage")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    discountType === "percentage"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Percent className="w-4 h-4 inline mr-1" />
                  Percentage
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount {discountType === "percentage" ? "Percentage" : "Amount (₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step={discountType === "percentage" ? "1" : "0.01"}
                  max={discountType === "percentage" ? "100" : undefined}
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={discountType === "percentage" ? "0" : "0.00"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Seasonal discount"
                />
              </div>
            </div>
          </div>

          {/* Additional Charges */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Charges (Optional)</h2>
            <div className="space-y-4">
              {additionalCharges.map((charge, index) => (
                <div key={charge.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Charge {index + 1}</span>
                    <button
                      onClick={() => removeAdditionalCharge(charge.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={charge.title}
                        onChange={(e) => updateAdditionalCharge(charge.id, "title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Transport, Packing"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={charge.amount || ""}
                        onChange={(e) => updateAdditionalCharge(charge.id, "amount", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason (Optional)
                      </label>
                      <input
                        type="text"
                        value={charge.reason}
                        onChange={(e) => updateAdditionalCharge(charge.id, "reason", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter reason"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addAdditionalCharge}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Additional Charge
              </button>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Discount {discountType === "percentage" && `(${discountValue}%)`}
                  </span>
                  <span className="font-medium text-green-600">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {additionalCharges.length > 0 && additionalCharges.some(c => c.amount > 0) && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Additional Charges:</p>
                  {additionalCharges.filter(c => c.amount > 0).map(charge => (
                    <div key={charge.id} className="flex justify-between text-sm pl-2">
                      <span className="text-gray-600">{charge.title || "Charge"}</span>
                      <span className="font-medium text-gray-900">₹{charge.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t-2 border-gray-300">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                  <span className="text-lg font-bold text-blue-600">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateInvoice}
              disabled={!hasValidProducts || !hasCustomerDetails}
              className={`w-full mt-6 px-4 py-3 rounded-md font-medium transition-colors ${
                hasValidProducts && hasCustomerDetails
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Generate Invoice
            </button>

            {(!hasValidProducts || !hasCustomerDetails) && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                {!hasCustomerDetails && "Please fill customer details. "}
                {!hasValidProducts && "Please add at least one product."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-10">
        <button
          onClick={handleGenerateInvoice}
          disabled={!hasValidProducts || !hasCustomerDetails}
          className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
            hasValidProducts && hasCustomerDetails
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Generate Invoice - ₹{grandTotal.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
