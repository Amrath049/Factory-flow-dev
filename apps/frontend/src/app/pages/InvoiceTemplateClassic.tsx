import React from "react";

interface InvoiceData {
  customer: { name: string; phone: string; address: string };
  products: Array<{ productName: string; quantity: number; price: number; total: number }>;
  discount: { type: "flat" | "percentage"; value: number; amount: number; reason: string };
  additionalCharges: Array<{ title: string; amount: number; reason: string }>;
  subtotal: number;
  grandTotal: number;
  date: string;
}

// ─── Amount in words (Indian system) ─────────────────────────────────────────
function numberToWords(num: number): string {
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

  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);
  const words = convert(integer) || "Zero";
  return "Rupees " + words + (decimal ? ` and ${decimal}/100` : "") + " Only";
}

interface Props {
  data: InvoiceData;
  invoiceNumber: string;
}

export const InvoiceTemplateClassic = React.forwardRef<HTMLDivElement, Props>(
  ({ data, invoiceNumber }, ref) => {
    return (
      <div
        ref={ref}
        style={{ fontFamily: "Arial, sans-serif", background: "white", width: "100%", maxWidth: "800px", margin: "0 auto", border: "1px solid #ccc" }}
      >
        {/* ── Green Header Band ─────────────────────────────────── */}
        <div style={{ background: "#1a5c2a", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "white", fontSize: "26px", fontWeight: "bold", letterSpacing: "1px" }}>
              SIRI ENTERPRISES
            </div>
            <div style={{ color: "#c8e6c9", fontSize: "12px", marginTop: "4px" }}>
              Areca Palm Leaf Plates and Products Manufacturer
            </div>
            <div style={{ marginTop: "8px", display: "inline-block", background: "#0d3d1a", border: "1px solid #4caf50", borderRadius: "12px", padding: "2px 12px" }}>
              <span style={{ color: "white", fontSize: "10px" }}>www.sirienterprises.com</span>
            </div>
          </div>
          <img
            src="/logo.png"
            alt="Siri Enterprises"
            style={{ height: "80px", width: "80px", objectFit: "contain", borderRadius: "50%", background: "white", padding: "4px" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        {/* ── Invoice Title Bar ─────────────────────────────────── */}
        <div style={{ background: "#e8f5e9", textAlign: "center", padding: "6px", borderBottom: "1px solid #ccc" }}>
          <span style={{ fontWeight: "bold", fontSize: "14px", letterSpacing: "2px" }}>TAX INVOICE</span>
        </div>

        {/* ── Billing + Invoice Details ─────────────────────────── */}
        <div style={{ display: "flex", padding: "16px 24px", gap: "24px", borderBottom: "1px solid #ccc" }}>
          {/* Billing Address */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "6px", fontSize: "13px" }}>
              Billing Address:
            </div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{data.customer.name}</div>
            <div style={{ fontSize: "12px", color: "#444", marginTop: "4px", lineHeight: "1.6" }}>
              {data.customer.phone}
            </div>
            <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6", whiteSpace: "pre-line" }}>
              {data.customer.address}
            </div>
          </div>

          {/* Invoice Details Box */}
          <div style={{ minWidth: "220px", border: "1px solid #333", padding: "10px", fontSize: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 6px", fontWeight: "bold", color: "#333" }}>INVOICE NO</td>
                  <td style={{ padding: "3px 6px" }}>: {invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", fontWeight: "bold", color: "#333" }}>INVOICE DATE</td>
                  <td style={{ padding: "3px 6px" }}>: {data.date}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", fontWeight: "bold", color: "#333" }}>HSN CODE</td>
                  <td style={{ padding: "3px 6px" }}>:</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Products Table ────────────────────────────────────── */}
        <div style={{ padding: "0 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #333", borderTop: "1px solid #333" }}>
                <th style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "center", width: "40px" }}>SL NO</th>
                <th style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "left" }}>PARTICULARS</th>
                <th style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "center", width: "60px" }}>QTY</th>
                <th style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "right", width: "80px" }}>RATE</th>
                <th style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "right", width: "90px" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px" }}>{p.productName}</td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "center" }}>{p.quantity.toLocaleString()}</td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "right" }}>₹{p.price.toFixed(2)}</td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px", textAlign: "right" }}>₹{p.total.toFixed(2)}</td>
                </tr>
              ))}
              {/* Empty filler rows to match PDF look */}
              {Array.from({ length: Math.max(0, 4 - data.products.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: "32px" }}>
                  <td style={{ border: "1px solid #333", padding: "8px 6px" }}></td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px" }}></td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px" }}></td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px" }}></td>
                  <td style={{ border: "1px solid #333", padding: "8px 6px" }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totals Section ────────────────────────────────────── */}
        <div style={{ display: "flex", padding: "0 24px", borderTop: "none", fontSize: "12px" }}>
          {/* Left: Amount in words */}
          <div style={{ flex: 1, borderLeft: "1px solid #333", borderBottom: "1px solid #333", padding: "10px 8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Amount in words:</div>
            <div style={{ color: "#333", fontStyle: "italic" }}>{numberToWords(data.grandTotal)}</div>
          </div>
          {/* Right: Totals column */}
          <div style={{ minWidth: "220px", borderLeft: "1px solid #333", borderRight: "1px solid #333", borderBottom: "1px solid #333" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "5px 8px", fontWeight: "bold" }}>TOTAL BASIC PRICE</td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{data.subtotal.toFixed(2)}</td>
                </tr>
                {data.discount.amount > 0 && (
                  <tr style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "5px 8px" }}>
                      Discount{data.discount.type === "percentage" ? ` (${data.discount.value}%)` : ""}
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "right", color: "#2e7d32" }}>
                      -₹{data.discount.amount.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "5px 8px" }}>CGST</td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}></td>
                </tr>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "5px 8px" }}>SGST</td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}></td>
                </tr>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "5px 8px" }}>TOTAL GST</td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}></td>
                </tr>
                {data.additionalCharges.filter((c) => c.amount > 0).map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "5px 8px" }}>{c.title || "Additional Charge"}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{c.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#e8f5e9", border: "2px solid #333" }}>
                  <td style={{ padding: "7px 8px", fontWeight: "bold", fontSize: "13px" }}>GRAND TOTAL</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>
                    ₹{data.grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Terms & Bank + Signature ──────────────────────────── */}
        <div style={{ display: "flex", padding: "12px 24px", gap: "24px", borderTop: "1px solid #ccc", fontSize: "12px" }}>
          {/* Left: Terms & Bank */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "6px" }}>
              Terms &amp; Conditions:
            </div>
            <ol style={{ paddingLeft: "18px", margin: "0 0 12px 0", lineHeight: "1.8", color: "#444" }}>
              <li>Goods once sold cannot be returned</li>
              <li>Transportation charges extra</li>
              <li>Payment due immediately upon receipt</li>
            </ol>

            <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "6px" }}>
              Bank Details:
            </div>
            <table style={{ fontSize: "12px", lineHeight: "1.8" }}>
              <tbody>
                <tr><td style={{ paddingRight: "8px", color: "#555" }}>Bank Name</td><td>: Canara Bank</td></tr>
                <tr><td style={{ paddingRight: "8px", color: "#555" }}>A/C Holder</td><td>: Siri Enterprises</td></tr>
                <tr><td style={{ paddingRight: "8px", color: "#555" }}>Branch</td><td>: Brahmavar</td></tr>
                <tr><td style={{ paddingRight: "8px", color: "#555" }}>IFSC Code</td><td>: CNRB0001234</td></tr>
                <tr><td style={{ paddingRight: "8px", color: "#555" }}>UPI</td><td>: sirienterprises@cnrb</td></tr>
              </tbody>
            </table>
          </div>

          {/* Right: Signature */}
          <div style={{ minWidth: "180px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "48px" }}>For Siri Enterprises</div>
            <div style={{ borderTop: "1px solid #333", width: "140px", paddingTop: "4px", textAlign: "center", fontSize: "11px", color: "#555" }}>
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* ── Green Footer Band ─────────────────────────────────── */}
        <div style={{ background: "#1a5c2a", padding: "10px 24px", textAlign: "center" }}>
          <div style={{ color: "white", fontSize: "11px", lineHeight: "1.8" }}>
            Mahatma Gandhi Nagar, Cherkady, Udupi - 576215 &nbsp;|&nbsp; Ph: 8088467281, 9187567281
          </div>
          <div style={{ color: "#c8e6c9", fontSize: "11px" }}>
            Email: sirienterprises.business@gmail.com
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplateClassic.displayName = "InvoiceTemplateClassic";
