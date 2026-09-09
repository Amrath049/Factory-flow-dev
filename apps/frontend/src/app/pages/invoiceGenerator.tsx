import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { customersApi, productsApi, Customer, Product } from "../utils/api";
import { SearchableSelect, OptionItem } from "../components/ui/SearchableSelect";

interface ProductRow {
  id: string;
  productId?: string;
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

  // Search states
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const customerSearchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const productSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Customer Details — pre-filled from edit state if present
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomerName, setSelectedCustomerName] = useState(edit?.customer.name ?? "");
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

  useEffect(() => {
    Promise.all([customersApi.list({ limit: 10 }), productsApi.list({ limit: 10 })])
      .then(([customersRes, productsRes]) => {
        setApiCustomers(customersRes.data);
        setApiProducts(productsRes.data);

        // If edit customer exists, find matching in initial batch if possible
        if (edit?.customer.name) {
          const match = customersRes.data.find(c => c.name === edit.customer.name);
          if (match) setSelectedCustomerId(match.id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCustomerSearchQuery = (query: string) => {
    if (customerSearchTimerRef.current) {
      clearTimeout(customerSearchTimerRef.current);
    }
    setSearchingCustomer(true);
    customerSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await customersApi.list({ search: query, limit: 10 });
        setApiCustomers((prev) => {
          const map = new Map<string, Customer>();
          prev.forEach((c) => {
            if (c.id === selectedCustomerId) map.set(c.id, c);
          });
          res.data.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });
      } catch {
        // Silent fail
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);
  };

  const handleProductSearchQuery = (query: string) => {
    if (productSearchTimerRef.current) {
      clearTimeout(productSearchTimerRef.current);
    }
    setSearchingProduct(true);
    productSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await productsApi.list({ search: query, limit: 10 });
        setApiProducts((prev) => {
          const map = new Map<string, Product>();
          const selectedProductIds = products.map((p) => p.productId).filter(Boolean);
          prev.forEach((p) => {
            if (selectedProductIds.includes(p.id)) map.set(p.id, p);
          });
          res.data.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      } catch {
        // Silent fail
      } finally {
        setSearchingProduct(false);
      }
    }, 300);
  };

  // Auto-populate customer details when selected via dropdown
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = apiCustomers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomerName(customer.name);
      setPhone(customer.phone);
      const primaryAddress = customer.addresses?.[0];
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

  const handleProductSelect = (rowId: string, productId: string) => {
    const prod = apiProducts.find((p) => p.id === productId);
    if (!prod) return;

    const rate = prod.discountedPrice ?? prod.price ?? 0;
    setProducts(products.map(p => {
      if (p.id === rowId) {
        const qty = p.quantity > 0 ? p.quantity : 1;
        return {
          ...p,
          productId: prod.id,
          productName: prod.name,
          price: rate,
          quantity: qty,
          total: qty * rate,
        };
      }
      return p;
    }));
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: string | number) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === "quantity" || field === "price") {
          const qty = field === "quantity" ? Number(value) : p.quantity;
          const prc = field === "price" ? Number(value) : p.price;
          updated.total = qty * prc;
        }
        return updated;
      }
      return p;
    }));
  };

  // Additional charge handlers
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
  
  const discountAmount = discountType === "percentage" 
    ? (subtotal * discountValue) / 100 
    : discountValue;

  const totalAdditionalCharges = additionalCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const grandTotal = Math.max(0, subtotal - discountAmount + totalAdditionalCharges);

  const hasValidProducts = products.some(p => p.productName.trim() !== "" && p.quantity > 0 && p.price > 0);
  const hasCustomerDetails = selectedCustomerName.trim() !== "" && phone.trim() !== "";

  const handleGenerateInvoice = () => {
    if (!hasValidProducts || !hasCustomerDetails) return;

    const invoiceData = {
      customer: {
        name: selectedCustomerName,
        phone,
        address,
      },
      products: products.filter(p => p.productName.trim() !== ""),
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount,
        reason: discountReason,
      },
      additionalCharges: additionalCharges.filter(c => c.title.trim() !== "" && c.amount > 0),
      subtotal,
      grandTotal,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    navigate("/invoice/preview", { state: invoiceData });
  };

  // Options for SearchableSelect
  const customerSelectOptions: OptionItem[] = apiCustomers.map((c) => ({
    value: c.id,
    label: c.name,
    subtext: c.phone + (c.email ? ` • ${c.email}` : ""),
  }));

  const productSelectOptions: OptionItem[] = apiProducts.map((p) => {
    const stock = p.inventory?.availableStock ?? 0;
    return {
      value: p.id,
      label: p.name,
      subtext: `Price: ₹${p.price ?? 0}${p.discountedPrice ? ` (Disc: ₹${p.discountedPrice})` : ""}`,
      badge: `${stock} in stock`,
      badgeColor: stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200",
    };
  });

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3" />
        <p>Loading invoice generator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Generate Invoice</h2>
          <p className="text-xs text-gray-500 mt-1">
            Create and preview tax invoices for your factory customers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20 lg:pb-0">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Customer *
                </label>
                <SearchableSelect
                  options={customerSelectOptions}
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  onSearchQueryChange={handleCustomerSearchQuery}
                  loading={searchingCustomer}
                  placeholder="Search & select customer (10 results)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={selectedCustomerName}
                  onChange={(e) => setSelectedCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter or edit customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter billing address"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Products</h2>
              <button
                onClick={addProduct}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>

            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Product {index + 1} *
                      </label>
                      <SearchableSelect
                        options={productSelectOptions}
                        value={product.productId || ""}
                        onChange={(val) => handleProductSelect(product.id, val)}
                        onSearchQueryChange={handleProductSearchQuery}
                        loading={searchingProduct}
                        placeholder="Search product (10 results)..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Qty *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity || ""}
                        onChange={(e) => updateProduct(product.id, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rate (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.price || ""}
                        onChange={(e) => updateProduct(product.id, "price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Total (₹)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${product.total.toFixed(2)}`}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      {products.length > 1 && (
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Charges */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Discounts & Additional Charges</h2>

            {/* Discount Section */}
            <div className="border-b border-gray-100 pb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Discount
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                  <button
                    onClick={() => setDiscountType("flat")}
                    className={`flex-1 py-2 font-medium transition-colors ${
                      discountType === "flat" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Flat (₹)
                  </button>
                  {/* <button
                    onClick={() => setDiscountType("percentage")}
                    className={`flex-1 py-2 font-medium border-l border-gray-300 transition-colors ${
                      discountType === "percentage" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    % Percent
                  </button> */}
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  placeholder={discountType === "flat" ? "Amount in ₹" : "Percentage %"}
                />

                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  placeholder="Reason (optional)"
                />
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Additional Charges
                </label>
                <button
                  onClick={addAdditionalCharge}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Charge
                </button>
              </div>

              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex gap-3 items-center mb-3">
                  <input
                    type="text"
                    value={charge.title}
                    onChange={(e) => updateAdditionalCharge(charge.id, "title", e.target.value)}
                    placeholder="Title (e.g. Transport / Loading)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={charge.amount || ""}
                    onChange={(e) => updateAdditionalCharge(charge.id, "amount", Number(e.target.value))}
                    placeholder="Amount ₹"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removeAdditionalCharge(charge.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-24 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {totalAdditionalCharges > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Additional Charges</span>
                  <span className="font-semibold text-gray-900">₹{totalAdditionalCharges.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Grand Total</span>
                <span className="text-xl font-black text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleGenerateInvoice}
              disabled={!hasValidProducts || !hasCustomerDetails}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                hasValidProducts && hasCustomerDetails
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              Generate & Preview Invoice
            </button>

            {(!hasValidProducts || !hasCustomerDetails) && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-center">
                {!hasCustomerDetails && "Select customer & phone. "}
                {!hasValidProducts && "Add at least 1 product."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
