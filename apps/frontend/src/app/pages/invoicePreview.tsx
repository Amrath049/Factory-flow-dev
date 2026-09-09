import { useLocation, useNavigate, Link } from "react-router";
import { ArrowLeft, Download, Edit, MessageCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { InvoiceTemplateClassic } from "./InvoiceTemplateClassic";
import { invoiceSettingsApi, InvoiceSettings } from "../utils/api";

interface InvoiceData {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  products: Array<{
    productName: string;
    quantity: number | string;
    price: number | string;
    total: number | string;
  }>;
  discount: {
    type: "flat" | "percentage";
    value: number | string;
    amount: number | string;
    reason: string;
  };
  additionalCharges: Array<{
    title: string;
    amount: number | string;
    reason: string;
  }>;
  subtotal: number | string;
  grandTotal: number | string;
  date: string;
}

const toNum = (val: any): number => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

const fmtPrice = (val: any): string => toNum(val).toFixed(2);
const fmtQty = (val: any): string => toNum(val).toLocaleString();

export function InvoicePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const invoiceData = location.state as InvoiceData;
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);

  useEffect(() => {
    invoiceSettingsApi.get().then(setSettings).catch(() => {});
  }, []);

  if (!invoiceData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No invoice data found</p>
        <Link
          to="/invoice"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Invoice Generator
        </Link>
      </div>
    );
  }

  const [isDownloading, setIsDownloading] = useState(false);
  const companyName = settings?.companyName || "Our Factory";

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isDownloading) return;
    setIsDownloading(true);
    toast.info("Generating invoice PDF...");

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = invoiceRef.current;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "794px";
      container.style.background = "#ffffff";
      document.body.appendChild(container);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.display = "block";
      clone.style.width = "794px";
      container.appendChild(clone);

      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const imgWidthMm = 210;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeightMm > imgWidthMm ? "portrait" : "landscape",
        unit: "mm",
        format: [imgWidthMm, imgHeightMm],
      });

      pdf.addImage(imgData, "PNG", 0, 0, imgWidthMm, imgHeightMm);
      pdf.save(`Invoice-${invoiceNumber}.pdf`);

      toast.success("Invoice PDF downloaded!");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const itemLines = invoiceData.products
      .map((p, i) => `  ${i + 1}. ${p.productName} — Qty: ${fmtQty(p.quantity)} × ₹${fmtPrice(p.price)} = ₹${fmtPrice(p.total)}`)
      .join("\n");

    const discountLine = toNum(invoiceData.discount.amount) > 0
      ? `\nDiscount: -₹${fmtPrice(invoiceData.discount.amount)}`
      : "";

    const extraCharges = invoiceData.additionalCharges
      .filter((c) => toNum(c.amount) > 0)
      .map((c) => `\n${c.title}: ₹${fmtPrice(c.amount)}`)
      .join("");

    const message =
      `🧾 *Invoice from ${companyName}*\n` +
      `Invoice No: ${invoiceNumber}\n` +
      `Date: ${invoiceData.date}\n` +
      `Customer: ${invoiceData.customer.name}\n\n` +
      `*Items:*\n${itemLines}\n` +
      `${discountLine}${extraCharges}\n\n` +
      `*Grand Total: ₹${fmtPrice(invoiceData.grandTotal)}*\n\n` +
      `Thank you for your business! 🙏`;

    const encoded = encodeURIComponent(message);
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
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Generator
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/invoice", { state: invoiceData })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Edit Invoice
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Share on WhatsApp
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Preparing..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Invoice Layout */}
      <div className="bg-gray-100 p-4 sm:p-8 rounded-xl shadow-inner border border-gray-200">
        <InvoiceTemplateClassic
          ref={invoiceRef}
          data={invoiceData}
          invoiceNumber={invoiceNumber}
          settings={settings}
        />
      </div>

      {/* Mobile Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 z-10 shadow-lg">
        <button
          onClick={() => navigate("/invoice", { state: invoiceData })}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Preparing..." : "Download"}
        </button>
      </div>
    </div>
  );
}