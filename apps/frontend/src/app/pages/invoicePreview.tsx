import { useLocation, useNavigate, Link } from "react-router";
import { ArrowLeft, Download, Edit, MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { InvoiceTemplateClassic } from "./InvoiceTemplateClassic";
import { InvoiceTemplateClassic as InvoiceTemplateOriginal } from "./invoiceTemplateOriginal";

interface InvoiceData {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  discount: {
    type: "flat" | "percentage";
    value: number;
    amount: number;
    reason: string;
  };
  additionalCharges: Array<{
    title: string;
    amount: number;
    reason: string;
  }>;
  subtotal: number;
  grandTotal: number;
  date: string;
}

export function InvoicePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const invoiceData = location.state as InvoiceData;

  if (!invoiceData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No invoice data found</p>
        <Link
          to="/invoice"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Invoice Generator
        </Link>
      </div>
    );
  }

  const [isDownloading, setIsDownloading] = useState(false);
  const [format, setFormat] = useState<"modern" | "classic" | "original">("modern");

  const handleDownloadPDF = () => {
    if (!invoiceRef.current || isDownloading) return;
    setIsDownloading(true);

    // Clone the invoice element into a hidden, print-only container
    const printContent = invoiceRef.current.cloneNode(true) as HTMLElement;

    const printStyle = document.createElement("style");
    printStyle.textContent = `
      @media print {
        body > *:not(#ff-print-root) { display: none !important; }
        #ff-print-root {
          display: block !important;
          position: fixed;
          inset: 0;
          background: white;
          z-index: 99999;
          padding: 24px;
          font-family: sans-serif;
        }
        /* Force background colors to print (green header/footer) */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page { margin: 10mm; size: A4; }
      }
    `;

    const printRoot = document.createElement("div");
    printRoot.id = "ff-print-root";
    printRoot.style.display = "none";
    printRoot.appendChild(printContent);

    document.head.appendChild(printStyle);
    document.body.appendChild(printRoot);

    // Small delay to let the DOM settle, then print
    setTimeout(() => {
      window.print();

      // Cleanup after print dialog closes
      setTimeout(() => {
        document.head.removeChild(printStyle);
        document.body.removeChild(printRoot);
        setIsDownloading(false);
      }, 500);
    }, 150);
  };

  const handleShareWhatsApp = () => {
    const itemLines = invoiceData.products
      .map((p, i) => `  ${i + 1}. ${p.productName} — Qty: ${p.quantity.toLocaleString()} × ₹${p.price.toFixed(2)} = ₹${p.total.toFixed(2)}`)
      .join("\n");

    const discountLine = invoiceData.discount.amount > 0
      ? `\nDiscount: -₹${invoiceData.discount.amount.toFixed(2)}`
      : "";

    const extraCharges = invoiceData.additionalCharges
      .filter((c) => c.amount > 0)
      .map((c) => `\n${c.title}: ₹${c.amount.toFixed(2)}`)
      .join("");

    const message =
      `🧾 *Invoice from Siri Enterprises*\n` +
      `Invoice No: ${invoiceNumber}\n` +
      `Date: ${invoiceData.date}\n` +
      `Customer: ${invoiceData.customer.name}\n\n` +
      `*Items:*\n${itemLines}\n` +
      `${discountLine}${extraCharges}\n\n` +
      `*Grand Total: ₹${invoiceData.grandTotal.toFixed(2)}*\n\n` +
      `Thank you for your business! 🙏`;

    const encoded = encodeURIComponent(message);
    // On mobile this opens the WhatsApp app; on desktop it opens web.whatsapp.com
    const phone = invoiceData.customer.phone?.replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const invoiceNumber = `INV-${new Date().getTime().toString().slice(-6)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/invoice"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Generator
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Format Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setFormat("modern")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                format === "modern" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Format 1
            </button>
            <button
              onClick={() => setFormat("classic")}
              className={`px-3 py-1.5 font-medium border-l border-gray-300 transition-colors ${
                format === "classic" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Format 2
            </button>
            <button
              onClick={() => setFormat("original")}
              className={`px-3 py-1.5 font-medium border-l border-gray-300 transition-colors ${
                format === "original" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Format 3
            </button>
          </div>

          <button
            onClick={() => navigate("/invoice", { state: invoiceData })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Invoice
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Share on WhatsApp
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Preparing..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-gray-50 p-4 sm:p-8 rounded-lg">
        {format === "classic" ? (
          <InvoiceTemplateClassic ref={invoiceRef} data={invoiceData} invoiceNumber={invoiceNumber} />
        ) : format === "original" ? (
          <InvoiceTemplateOriginal ref={invoiceRef} data={invoiceData} invoiceNumber={invoiceNumber} logoUrl="/logo.png" />
        ) : (
        <div ref={invoiceRef} className="bg-white rounded-lg shadow-lg p-8 sm:p-12 max-w-4xl mx-auto">
          {/* Header */}
          <div className="border-b-2 border-green-700 pb-6 mb-6 flex items-center justify-between gap-4">
          
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">Siri Enterprises</h1>
              <p className="text-lg text-gray-500 ">Invoice</p>
            </div>
              <img
              src="/logo.png"
              alt="Siri Enterprises Logo"
              className="h-30 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h2>
              <p className="font-semibold text-gray-900 text-lg mb-1">{invoiceData.customer.name}</p>
              <p className="text-gray-600 text-sm">{invoiceData.customer.phone}</p>
              <p className="text-gray-600 text-sm mt-2 whitespace-pre-line">{invoiceData.customer.address}</p>
            </div>
            <div className="sm:text-right">
              <div className="mb-3">
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-semibold text-gray-900">{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Date</p>
                <p className="font-semibold text-gray-900">{invoiceData.date}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Product</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Qty</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Price</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.products.map((product, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 px-2 text-gray-900">{product.productName}</td>
                    <td className="py-4 px-2 text-right text-gray-700">{product.quantity.toLocaleString()}</td>
                    <td className="py-4 px-2 text-right text-gray-700">₹{product.price.toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-medium text-gray-900">₹{product.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80 space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{invoiceData.subtotal.toFixed(2)}</span>
              </div>

              {invoiceData.discount.amount > 0 && (
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">Discount</span>
                    {invoiceData.discount.type === "percentage" && (
                      <span className="text-sm text-gray-500 ml-1">({invoiceData.discount.value}%)</span>
                    )}
                    {invoiceData.discount.reason && (
                      <p className="text-xs text-gray-500 italic">{invoiceData.discount.reason}</p>
                    )}
                  </div>
                  <span className="font-medium text-green-600">-₹{invoiceData.discount.amount.toFixed(2)}</span>
                </div>
              )}

              {invoiceData.additionalCharges.length > 0 && 
                invoiceData.additionalCharges.some(c => c.amount > 0) && (
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  {invoiceData.additionalCharges
                    .filter(c => c.amount > 0)
                    .map((charge, index) => (
                      <div key={index} className="flex justify-between py-1">
                        <div>
                          <span className="text-gray-600">{charge.title}</span>
                          {charge.reason && (
                            <p className="text-xs text-gray-500 italic">{charge.reason}</p>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">₹{charge.amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                <span className="text-xl font-bold text-blue-600">₹{invoiceData.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">Thank you for your business!</p>
            <p className="text-xs text-gray-400 mt-2">
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 z-10">
        <button
          onClick={() => navigate("/invoice", { state: invoiceData })}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Preparing..." : "Download"}
        </button>
      </div>
    </div>
  );
}