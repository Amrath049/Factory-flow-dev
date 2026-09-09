import { useState, useEffect } from "react";
import {
  Building2,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  Globe,
  Phone,
  Mail,
  Eye,
  X,
  Palette,
} from "lucide-react";
import { invoiceSettingsApi, InvoiceSettings } from "../utils/api";
import { InvoiceTemplateClassic } from "./InvoiceTemplateClassic";

export function InvoiceSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<Partial<InvoiceSettings>>({
    companyName: "",
    tagline: "",
    website: "",
    logoUrl: "",
    headerColor: "#1e293b",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    gstin: "",
    pan: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    termsAndConditions: "",
    declaration: "",
    signatureTitle: "Authorized Signatory",
  });

  useEffect(() => {
    invoiceSettingsApi
      .get()
      .then((data) => {
        setForm(data);
      })
      .catch((err) => {
        setMessage({ type: "error", text: err.message || "Failed to load invoice settings" });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof InvoiceSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB industry standard logo size

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: `Logo file size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB industry standard limit. Please upload a smaller image.`,
      });
      e.target.value = "";
      return;
    }

    setUploadingLogo(true);
    setMessage(null);
    try {
      const { logoUrl } = await invoiceSettingsApi.uploadLogo(file);
      setForm((prev) => ({ ...prev, logoUrl }));
      setMessage({ type: "success", text: "Logo uploaded successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload logo" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { id, businessId, createdAt, updatedAt, ...cleanPayload } = form as any;
      const updated = await invoiceSettingsApi.update(cleanPayload);
      setForm(updated);
      setMessage({ type: "success", text: "Invoice settings saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save invoice settings" });
    } finally {
      setSaving(false);
    }
  };

  // Sample dummy invoice data for modal preview
  const sampleInvoiceData = {
    customer: {
      name: "Sample Customer Pvt Ltd",
      phone: "+91 98765 43210",
      address: "123 Commercial Street, MG Road, Bangalore - 560001",
    },
    products: [
      {
        productName: "Product 1",
        quantity: 1000,
        price: 7.5,
        total: 7500,
      },
      {
        productName: "Product 2",
        quantity: 500,
        price: 3.5,
        total: 1750,
      },
    ],
    discount: {
      type: "flat" as const,
      value: 250,
      amount: 250,
      reason: "Sample Special Discount",
    },
    additionalCharges: [
      {
        title: "Transport Charge",
        amount: 500,
        reason: "Freight & Delivery",
      },
    ],
    subtotal: 9250,
    grandTotal: 9500,
    date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3" />
        <p>Loading your business invoice settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header Bar with Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Invoice Settings</h2>
          <p className="text-xs text-gray-500 mt-1">
            Customize your company branding, logo, theme color, GSTIN, bank details, and footer terms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-colors border border-gray-300 shadow-xs"
          >
            <Eye className="w-4 h-4 text-gray-600" />
            Preview Invoice Template
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Business Branding, Logo & Color Theme */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Business Branding & Logo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company / Business Name *
              </label>
              <input
                type="text"
                value={form.companyName || ""}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="e.g. Siri Enterprises"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={form.tagline || ""}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="e.g. Areca Palm Leaf Products Manufacturer"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={form.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="www.yourcompany.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Logo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Logo
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm border border-blue-200 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? "Uploading Logo..." : "Choose File"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                {form.logoUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={form.logoUrl}
                      alt="Uploaded Logo"
                      className="h-9 w-9 object-contain rounded border border-gray-200 bg-white p-0.5"
                    />
                    <span className="text-xs text-emerald-600 font-medium">✓ Uploaded</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Upload PNG, JPG, or WebP logo (Max size: 2 MB).
              </p>
            </div>

            {/* Theme Color Selector */}
            <div className="md:col-span-2 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-blue-600" />
                <label className="block text-sm font-bold text-gray-800">
                  Invoice Header & Footer Theme Color
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {[
                  { name: "Slate Navy (Default)", color: "#1e293b" },
                  { name: "Royal Blue", color: "#1e40af" },
                  { name: "Emerald Green", color: "#065f46" },
                  { name: "Deep Indigo", color: "#312e81" },
                  { name: "Burgundy", color: "#881337" },
                  { name: "Charcoal", color: "#18181b" },
                ].map((theme) => (
                  <button
                    key={theme.color}
                    type="button"
                    onClick={() => handleChange("headerColor", theme.color)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      (form.headerColor || "#1e293b") === theme.color
                        ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 text-blue-900 font-bold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs"
                      style={{ backgroundColor: theme.color }}
                    />
                    {theme.name}
                  </button>
                ))}

                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1 text-xs bg-white">
                  <span className="text-gray-500 font-medium">Custom Color:</span>
                  <input
                    type="color"
                    value={form.headerColor || "#1e293b"}
                    onChange={(e) => handleChange("headerColor", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Select a theme color for your invoice headers and footers that matches your brand logo.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Address & Contact Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Address & Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address Line 1
              </label>
              <input
                type="text"
                value={form.addressLine1 || ""}
                onChange={(e) => handleChange("addressLine1", e.target.value)}
                placeholder="Industrial Area, Plot No 12"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address Line 2
              </label>
              <input
                type="text"
                value={form.addressLine2 || ""}
                onChange={(e) => handleChange("addressLine2", e.target.value)}
                placeholder="Cherkady Road"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={form.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Udupi"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State & Pincode</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.state || ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Karnataka"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                <input
                  type="text"
                  value={form.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="576215"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number(s)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={form.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="8088467281, 9187567281"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="billing@yourcompany.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Tax Registration & Bank Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Tax & Bank Account Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                GSTIN Number
              </label>
              <input
                type="text"
                value={form.gstin || ""}
                onChange={(e) => handleChange("gstin", e.target.value)}
                placeholder="29ABCDE1234F1Z5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PAN Number</label>
              <input
                type="text"
                value={form.pan || ""}
                onChange={(e) => handleChange("pan", e.target.value)}
                placeholder="ABCDE1234F"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
              <input
                type="text"
                value={form.bankName || ""}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="e.g. Canara Bank"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Holder Name</label>
              <input
                type="text"
                value={form.accountName || ""}
                onChange={(e) => handleChange("accountName", e.target.value)}
                placeholder="e.g. Siri Enterprises"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
              <input
                type="text"
                value={form.accountNumber || ""}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                placeholder="123456789012"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code & Branch</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.ifscCode || ""}
                  onChange={(e) => handleChange("ifscCode", e.target.value)}
                  placeholder="CNRB0001234"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm uppercase"
                />
                <input
                  type="text"
                  value={form.branch || ""}
                  onChange={(e) => handleChange("branch", e.target.value)}
                  placeholder="Brahmavar"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Terms & Conditions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Invoice Terms & Declaration</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={form.termsAndConditions || ""}
                onChange={(e) => handleChange("termsAndConditions", e.target.value)}
                placeholder="1. Goods once sold will not be taken back.&#10;2. Subject to local jurisdiction."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Authorized Signature Label
              </label>
              <input
                type="text"
                value={form.signatureTitle || ""}
                onChange={(e) => handleChange("signatureTitle", e.target.value)}
                placeholder="Authorized Signatory"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit & Preview Button bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-colors border border-gray-300"
          >
            <Eye className="w-4 h-4 text-gray-600" />
            Preview Full Invoice Template
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {saving ? "Saving Settings..." : "Save Invoice Settings"}
          </button>
        </div>
      </form>

      {/* Full Invoice Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Full Invoice Template Preview</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Rendered Invoice */}
            <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white rounded-xl shadow-md p-4">
                <InvoiceTemplateClassic
                  data={sampleInvoiceData}
                  invoiceNumber="INV-PREVIEW-001"
                  settings={form}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>Renders all live business branding, logo, GSTIN, bank details & terms.</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium text-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
