import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, MapPin, Calendar, FileText, Edit2, Check, X, Download, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { ordersApi, invoiceSettingsApi, type OrderDetail, type InvoiceSettings } from "../utils/api";
import { InvoiceTemplateClassic } from "./InvoiceTemplateClassic";

export type OrderStatus = "PENDING" | "DELIVERED" | "CANCELLED";
const STATUSES: readonly OrderStatus[] = ["PENDING", "DELIVERED", "CANCELLED"];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status editing state
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [savingStatus, setSavingStatus] = useState(false);

  // Payment status state
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Invoice Print Ref
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchOrderAndSettings = async () => {
    if (!id) return;
    try {
      const [orderData, settingsData] = await Promise.all([
        ordersApi.get(id),
        invoiceSettingsApi.get().catch(() => null),
      ]);
      setOrder(orderData);
      setSelectedStatus(orderData.status);
      setInvoiceSettings(settingsData);
    } catch {
      setError("Order not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndSettings();
  }, [id]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-300";
      case "DELIVERED": return "bg-green-100 text-green-800 border-green-300";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const saveStatusChange = async () => {
    if (!order || !id) return;
    setSavingStatus(true);
    try {
      const updated = await ordersApi.updateStatus(id, selectedStatus);
      setOrder(updated as OrderDetail);
      setIsEditingStatus(false);

      if (selectedStatus === 'CANCELLED') {
        toast.success("Order status marked as Cancelled. Stock restored to inventory.");
      } else if (selectedStatus === 'DELIVERED') {
        toast.success("Order marked as Delivered.");
      } else {
        toast.success("Order status updated.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!order || !id) return;
    setUpdatingPayment(true);
    try {
      const updated = await ordersApi.updatePaymentStatus(id, 'COMPLETED');
      setOrder(updated as OrderDetail);
      toast.success("Payment status updated to COMPLETED (Paid).");
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment status.");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoicePrintRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    toast.info("Generating invoice PDF...");

    try {
      // Import html2canvas and jsPDF dynamically
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = invoicePrintRef.current;

      // Temporarily make it visible in a hidden wrapper offscreen for clean rendering
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "794px"; // Standard A4 pixel width at 96 DPI
      container.style.background = "#ffffff";
      document.body.appendChild(container);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.display = "block";
      clone.style.width = "794px";
      clone.style.minHeight = "auto";
      container.appendChild(clone);

      // Wait briefly for images/fonts in clone to settle
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(clone, {
        scale: 2, // High resolution (2x)
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const imgWidthMm = 210; // A4 standard width in mm
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      // Create PDF with custom page dimensions matching the content perfectly
      const pdf = new jsPDF({
        orientation: imgHeightMm > imgWidthMm ? "portrait" : "landscape",
        unit: "mm",
        format: [imgWidthMm, imgHeightMm],
      });

      pdf.addImage(imgData, "PNG", 0, 0, imgWidthMm, imgHeightMm);
      pdf.save(`Invoice-${order.orderId}.pdf`);

      toast.success("Invoice PDF downloaded!");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading order details...</div>;
  if (error || !order) return <div className="text-center py-12 text-red-500">{error || "Order not found"}</div>;

  // Prepare invoice data for InvoiceTemplateClassic
  const invoiceData = {
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      address: order.address
        ? `${order.address.addressLine}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`
        : "",
    },
    products: order.items.map((i) => ({
      productName: i.productName || "Product",
      quantity: i.quantity,
      price: i.unitPrice ?? 0,
      total: i.totalPrice ?? ((i.unitPrice ?? 0) * i.quantity),
    })),
    discount: {
      type: (order.discountType as any) || "flat",
      value: order.discountValue ?? 0,
      amount: order.discountAmount ?? 0,
      reason: order.discountReason || "",
    },
    additionalCharges: (() => {
      if (!order.additionalCharges) return [];
      try {
        const parsed = JSON.parse(order.additionalCharges);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    subtotal: order.subtotal ?? 0,
    grandTotal: order.grandTotal ?? 0,
    date: new Date(order.orderDate).toLocaleDateString(),
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders List
        </Link>

        {/* Download Invoice Button */}
        <button
          onClick={handleDownloadInvoice}
          disabled={downloadingPdf}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          {downloadingPdf ? "Generating PDF..." : "Download Invoice PDF"}
        </button>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Header row: Order ID, status, and payment status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{order.orderId}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                order.paymentStatus === 'COMPLETED'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                Payment: {order.paymentStatus || 'PENDING'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Placed on {new Date(order.orderDate).toLocaleString()}</p>
          </div>

          {/* Quick Controls: Status & Payment */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status change editor - Only available for PENDING orders */}
            {order.status === 'PENDING' && (
              isEditingStatus ? (
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-2.5 py-1 border border-gray-300 rounded text-xs font-medium bg-white focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={saveStatusChange}
                    disabled={savingStatus}
                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                    title="Save Status"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingStatus(false)}
                    className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs font-medium"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingStatus(true)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Update Status
                </button>
              )
            )}

            {/* Mark as Paid Action */}
            {order.paymentStatus !== 'COMPLETED' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={updatingPayment}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {updatingPayment ? "Updating..." : "Mark as Paid"}
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Info</h3>
            <p className="font-semibold text-gray-900 text-base">{order.customer.name}</p>
            <p className="text-sm text-gray-600">Phone: {order.customer.phone}</p>
            {order.customer.email && <p className="text-xs text-gray-500">Email: {order.customer.email}</p>}
          </div>

          {/* Delivery Info */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Details</h3>
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Date: <strong>{new Date(order.deliveryDate).toLocaleDateString()}</strong></span>
            </div>
            {order.address && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">{order.address.addressLine}</p>
                  <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Financial Info */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Breakdown</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium text-gray-900 uppercase">{order.paymentMethod || 'CASH'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Grand Total:</span>
              <span className="font-bold text-blue-600 text-base">₹{Number(order.grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <FileText className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Notes:</span> {order.notes}
            </div>
          </div>
        )}
      </div>

      {/* Line Items & Financial Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-900">
          Products Ordered
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Product Name</th>
                <th className="px-6 py-3 text-center">Rate Type</th>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.priceType === 'DISCOUNTED'
                        ? 'bg-green-100 text-green-800'
                        : item.priceType === 'CUSTOM'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.priceType === 'DISCOUNTED' && <Tag className="w-3 h-3" />}
                      {item.priceType || 'STANDARD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700 font-medium">{item.quantity.toLocaleString()} units</td>
                  <td className="px-6 py-4 text-right text-gray-900">₹{Number(item.unitPrice || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ₹{Number(item.totalPrice || ((item.unitPrice || 0) * item.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations Footer */}
        <div className="p-6 bg-gray-50/80 border-t border-gray-200 flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal:</span>
              <span className="font-medium text-gray-900">₹{Number(order.subtotal || 0).toFixed(2)}</span>
            </div>

            {Number(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat'}):</span>
                <span className="font-medium">-₹{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}

            {(() => {
              if (!order.additionalCharges) return null;
              try {
                const charges = JSON.parse(order.additionalCharges);
                if (Array.isArray(charges) && charges.length > 0) {
                  return charges.map((c, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span>{c.title || 'Additional Charge'}:</span>
                      <span className="font-medium">+₹{Number(c.amount || 0).toFixed(2)}</span>
                    </div>
                  ));
                }
              } catch {}
              return null;
            })()}

            <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-300">
              <span>Grand Total:</span>
              <span className="text-blue-600 text-lg">₹{Number(order.grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable template for PDF download */}
      <div style={{ display: 'none' }}>
        <InvoiceTemplateClassic
          ref={invoicePrintRef}
          data={invoiceData}
          invoiceNumber={order.orderId}
          settings={invoiceSettings}
        />
      </div>
    </div>
  );
}

