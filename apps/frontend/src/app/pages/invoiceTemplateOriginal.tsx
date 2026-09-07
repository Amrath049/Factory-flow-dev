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
  logoUrl?: string;
}

export const InvoiceTemplateClassic = React.forwardRef<HTMLDivElement, Props>(
  ({ data, invoiceNumber, logoUrl }, ref) => {
    const cellBorder = "1px solid #333";

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "Arial, sans-serif",
          background: "white",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          border: "1px solid #333",
          fontSize: "13px",
          color: "#000",
        }}
      >
        {/* ── Header: white wrapper so circle logo can overflow top & bottom ── */}
        <div style={{ background: "white", position: "relative" }}>

          {/* White space above — logo overflows up into this */}
          <div style={{ height: "22px" }} />

          {/* Green band row */}
          <div style={{
            background: "#1a5c2a",
            padding: "16px 24px 16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            overflow: "visible",
          }}>
            {/* Left: Company name + tagline */}
            <div>
              <div style={{ fontSize: "34px", fontWeight: "900", color: "white", letterSpacing: "1px", lineHeight: 1 }}>
                SIRI ENTERPRISES
              </div>
              <div style={{ fontSize: "13px", color: "#c8e6c9", marginTop: "7px" }}>
                Areca Palm Leaf Plates and Products Manufacturer
              </div>
            </div>

            {/* Right: Circle logo — overflows above and below green band */}
            <div style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              height: "130px",
              width: "130px",
              borderRadius: "50%",
              border: "4px solid #1a5c2a",
              outline: "3px solid white",
              background: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              zIndex: 3,
            }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Siri Enterprises"
                  style={{ height: "122px", width: "122px", objectFit: "contain" }} />
              ) : (
                <>
                  <span style={{ fontWeight: "900", fontSize: "30px", color: "#1a5c2a", lineHeight: 1 }}>SE</span>
                  <span style={{ fontSize: "8px", color: "#1a5c2a", fontWeight: "bold", marginTop: "3px", letterSpacing: "1px" }}>SIRI ENTERPRISES</span>
                </>
              )}
            </div>

            {/* Spacer to keep text from going under logo */}
            <div style={{ width: "150px", flexShrink: 0 }} />
          </div>

          {/* White strip below green band — website URL pill sits here */}
          <div style={{ padding: "8px 0 10px 0", background: "white" }}>
            {/* Pill: green bg, rounded right end, flat left (bleeds to edge) */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#1a5c2a",
              color: "white",
              fontSize: "12px",
              padding: "5px 24px 5px 24px",
              borderRadius: "0 20px 20px 0",
            }}>
              www.sirienterprises.com
            </div>
          </div>

        </div>

        {/* ── Inner content box ────────────────────────────────── */}
        <div style={{ margin: "0 16px 16px 16px", border: "1px solid #333", overflow: "hidden" }}>

        {/* ── Billing + Invoice Details Row ─────────────────────── */}
        <div style={{ display: "flex", borderBottom: cellBorder }}>
          {/* Billing Address */}
          <div style={{ flex: 1, padding: "12px 16px", borderRight: cellBorder }}>
            <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "6px", fontSize: "13px" }}>
              Billing Address:
            </div>
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "2px" }}>{data.customer.name}</div>
            <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.7" }}>{data.customer.phone}</div>
            <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.7", whiteSpace: "pre-line" }}>{data.customer.address}</div>
          </div>

          {/* Invoice Details */}
          <div style={{ width: "260px", padding: "12px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "5px 12px", fontWeight: "bold" }}>INVOICE NO</td>
                  <td style={{ padding: "5px 8px" }}>: {invoiceNumber}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "5px 12px", fontWeight: "bold" }}>INVOICE DATE</td>
                  <td style={{ padding: "5px 8px" }}>: {data.date}</td>
                </tr>
                <tr>
                  <td style={{ padding: "5px 12px", fontWeight: "bold" }}>HSN CODE</td>
                  <td style={{ padding: "5px 8px" }}>:</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Products Table ─────────────────────────────────────── */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#fff" }}>
              <th style={{ border: cellBorder, padding: "8px 6px", textAlign: "center", width: "50px" }}>SL NO</th>
              <th style={{ border: cellBorder, padding: "8px 6px", textAlign: "left" }}>PARTICULARS</th>
              <th style={{ border: cellBorder, padding: "8px 6px", textAlign: "center", width: "70px" }}>QTY</th>
              <th style={{ border: cellBorder, padding: "8px 6px", textAlign: "right", width: "90px" }}>RATE</th>
              <th style={{ border: cellBorder, padding: "8px 6px", textAlign: "right", width: "100px" }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p, i) => (
              <tr key={i} style={{ height: "36px" }}>
                <td style={{ border: cellBorder, padding: "6px", textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: cellBorder, padding: "6px 8px" }}>{p.productName}</td>
                <td style={{ border: cellBorder, padding: "6px", textAlign: "center" }}>{p.quantity.toLocaleString()}</td>
                <td style={{ border: cellBorder, padding: "6px 8px", textAlign: "right" }}>₹{p.price.toFixed(2)}</td>
                <td style={{ border: cellBorder, padding: "6px 8px", textAlign: "right" }}>₹{p.total.toFixed(2)}</td>
              </tr>
            ))}
            {/* Filler rows — always show at least 6 rows total like the PDF */}
            {Array.from({ length: Math.max(0, 6 - data.products.length) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: "36px" }}>
                <td style={{ border: cellBorder, padding: "6px" }}>&nbsp;</td>
                <td style={{ border: cellBorder, padding: "6px" }}></td>
                <td style={{ border: cellBorder, padding: "6px" }}></td>
                <td style={{ border: cellBorder, padding: "6px" }}></td>
                <td style={{ border: cellBorder, padding: "6px" }}></td>
              </tr>
            ))}
          </tbody>
        </table>


        {/* ── Bottom: merged left (amount+terms+bank) / right (totals+signature) ── */}
        {(() => {
          const extraRows = (data.discount.amount > 0 ? 1 : 0)
            + data.additionalCharges.filter(c => c.amount > 0).length;
          // Fixed right rows: TOTAL BASIC PRICE, CGST, SGST, TOTAL GST, GRAND TOTAL,
          //                   For Siri Enterprises, Authorized Signatory = 7
          const totalRightRows = 7 + extraRows;
          const rightW = "260px";
          const rCell = (extra?: React.CSSProperties): React.CSSProperties => ({
            borderLeft: cellBorder,
            borderBottom: "1px solid #ccc",
            borderRight: cellBorder,
            padding: "5px 10px",
            width: rightW,
            fontSize: "12px",
            ...extra,
          });

          return (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {/* ─ Row 1: Amount in words (left) + TOTAL BASIC PRICE (right) ─ */}
                <tr>
                  <td
                    rowSpan={totalRightRows}
                    style={{
                      borderLeft: cellBorder,
                      borderBottom: cellBorder,
                      borderRight: cellBorder,
                      padding: "10px 14px",
                      verticalAlign: "top",
                      fontSize: "12px",
                    }}
                  >
                    {/* Amount in words */}
                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ fontWeight: "bold" }}>Amount in words: </span>
                      <span style={{ fontStyle: "italic" }}>{numberToWords(data.grandTotal)}</span>
                    </div>

                    {/* Terms */}
                    <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "4px" }}>
                      Terms and conditions:
                    </div>
                    <ul style={{ paddingLeft: "18px", margin: "0 0 14px 0", lineHeight: "2" }}>
                      <li>Goods once sold cannot be returned</li>
                      <li>Transportation charges extra</li>
                      <li>Payment due immediately</li>
                    </ul>

                    {/* Bank Details */}
                    <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "5px" }}>
                      Bank Details:
                    </div>
                    <table style={{ fontSize: "12px", lineHeight: "1.9" }}>
                      <tbody>
                        <tr><td style={{ fontWeight: "bold", paddingRight: "6px" }}>Bank Name</td><td>: Canara Bank</td></tr>
                        <tr><td style={{ fontWeight: "bold", paddingRight: "6px" }}>A/C Holder</td><td>: Sushanth S</td></tr>
                        <tr><td style={{ fontWeight: "bold", paddingRight: "6px" }}>A/C No</td><td>: 5322101000893</td></tr>
                        <tr><td style={{ fontWeight: "bold", paddingRight: "6px" }}>Branch</td><td>: Harady</td></tr>
                        <tr><td style={{ fontWeight: "bold", paddingRight: "6px" }}>IFSC Code</td><td>: CNRB0005322</td></tr>
                        <tr><td style={{ fontWeight: "bold", paddingRight: "6px" }}>UPI Number</td><td>: 9481131622</td></tr>
                      </tbody>
                    </table>
                  </td>

                  {/* TOTAL BASIC PRICE */}
                  <td style={rCell()}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "bold" }}>TOTAL BASIC PRICE</span>
                      <span>₹{data.subtotal.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>

                {/* ─ Discount row (conditional) ─ */}
                {data.discount.amount > 0 && (
                  <tr>
                    <td style={rCell()}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Discount{data.discount.type === "percentage" ? ` (${data.discount.value}%)` : ""}</span>
                        <span style={{ color: "#2e7d32" }}>-₹{data.discount.amount.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* ─ CGST ─ */}
                <tr>
                  <td style={rCell()}>CGST</td>
                </tr>

                {/* ─ SGST ─ */}
                <tr>
                  <td style={rCell()}>SGST</td>
                </tr>

                {/* ─ TOTAL GST ─ */}
                <tr>
                  <td style={rCell()}>TOTAL GST</td>
                </tr>

                {/* ─ Additional charges (conditional) ─ */}
                {data.additionalCharges.filter(c => c.amount > 0).map((c, i) => (
                  <tr key={i}>
                    <td style={rCell()}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{c.title || "Additional Charge"}</span>
                        <span>₹{c.amount.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* ─ GRAND TOTAL ─ */}
                <tr>
                  <td style={rCell({ fontWeight: "bold", borderTop: "2px solid #333", fontSize: "13px" })}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>GRAND TOTAL</span>
                      <span>₹{data.grandTotal.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>

                {/* ─ For Siri Enterprises ─ */}
                <tr>
                  <td style={rCell({ textAlign: "center", fontWeight: "bold", padding: "12px 10px" })}>
                    For Siri Enterprises
                  </td>
                </tr>

                {/* ─ Authorized Signatory ─ */}
                <tr>
                  <td style={rCell({ textAlign: "center", padding: "30px 10px 10px", borderBottom: cellBorder })}>
                    <div style={{ borderTop: "1px solid #333", paddingTop: "5px", fontSize: "11px", color: "#444" }}>
                      Authorized Signatory
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          );
        })()}
        </div> {/* end inner content box */}
        <br></br>
        <br></br>

        {/* ── Green Footer ───────────────────────────────────────── */}
        <div style={{
          background: "#1a5c2a",
          padding: "10px 24px",
          textAlign: "center",
        }}>
          <div style={{ color: "white", fontSize: "11px", lineHeight: "1.9" }}>
            Mahatma Gandhi Nagar, cherkady, Udupi - 576215. Ph no: 8088467281, 9187567281
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
