import { LineOfficialConfig, Quotation } from "../types";

export function formatNTD(amount: number): string {
  return `NT$ ${Math.round(amount).toLocaleString()}`;
}

export function generateQuoteNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SH-${yyyy}${mm}${dd}-${rand}`;
}

export const DEFAULT_LINE_CONFIG: LineOfficialConfig = {
  lineId: (import.meta as any).env?.VITE_LINE_ID || "",
  lineUrl: (import.meta as any).env?.VITE_LINE_URL || "",
  liffId: (import.meta as any).env?.VITE_LIFF_ID || "",
  liffUrl: (import.meta as any).env?.VITE_LIFF_URL || "",
  useOaMessage: true,
};

/**
 * Builds the official LINE chat deep link or LIFF link for direct consultation
 */
export function getLineConsultationUrl(config: LineOfficialConfig, messageText: string): string {
  const encodedText = encodeURIComponent(messageText);

  // Official Account Deep Link (oaMessage) opens the target chat directly.
  // If lineId is provided (e.g. "@springheart" or "springheart")
  const rawId = config.lineId ? config.lineId.trim() : "";
  if (rawId) {
    const formattedId = rawId.startsWith("@") ? rawId : `@${rawId}`;
    return `https://line.me/R/oaMessage/${encodeURIComponent(formattedId)}/?${encodedText}`;
  }

  // Use LIFF as a fallback only when no Official Account ID is configured.
  if (config.liffUrl && config.liffUrl.trim()) {
    const baseUrl = config.liffUrl.trim();
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}text=${encodedText}`;
  }

  if (config.liffId && config.liffId.trim()) {
    return `https://liff.line.me/${config.liffId.trim()}?text=${encodedText}`;
  }

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
}): string {
  const itemsText = quote.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name}-${item.sku}\n   ${item.quantity} x NT$${item.price.toLocaleString()} = NT$${(item.quantity * item.price).toLocaleString()}`
    )
    .join("\n");

  return `🌿【泉心生活】商品諮詢單

📄 諮詢單號：${quote.quoteNo}
━━━━━━━━━━━━━━
📦 諮詢商品明細：
${itemsText}
━━━━━━━━━━━━━━
💰 總金額：NT$ ${quote.totalAmount.toLocaleString()}`;
}

export function createQuoteFlexMessage(quote: Quotation) {
  const itemRows = quote.items.map((item, idx) => ({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    margin: idx > 0 ? "sm" : "none",
    contents: [
      {
        type: "text",
        text: `${item.name}`,
        size: "xs",
        color: "#2D2D2D",
        weight: "bold",
        flex: 4,
        wrap: true,
      },
      {
        type: "text",
        text: `x${item.quantity}`,
        size: "xs",
        color: "#8A8576",
        flex: 1,
        align: "center",
      },
      {
        type: "text",
        text: `NT$ ${(item.price * item.quantity).toLocaleString()}`,
        size: "xs",
        color: "#2D2D2D",
        flex: 2,
        align: "end",
      },
    ],
  }));

  return {
    type: "flex" as const,
    altText: `【泉心生活】商品諮詢單 ${quote.quoteNo}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#7C8B7C",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "泉心生活 Spring Heart Living",
            color: "#FFFFFF",
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: "商品諮詢單",
            color: "#E5E2D9",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "諮詢單號",
                size: "xs",
                color: "#8A8576",
                flex: 0,
              },
              {
                type: "text",
                text: quote.quoteNo,
                size: "xs",
                color: "#2D2D2D",
                align: "end",
                weight: "bold",
              },
            ],
          },
          {
            type: "separator",
            color: "#E5E2D9",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: itemRows,
          },
          {
            type: "separator",
            color: "#E5E2D9",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "諮詢清單總計",
                weight: "bold",
                color: "#2D2D2D",
                size: "sm",
              },
              {
                type: "text",
                text: `NT$ ${quote.totalAmount.toLocaleString()}`,
                weight: "bold",
                color: "#7C8B7C",
                size: "md",
                align: "end",
              },
            ],
          },
        ],
      },
    },
  };
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

