import liff from "@line/liff";
import { CustomerInfo, Quotation, LineOfficialConfig } from "../types";
import {
  createQuoteFlexMessage,
  formatQuoteForLineText,
  getLineConsultationUrl,
} from "./formatters";

let isLiffInitialized = false;

function isLiffPermissionDeniedError(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    message.includes("user doesn't grant required permissions yet") ||
    message.includes("doesn't grant required permissions") ||
    message.includes("permission") ||
    code.includes("permission") ||
    code.includes("not_granted")
  );
}

function fallbackToLineDeepLink(config: LineOfficialConfig, quotation: Quotation, reason?: string) {
  const lineText = formatQuoteForLineText(quotation);
  const consultationUrl = getLineConsultationUrl(config, lineText);
  try {
    window.open(consultationUrl, "_blank");
  } catch {
    window.location.href = consultationUrl;
  }

  return {
    success: true,
    method: "deeplink" as const,
    message: reason || "已開啟 LINE 對話框，請在對話框點擊送出即可由小編為您服務。",
  };
}

export function isLiffEnvironmentAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const liffId = (import.meta as any).env?.VITE_LIFF_ID || "";
  const href = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  return Boolean(liffId.trim()) && (hostname.includes("liff") || hostname.includes("line.me") || href.includes("liff.line.me") || hostname === "localhost");
}

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

  if (liffId) {
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

        if (isLiffPermissionDeniedError(sendErr)) {
          return fallbackToLineDeepLink(
            config,
            quotation,
            "LIFF 尚未授權發送訊息，已改用 LINE 官方對話框。"
          );
        }

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
  return fallbackToLineDeepLink(
    config,
    quotation,
    "已開啟 LINE 對話框，請在對話框點擊送出即可由小編為您服務。"
  );
}
