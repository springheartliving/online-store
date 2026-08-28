import liff from "@line/liff";
import { Quotation, LineOfficialConfig } from "../types";
import {
  createQuoteFlexMessage,
  formatQuoteForLineText,
  getLineConsultationUrl,
} from "./formatters";

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
