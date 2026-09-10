import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Trash2, Edit2, X, Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  customersApi,
  productsApi,
  ordersApi,
  inventoryApi,
  type Customer,
  type Product,
} from "../utils/api";
import { SearchableSelect, type OptionItem } from "../components/ui/SearchableSelect";
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

interface LineItemState {
  productId: string;
  quantity: number;
  priceType: 'STANDARD' | 'DISCOUNTED' | 'CUSTOM';
  unitPrice: number;
  customPriceInput: string;
}

interface ChargeState {
  title: string;
  amount: number;
  reason?: string;
}

export function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer & Delivery state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState("");

  // Line items state
  const [items, setItems] = useState<LineItemState[]>([]);

  // Financials
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountReason, setDiscountReason] = useState<string>('');
  const [additionalCharges, setAdditionalCharges] = useState<ChargeState[]>([]);

  // Payment
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  const [submitting, setSubmitting] = useState(false);

  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [searchingProduct, setSearchingProduct] = useState(false);

  const customerSearchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const productSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick modals state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", addressLine: "", city: "", state: "", pincode: "" });
  
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressLine: "", city: "", state: "", pincode: "" });

  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<string>("");
  const [savingStock, setSavingStock] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        customersApi.list({ limit: 10 }),
        productsApi.list({ limit: 10 }),
      ]);
      setCustomers(cRes.data);
      setProducts(pRes.data);
      if (items.length === 0) {
        setItems([
          {
            productId: "",
            quantity: 1,
            priceType: 'STANDARD',
            unitPrice: 0,
            customPriceInput: "",
          },
        ]);
      }
    } catch {
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearchQuery = (query: string) => {
    if (customerSearchTimerRef.current) {
      clearTimeout(customerSearchTimerRef.current);
    }
    setSearchingCustomer(true);
    customerSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await customersApi.list({ search: query, limit: 10 });
        setCustomers((prev) => {
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
        setProducts((prev) => {
          const map = new Map<string, Product>();
          const selectedIds = items.map((i) => i.productId);
          prev.forEach((p) => {
            if (selectedIds.includes(p.id)) map.set(p.id, p);
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Automatically select address when customer changes
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.addresses?.length > 0) {
      setSelectedAddressId(selectedCustomer.addresses[0].id);
    } else {
      setSelectedAddressId("");
    }
  }, [selectedCustomerId]);

  // Round off utility
  const round = (val: number): number => Math.round(val * 100) / 100;

  // Add & Remove Items
  const handleAddItem = () => {
    setItems([
      {
        productId: "",
        quantity: 1,
        priceType: 'STANDARD',
        unitPrice: 0,
        customPriceInput: "",
      },
      ...items,
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const defaultPrice = prod.discountedPrice ?? prod.price ?? 0;
    const defaultType = prod.discountedPrice !== undefined && prod.discountedPrice !== null ? 'DISCOUNTED' : 'STANDARD';

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId,
      priceType: defaultType,
      unitPrice: defaultPrice,
      customPriceInput: String(defaultPrice),
    };
    setItems(updated);
  };

  const handlePriceTypeChange = (index: number, type: 'STANDARD' | 'DISCOUNTED' | 'CUSTOM') => {
    const item = items[index];
    const prod = products.find((p) => p.id === item.productId);
    let newPrice = item.unitPrice;

    if (type === 'STANDARD') {
      newPrice = prod?.price ?? 0;
    } else if (type === 'DISCOUNTED') {
      newPrice = prod?.discountedPrice ?? prod?.price ?? 0;
    } else {
      newPrice = parseFloat(item.customPriceInput) || 0;
    }

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      priceType: type,
      unitPrice: round(newPrice),
    };
    setItems(updated);
  };

  const handleCustomPriceChange = (index: number, valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      customPriceInput: valueStr,
      priceType: 'CUSTOM',
      unitPrice: round(val),
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: Math.max(1, qty) };
    setItems(updated);
  };

  // Additional Charges handlers
  const handleAddCharge = () => {
    setAdditionalCharges([...additionalCharges, { title: "", amount: 0, reason: "" }]);
  };

  const handleUpdateCharge = (index: number, field: keyof ChargeState, value: any) => {
    const updated = [...additionalCharges];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalCharges(updated);
  };

  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  // Customer Creation via Modal
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await customersApi.create({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
        addresses: newCustomer.addressLine.trim()
          ? [{ addressLine: newCustomer.addressLine, city: newCustomer.city, state: newCustomer.state, pincode: newCustomer.pincode }]
          : [],
      });
      setCustomers([created, ...customers]);
      setSelectedCustomerId(created.id);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "", addressLine: "", city: "", state: "", pincode: "" });
      toast.success("Customer created & selected!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer");
    }
  };

  // Address Creation via Modal
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newAddress.addressLine.trim()) return;
    try {
      const created = await customersApi.addAddress(selectedCustomerId, newAddress);
      setCustomers(customers.map(c => c.id === selectedCustomerId ? { ...c, addresses: [...c.addresses, created] } : c));
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewAddress({ addressLine: "", city: "", state: "", pincode: "" });
      toast.success("Address added & selected!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add address");
    }
  };

  // Inline Stock Update
  const handleSaveStockUpdate = async () => {
    if (!stockModalProduct) return;
    setSavingStock(true);
    try {
      const stockVal = parseInt(newStockInput, 10);
      await inventoryApi.updateStock(stockModalProduct.id, {
        availableStock: isNaN(stockVal) ? 0 : stockVal,
        dailyProductionRate: stockModalProduct.inventory?.dailyProductionRate ?? 0,
      });
      toast.success(`Updated stock for ${stockModalProduct.name}`);
      setStockModalProduct(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock");
    } finally {
      setSavingStock(false);
    }
  };

  // Financial Calculations
  const calculatedSubtotal = round(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  const rawDiscVal = parseFloat(discountValue) || 0;
  const discountAmount = round(
    discountType === 'percentage'
      ? (calculatedSubtotal * rawDiscVal) / 100
      : rawDiscVal
  );

  const chargesSum = round(
    additionalCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  );

  const grandTotal = round(Math.max(0, calculatedSubtotal - discountAmount + chargesSum));

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one product item.");
      return;
    }
    const unselected = items.some((i) => !i.productId);
    if (unselected) {
      toast.error("Please select a product for all items in the order.");
      return;
    }
    const invalidQty = items.some((i) => !i.quantity || i.quantity <= 0);
    if (invalidQty) {
      toast.error("Please ensure all items have a valid quantity greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      await ordersApi.create({
        customerId: selectedCustomerId,
        addressId: selectedAddressId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          priceType: i.priceType,
          totalPrice: round(i.unitPrice * i.quantity),
        })),
        deliveryDate,
        notes: notes.trim() || undefined,
        subtotal: calculatedSubtotal,
        discountType,
        discountValue: rawDiscVal,
        discountAmount,
        discountReason: discountReason.trim() || undefined,
        additionalCharges: JSON.stringify(additionalCharges),
        grandTotal,
        paymentStatus,
        paymentMethod,
      });

      toast.success("Order created successfully!");
      navigate("/orders");
    } catch (err: any) {
      toast.error(`Failed to create order: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format options for SearchableSelect
  const customerSelectOptions: OptionItem[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
    subtext: c.phone + (c.email ? ` • ${c.email}` : ""),
  }));

  const productSelectOptions: OptionItem[] = products.map((p) => {
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
    return <div className="text-center py-12 text-gray-500">Loading order creator...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/orders" className="hover:text-gray-900">Orders</Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">Create New Order</span>
        </div>
        {/* <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full border border-indigo-100">
          Self-Service Order Placement
        </span> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Order Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Customer & Delivery Details */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                1
              </span>
              <h3 className="text-base font-semibold text-gray-900">
                Customer & Delivery Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Searchable Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  CUSTOMER <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={customerSelectOptions}
                  value={selectedCustomerId}
                  onChange={(val) => setSelectedCustomerId(val)}
                  onSearchQueryChange={handleCustomerSearchQuery}
                  loading={searchingCustomer}
                  placeholder="Search & select customer..."
                />
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Quick Create Customer
                </button>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  DELIVERY ADDRESS <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  disabled={!selectedCustomer}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {!selectedCustomer ? (
                    <option value="">Select a customer first</option>
                  ) : selectedCustomer.addresses.length === 0 ? (
                    <option value="">No address on file</option>
                  ) : (
                    selectedCustomer.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.addressLine}, {a.city} ({a.pincode})
                      </option>
                    ))
                  )}
                </select>
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(true)}
                    className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Address
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  EXPECTED DELIVERY DATE <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  ORDER NOTES <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handle with care / Urgent shipment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Order Items & Pricing */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  2
                </span>
                <h3 className="text-base font-semibold text-gray-900">
                  Order Items & Pricing
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-xs rounded-xl border border-indigo-100 transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs font-medium">
                No products added yet. Click "+ Add Item" to begin building order.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const product = products.find((p) => p.id === item.productId);
                  const availableStock = product?.inventory?.availableStock ?? 0;

                  return (
                    <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50/50 hover:bg-white transition-all shadow-2xs">
                      {/* Product Header Row */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                            PRODUCT
                          </label>
                          <SearchableSelect
                            options={productSelectOptions}
                            value={item.productId}
                            onChange={(val) => handleProductChange(idx, val)}
                            onSearchQueryChange={handleProductSearchQuery}
                            loading={searchingProduct}
                            placeholder="Search & select product..."
                          />
                        </div>

                        {/* Stock pill & Actions */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-6">
                          {product && (
                            <>
                              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{availableStock} in stock</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setStockModalProduct(product || null);
                                  setNewStockInput(String(availableStock));
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Update stock level"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rates & Quantity Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200/80">
                        {/* Left: Unit Price Rate Pills */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                            UNIT PRICE
                          </label>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {product?.discountedPrice !== undefined && product?.discountedPrice !== null && (
                              <button
                                type="button"
                                onClick={() => handlePriceTypeChange(idx, 'DISCOUNTED')}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  item.priceType === 'DISCOUNTED'
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-2xs"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                Discounted ₹{Number(product.discountedPrice).toFixed(2)}
                              </button>
                            )}

                            {product?.price !== undefined && product?.price !== null && (
                              <button
                                type="button"
                                onClick={() => handlePriceTypeChange(idx, 'STANDARD')}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  item.priceType === 'STANDARD'
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-2xs"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                Standard ₹{Number(product.price).toFixed(2)}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handlePriceTypeChange(idx, 'CUSTOM')}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                item.priceType === 'CUSTOM'
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold"
                                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                              }`}
                            >
                              Custom Price
                            </button>
                          </div>

                          {/* Custom price input field */}
                          {item.priceType === 'CUSTOM' && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-semibold">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter price"
                                value={item.customPriceInput}
                                onChange={(e) => handleCustomPriceChange(idx, e.target.value)}
                                className="w-36 px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* Right: Stepper Quantity & Line Total */}
                        <div className="flex flex-col items-start md:items-end justify-between">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                            QUANTITY
                          </label>
                          <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden shadow-xs w-36">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                              className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-r border-gray-200 transition-colors font-bold text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                              className="w-full text-center py-1.5 text-sm font-semibold text-gray-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                              className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l border-gray-200 transition-colors font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Line total: <span className="font-semibold text-gray-900">₹{round(item.unitPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Discounts & Additional Charges */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                3
              </span>
              <h3 className="text-base font-semibold text-gray-900">
                Discounts & Additional Charges
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {/* Order Discount */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ORDER DISCOUNT
                </label>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      discountType === 'flat'
                        ? "bg-indigo-600 text-white shadow-xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Flat (₹)
                  </button>
                  {/* <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      discountType === 'percentage'
                        ? "bg-indigo-600 text-white shadow-xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Percentage (%)
                  </button> */}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Reason (e.g. Festival)"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ADDITIONAL CHARGES
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCharge}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    + Add Charge
                  </button>
                </div>

                {additionalCharges.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No additional charges added.</p>
                ) : (
                  <div className="space-y-2.5">
                    {additionalCharges.map((chg, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Label (e.g. Shipping)"
                          value={chg.title}
                          onChange={(e) => handleUpdateCharge(idx, 'title', e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={chg.amount || ''}
                            onChange={(e) => handleUpdateCharge(idx, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCharge(idx)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-600 font-medium">
                  Total charges: <span className="font-semibold text-gray-900">+{chargesSum.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Order Summary Cards */}
        <div className="space-y-5">
          {/* Payment Information Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Payment Information</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                PAYMENT STATUS
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentStatus === 'PENDING'
                      ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('COMPLETED')}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    paymentStatus === 'COMPLETED'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Mark as Paid
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                PAYMENT METHOD
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="CASH">Cash Payment</option>
                <option value="ONLINE">Online Transfer / NetBanking</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                <option value="CHEQUE">Cheque Payment</option>
              </select>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4 sticky top-6">
            <h3 className="text-base font-semibold text-gray-900">Order Summary</h3>

            <div className="space-y-2.5 text-xs pt-1 border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Items subtotal</span>
                <span className="font-semibold text-gray-900">₹{calculatedSubtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {chargesSum > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Additional charges</span>
                  <span className="font-semibold text-gray-900">+₹{chargesSum.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Grand Total</span>
                <span className="text-indigo-600 text-xl font-extrabold">₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="pt-1 text-xs">
                {paymentStatus === 'COMPLETED' ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <Check className="w-3.5 h-3.5" /> Paid via {paymentMethod.replace("_", " ")}
                  </div>
                ) : (
                  <div className="text-amber-700 font-medium">
                    • Payment Pending
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {submitting ? "Processing Order..." : "Create & Place Order"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Customer Modal Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Quick Create Customer</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Enter customer details below to save and automatically select for this order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="Customer Name *"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="Email Address"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address Line</label>
              <input
                type="text"
                placeholder="Address Line"
                value={newCustomer.addressLine}
                onChange={(e) => setNewCustomer({ ...newCustomer, addressLine: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newCustomer.pincode}
                  onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Save & Select Customer
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Address Modal Dialog */}
      <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">Add New Delivery Address</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add a new location for <strong>{selectedCustomer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAddress} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address Line *</label>
              <input
                type="text"
                placeholder="Address Line *"
                required
                value={newAddress.addressLine}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Save Address
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Update Modal */}
      <AlertDialog open={!!stockModalProduct} onOpenChange={(open) => !open && setStockModalProduct(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Inventory Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Adjust current available stock for <strong>{stockModalProduct?.name}</strong> directly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Available Stock (Units)</label>
            <input
              type="number"
              min="0"
              value={newStockInput}
              onChange={(e) => setNewStockInput(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveStockUpdate}
              disabled={savingStock}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {savingStock ? "Updating..." : "Save Stock Level"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
