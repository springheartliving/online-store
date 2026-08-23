import { LineOfficialConfig } from "../types";

export function formatNTD(amount: number): string {
  return `NT$ ${Math.round(amount).toLocaleString()}`;
}

export function generateQuoteNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MEET-${yyyy}${mm}${dd}-${rand}`;
}

export const DEFAULT_LINE_CONFIG: LineOfficialConfig = {
  lineId: (import.meta as any).env?.VITE_LINE_ID || "@springheart",
  lineUrl: (import.meta as any).env?.VITE_LINE_URL || "https://line.me/R/ti/p/@springheart",
  liffId: (import.meta as any).env?.VITE_LIFF_ID || "",
  liffUrl: (import.meta as any).env?.VITE_LIFF_URL || "",
  useOaMessage: true,
};

/**
 * Builds the official LINE chat deep link or LIFF link for direct consultation
 */
export function getLineConsultationUrl(config: LineOfficialConfig, messageText: string): string {
  const encodedText = encodeURIComponent(messageText);

  // 1. If LIFF URL is configured and provided
  if (config.liffUrl && config.liffUrl.trim()) {
    const baseUrl = config.liffUrl.trim();
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}text=${encodedText}`;
  }

  // 2. If LIFF ID is provided
  if (config.liffId && config.liffId.trim()) {
    return `https://liff.line.me/${config.liffId.trim()}?text=${encodedText}`;
  }

  // 3. Official Account Deep Link (oaMessage)
  // If lineId is provided (e.g. "@springheart" or "springheart")
  const rawId = config.lineId ? config.lineId.trim() : "";
  if (rawId) {
    const formattedId = rawId.startsWith("@") ? rawId : `@${rawId}`;
    // Deep Link to open Official Account and pre-fill message
    return `https://line.me/R/oaMessage/${encodeURIComponent(formattedId)}/?${encodedText}`;
  }

  // 4. Universal text share deep link
  return `https://line.me/R/msg/text/?${encodedText}`;
}

/**
 * Generates official LINE add-friend deep link
 */
export function getLineAddFriendUrl(config: LineOfficialConfig): string {
  if (config.lineUrl && config.lineUrl.trim()) {
    return config.lineUrl.trim();
  }
  const rawId = config.lineId ? config.lineId.trim() : "@springheart";
  const formattedId = rawId.startsWith("@") ? rawId : `@${rawId}`;
  return `https://line.me/R/ti/p/${encodeURIComponent(formattedId)}`;
}

export function getLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

export function formatQuoteForLineText(quote: {
  quoteNo: string;
  items: { name: string; sku?: string; quantity: number; price: number }[];
  subtotal: number;
  discountAmount?: number;
  shippingFee?: number;
  taxAmount?: number;
  totalAmount: number;
  customer?: { name?: string; phone?: string; notes?: string };
}): string {
  const itemsText = quote.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (型號: ${item.sku || "無"})\n   數量: ${item.quantity} x NT$${item.price.toLocaleString()} = NT$${(item.quantity * item.price).toLocaleString()}`
    )
    .join("\n");

  return `🌿【泉心生活 Spring Heart Living - 官方諮詢】
您好！我在線上挑選了以下喜愛的商品清單，想向小編諮詢與報價：

📄 諮詢單號：${quote.quoteNo}
━━━━━━━━━━━━━━
📦 諮詢商品明細：
${itemsText}
━━━━━━━━━━━━━━
💰 預估諮詢總額：NT$ ${quote.totalAmount.toLocaleString()}

請小編協助確認庫存、配送與專人安排，謝謝！`;
}

/**
 * Automatically converts Google Drive links to direct viewable image URLs
 */
export function formatImageUrl(url: string | undefined): string {
  if (!url) return "";
  
  // Google Drive URL conversion
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  return url;
}

