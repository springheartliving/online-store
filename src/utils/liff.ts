import liff from "@line/liff";
import { Quotation, LineOfficialConfig } from "../types";
import { formatQuoteForLineText, getLineConsultationUrl } from "./formatters";

/**
 * Creates a LINE Flex Message payload for the consultation quotation
 */
export function createQuoteFlexMessage(quote: Quotation) {
  const itemRows: any[] = quote.items.map((item, idx) => ({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    margin: idx > 0 ? "sm" : "none",
    contents: [
      {
        type: "text",
        text: `${idx + 1}. ${item.name}`,
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
    altText: `【泉心生活】官方諮詢單 ${quote.quoteNo}`,
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
            text: "官方商品諮詢單",
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
                text: "預估諮詢總額",
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
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "泉心生活 官方網站",
              uri: "https://meetspa.lohastime.com.tw/",
            },
            style: "secondary",
            color: "#FAF9F6",
            height: "sm",
          },
        ],
      },
    },
  };
}

let isLiffInitialized = false;

/**
 * Initializes LIFF SDK if a LIFF ID is provided or in URL params
 */
export async function initLiffIfNeeded(liffId?: string): Promise<boolean> {
  const targetLiffId = liffId || (import.meta as any).env?.VITE_LIFF_ID;
  if (!targetLiffId || !targetLiffId.trim()) {
    return false;
  }

  if (isLiffInitialized) {
    return true;
  }

  try {
    await liff.init({ liffId: targetLiffId.trim() });
    isLiffInitialized = true;
    return true;
  } catch (err) {
    console.warn("LIFF initialization error:", err);
    return false;
  }
}

/**
 * Transmits consultation message using LIFF structure (Flex Message + Text) or falls back to Deep Link
 */
export async function sendQuoteViaLiff(
  quotation: Quotation,
  config: LineOfficialConfig
): Promise<{ success: boolean; method: "liff_send" | "liff_share" | "deeplink"; message?: string }> {
  const flexMessage = createQuoteFlexMessage(quotation);
  const textMessage = {
    type: "text" as const,
    text: formatQuoteForLineText(quotation),
  };
  const messagesPayload = [flexMessage, textMessage];

  const liffId = config.liffId?.trim() || (import.meta as any).env?.VITE_LIFF_ID;

  if (liffId) {
    const initialized = await initLiffIfNeeded(liffId);
    if (initialized) {
      // 1. Check if user is logged in via LIFF
      if (!liff.isLoggedIn()) {
        try {
          liff.login();
          return { success: true, method: "liff_send", message: "正為您引導 LIFF 登入..." };
        } catch (loginErr) {
          console.warn("LIFF login error:", loginErr);
        }
      }

      // 2. If inside LINE in-app browser
      if (liff.isInClient()) {
        try {
          await liff.sendMessages(messagesPayload as any);
          return {
            success: true,
            method: "liff_send",
            message: "已成功透過 LIFF Flex Message 將諮詢單傳送至 LINE 聊天室！",
          };
        } catch (sendErr) {
          console.warn("LIFF sendMessages failed, trying shareTargetPicker:", sendErr);
        }
      }

      // 3. Share Target Picker (Select target chat / official account)
      if (liff.isApiAvailable("shareTargetPicker")) {
        try {
          const res = await liff.shareTargetPicker(messagesPayload as any);
          if (res) {
            return {
              success: true,
              method: "liff_share",
              message: "已成功透過 LIFF 轉發結構化諮詢單！",
            };
          }
        } catch (shareErr) {
          console.warn("LIFF shareTargetPicker failed or user canceled:", shareErr);
        }
      }
    }
  }

  // 4. Fallback to LINE Deep Link
  const lineText = formatQuoteForLineText(quotation);
  const consultationUrl = getLineConsultationUrl(config, lineText);
  window.open(consultationUrl, "_blank");

  return {
    success: true,
    method: "deeplink",
    message: "已開啟 LINE 對話框，請在對話框點擊送出即可由小編即時為您服務。",
  };
}
