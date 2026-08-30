import liff from "@line/liff";
import { CustomerInfo, Quotation, LineOfficialConfig } from "../types";
import {
  createQuoteFlexMessage,
  formatQuoteForLineText,
  getLineConsultationUrl,
} from "./formatters";

let isLiffInitialized = false;

function isLiffEnvironmentAllowed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
  const isLiffHost = hostname.includes("liff.line.me") || hostname.includes("liff.me") || hostname.includes("line-apps.com");

  return isLocalDev || isLiffHost;
}

/**
 * Initializes LIFF SDK only when the app is running in a valid LIFF environment.
 * This avoids hitting 400 errors when the page is opened before the LIFF app is approved.
 */
export async function initLiffIfNeeded(liffId?: string): Promise<boolean> {
  const targetLiffId = liffId || (import.meta as any).env?.VITE_LIFF_ID;
  if (!targetLiffId || !targetLiffId.trim()) {
    return false;
  }

  if (!isLiffEnvironmentAllowed()) {
    console.info("Skipping LIFF initialization outside a valid LIFF environment.");
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

export async function getLiffCustomer(config: LineOfficialConfig): Promise<CustomerInfo | null> {
  const liffId = config.liffId?.trim() || (import.meta as any).env?.VITE_LIFF_ID;
  if (!liffId || !(await initLiffIfNeeded(liffId)) || !liff.isLoggedIn()) {
    return null;
  }

  try {
    const profile = await liff.getProfile();
    return {
      name: profile.displayName,
      lineId: profile.userId,
    };
  } catch (err) {
    console.warn("Unable to load LINE profile:", err);
    return null;
  }
}

/**
 * Transmits consultation message using LIFF text messaging or falls back to Deep Link
 */
export async function sendQuoteViaLiff(
  quotation: Quotation,
  config: LineOfficialConfig
): Promise<{ success: boolean; method: "liff_send" | "liff_share" | "deeplink" | "error"; message?: string }> {
  const liffId = config.liffId?.trim() || (import.meta as any).env?.VITE_LIFF_ID;

  if (liffId && isLiffEnvironmentAllowed()) {
    const initialized = await initLiffIfNeeded(liffId);
    if (initialized && liff.isInClient()) {
      const flexMessage = createQuoteFlexMessage(quotation);
      const messagesPayload = [flexMessage];
      let lastError = "請確認 LIFF 權限與開啟來源";

      try {
        await liff.sendMessages(messagesPayload as any);
        return {
          success: true,
          method: "liff_send",
          message: "已將諮詢單傳送至官方 LINE 聊天室！",
        };
      } catch (sendErr: any) {
        console.warn("LIFF sendMessages failed, trying shareTargetPicker:", sendErr);
        lastError = sendErr?.message || lastError;
      }

      // Let the user choose the Official Account when the current chat cannot receive it.
      if (liff.isApiAvailable("shareTargetPicker")) {
        try {
          const res = await liff.shareTargetPicker(messagesPayload as any);
          if (res) {
            return {
              success: true,
              method: "liff_share",
              message: "已成功轉發諮詢單！",
            };
          }
        } catch (shareErr: any) {
          console.warn("LIFF shareTargetPicker failed or user canceled:", shareErr);
          lastError = shareErr?.message || lastError;
        }
      }

      return {
        success: false,
        method: "error",
        message: `LINE 訊息傳送失敗：${lastError}`,
      };
    }
  }

  // 4. Fallback to LINE Deep Link
  const lineText = formatQuoteForLineText(quotation);
  const consultationUrl = getLineConsultationUrl(config, lineText);
  window.open(consultationUrl, "_blank");

  return {
    success: true,
    method: "deeplink",
    message: "已開啟 LINE 對話框，請在對話框點擊送出即可由小編為您服務。",
  };
}
