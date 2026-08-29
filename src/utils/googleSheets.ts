import { Quotation } from "../types";

const GOOGLE_SHEETS_WEB_APP_URL = (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEB_APP_URL || "";

export function getGoogleSheetsWebAppUrl(): string {
  return GOOGLE_SHEETS_WEB_APP_URL.trim();
}

export async function saveQuotationToGoogleSheet(quote: Quotation): Promise<boolean> {
  const webAppUrl = getGoogleSheetsWebAppUrl();
  if (!webAppUrl) return false;

  // Keep order data and item data structured so Apps Script can write two sheets.
  const payload = {
    quoteNo: quote.quoteNo,
    createdAt: quote.createdAt,
    customerName: quote.customer.name,
    lineUserId: quote.customer.lineId,
    items: quote.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
    totalAmount: quote.totalAmount,
  };

  try {
    // text/plain avoids a CORS preflight; Apps Script parses the JSON body.
    await fetch(webAppUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Failed to save quotation to Google Sheets:", error);
    return false;
  }
}