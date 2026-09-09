import React from "react";
import { InvoiceSettings } from "../utils/api";

interface InvoiceData {
  customer: { name: string; phone: string; address: string };
  products: Array<{ productName: string; quantity: number | string; price: number | string; total: number | string }>;
  discount: { type: "flat" | "percentage"; value: number | string; amount: number | string; reason: string };
  additionalCharges: Array<{ title: string; amount: number | string; reason: string }>;
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

// ─── Amount in words (Indian system) ─────────────────────────────────────────
function numberToWords(num: number | string): string {
  const nVal = toNum(num);
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const integer = Math.floor(nVal);
  const decimal = Math.round((nVal - integer) * 100);
  const words = convert(integer) || "Zero";
  return "Rupees " + words + (decimal ? ` and ${decimal}/100` : "") + " Only";
}

interface Props {
  data: InvoiceData;
  invoiceNumber: string;
  settings?: Partial<InvoiceSettings> | null;
}

export const InvoiceTemplateClassic = React.forwardRef<HTMLDivElement, Props>(
  ({ data, invoiceNumber, settings }, ref) => {
    const companyName = settings?.companyName;
    const tagline = settings?.tagline;
    const website = settings?.website || "";
    const logoUrl = settings?.logoUrl;
    const headerColor = settings?.headerColor || "#1e293b"; // Slate Navy (#1e293b)

    const address = [
      settings?.addressLine1,
      settings?.addressLine2,
      [settings?.city, settings?.state, settings?.pincode].filter(Boolean).join(" - "),
    ]
      .filter(Boolean)
      .join(", ");

    const phone = settings?.phone || "";
    const email = settings?.email || "";
    const gstin = settings?.gstin || "";
    const bankName = settings?.bankName || "";
    const accountName = settings?.accountName || companyName;
    const accountNumber = settings?.accountNumber || "";
    const ifscCode = settings?.ifscCode || "";
    const branch = settings?.branch || "";
    const terms = settings?.termsAndConditions ;
    const signatureTitle = settings?.signatureTitle;

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          width: "100%",
          maxWidth: "800px",
          display: "flex",
          flexDirection: "column",
          margin: "0 auto",
          border: "1px solid #cbd5e1",
          boxSizing: "border-box",
          color: "#0f172a",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* ── Dynamic Header Band ─────────────────────────────────── */}
        <div
          style={{
            background: headerColor,
            color: "#ffffff",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          <div>
            <div style={{ color: "#ffffff", fontSize: "22px", fontWeight: "bold", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {companyName}
            </div>
            {tagline && (
              <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "12px", marginTop: "4px" }}>
                {tagline}
              </div>
            )}
            {website && (
              <div style={{ marginTop: "8px", display: "inline-block", background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)", borderRadius: "12px", padding: "2px 12px" }}>
                <span style={{ color: "#ffffff", fontSize: "10px", fontWeight: "500" }}>{website}</span>
              </div>
            )}
          </div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={companyName}
              style={{ height: "64px", maxWidth: "160px", objectFit: "contain", borderRadius: "6px", background: "#ffffff", padding: "4px" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        {/* ── Invoice Title Bar ─────────────────────────────────── */}
        <div
          style={{
            background: "#f8fafc",
            textAlign: "center",
            padding: "8px",
            borderBottom: "1px solid #cbd5e1",
            borderTop: "1px solid #cbd5e1",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "13px", letterSpacing: "2px", color: "#1e293b" }}>TAX INVOICE</span>
        </div>

        {/* ── Billing + Invoice Details ─────────────────────────── */}
        <div style={{ display: "flex", padding: "16px 24px", gap: "24px", borderBottom: "1px solid #e2e8f0" }}>
          {/* Billing Address */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#64748b", fontSize: "11px", letterSpacing: "0.5px", marginBottom: "4px" }}>
              Billing Address:
            </div>
            <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{data.customer.name}</div>
            {data.customer.phone && (
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                Ph: {data.customer.phone}
              </div>
            )}
            {data.customer.address && (
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                {data.customer.address}
              </div>
            )}
          </div>

          {/* Invoice Details Box */}
          <div style={{ minWidth: "240px", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", fontSize: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#475569", background: "#f8fafc", width: "45%", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>INVOICE NO</td>
                  <td style={{ padding: "6px 10px", fontWeight: "600", color: "#0f172a" }}>: {invoiceNumber}</td>
                </tr>
                <tr style={{ borderBottom: gstin ? "1px solid #f1f5f9" : "none" }}>
                  <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#475569", background: "#f8fafc", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>INVOICE DATE</td>
                  <td style={{ padding: "6px 10px", color: "#0f172a" }}>: {data.date}</td>
                </tr>
                {gstin && (
                  <tr>
                    <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#475569", background: "#f8fafc", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>GSTIN</td>
                    <td style={{ padding: "6px 10px", color: "#0f172a" }}>: {gstin}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Products Table ────────────────────────────────────── */}
        <div style={{ padding: "16px 24px 0 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", boxSizing: "border-box" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderTop: "1px solid #cbd5e1", borderBottom: "2px solid #cbd5e1", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px 6px", textAlign: "center", width: "45px", fontWeight: "bold", color: "#1e293b" }}>SL NO</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px 10px", textAlign: "left", fontWeight: "bold", color: "#1e293b" }}>PARTICULARS</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px 6px", textAlign: "center", width: "70px", fontWeight: "bold", color: "#1e293b" }}>QTY</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px 10px", textAlign: "right", width: "90px", fontWeight: "bold", color: "#1e293b" }}>RATE</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px 10px", textAlign: "right", width: "100px", fontWeight: "bold", color: "#1e293b" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #cbd5e1", padding: "8px 6px", textAlign: "center", color: "#475569" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "8px 10px", color: "#0f172a", fontWeight: "500" }}>{p.productName}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "8px 6px", textAlign: "center", color: "#0f172a" }}>{fmtQty(p.quantity)}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "8px 10px", textAlign: "right", color: "#0f172a" }}>₹{fmtPrice(p.price)}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "8px 10px", textAlign: "right", color: "#0f172a", fontWeight: "600" }}>₹{fmtPrice(p.total)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 3 - data.products.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: "30px" }}>
                  <td style={{ border: "1px solid #cbd5e1", padding: "6px" }}></td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "6px" }}></td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "6px" }}></td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "6px" }}></td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "6px" }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totals Section ────────────────────────────────────── */}
        <div style={{ display: "flex", padding: "0 24px", fontSize: "12px" }}>
          {/* Left: Amount in words */}
          <div style={{ flex: 1, borderLeft: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1", padding: "10px 12px", background: "#fafafa" }}>
            <div style={{ fontWeight: "bold", color: "#475569", fontSize: "11px", textTransform: "uppercase", marginBottom: "4px" }}>
              Amount in words:
            </div>
            <div style={{ color: "#0f172a", fontWeight: "500", fontStyle: "italic" }}>{numberToWords(data.grandTotal)}</div>
          </div>

          {/* Right: Totals column */}
          <div style={{ minWidth: "240px", borderRight: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", fontWeight: "600", color: "#475569" }}>TOTAL BASIC PRICE</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>₹{fmtPrice(data.subtotal)}</td>
                </tr>
                {toNum(data.discount.amount) > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "6px 10px", color: "#166534" }}>
                      Discount{data.discount.type === "percentage" ? ` (${data.discount.value}%)` : ""}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "right", color: "#166534", fontWeight: "600" }}>
                      -₹{fmtPrice(data.discount.amount)}
                    </td>
                  </tr>
                )}
                {data.additionalCharges.filter((c) => toNum(c.amount) > 0).map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "6px 10px", color: "#475569" }}>{c.title || "Additional Charge"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", color: "#0f172a", fontWeight: "600" }}>+₹{fmtPrice(c.amount)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f1f5f9", borderTop: "2px solid #cbd5e1", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <td style={{ padding: "8px 10px", fontWeight: "bold", fontSize: "13px", color: "#0f172a" }}>GRAND TOTAL</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>
                    ₹{fmtPrice(data.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Terms & Bank + Signature ──────────────────────────── */}
        <div style={{ flex: 1, display: "flex", padding: "20px 24px", gap: "24px", borderTop: "1px solid #e2e8f0", fontSize: "12px", minHeight: "180px" }}>
          {/* Left: Terms & Bank */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#64748b", fontSize: "11px", letterSpacing: "0.5px", marginBottom: "4px" }}>
              Terms &amp; Conditions:
            </div>
            <div style={{ whiteSpace: "pre-line", margin: "0 0 12px 0", lineHeight: "1.5", color: "#475569", fontSize: "11px" }}>
              {terms}
            </div>

            {(bankName || accountNumber) && (
              <>
                <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#64748b", fontSize: "11px", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  Bank Details:
                </div>
                <table style={{ fontSize: "11px", lineHeight: "1.6", color: "#334155" }}>
                  <tbody>
                    {bankName && <tr><td style={{ paddingRight: "8px", color: "#64748b", fontWeight: "500" }}>Bank Name</td><td>: {bankName}</td></tr>}
                    {accountName && <tr><td style={{ paddingRight: "8px", color: "#64748b", fontWeight: "500" }}>A/C Holder</td><td>: {accountName}</td></tr>}
                    {accountNumber && <tr><td style={{ paddingRight: "8px", color: "#64748b", fontWeight: "500" }}>A/C No</td><td>: {accountNumber}</td></tr>}
                    {branch && <tr><td style={{ paddingRight: "8px", color: "#64748b", fontWeight: "500" }}>Branch</td><td>: {branch}</td></tr>}
                    {ifscCode && <tr><td style={{ paddingRight: "8px", color: "#64748b", fontWeight: "500" }}>IFSC Code</td><td>: {ifscCode}</td></tr>}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Right: Signature */}
          <div style={{ minWidth: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: "4px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#0f172a", marginBottom: "48px" }}>For {companyName}</div>
            <div style={{ borderTop: "1px solid #94a3b8", width: "160px", paddingTop: "4px", textAlign: "center", fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
              {signatureTitle}
            </div>
          </div>
        </div>

        {/* ── Dynamic Footer Band ─────────────────────────────────── */}
        <div
          style={{
            background: headerColor,
            color: "#ffffff",
            padding: "12px 24px",
            textAlign: "center",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {address && (
            <div style={{ color: "#ffffff", fontSize: "11px", lineHeight: "1.5" }}>
              {address} {phone && ` | Ph: ${phone}`}
            </div>
          )}
          {email && (
            <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "11px", marginTop: "2px" }}>
              Email: {email}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InvoiceTemplateClassic.displayName = "InvoiceTemplateClassic";
