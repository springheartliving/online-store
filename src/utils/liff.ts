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

function getTargetLiffId(liffId?: string): string {
  return (liffId || (import.meta as any).env?.VITE_LIFF_ID || "").trim();
}

/**
 * Initializes LIFF SDK only when the app is running in a valid LIFF environment.
 * This avoids hitting 400 errors when the page is opened before the LIFF app is approved.
 */
export async function initLiffIfNeeded(liffId?: string): Promise<boolean> {
  const targetLiffId = getTargetLiffId(liffId);
  if (!targetLiffId) {
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
    await liff.init({ liffId: targetLiffId });
    isLiffInitialized = true;
    return true;
  } catch (err) {
    console.warn("LIFF initialization error:", err);
    return false;
  }
}

export async function getLiffCustomer(config: LineOfficialConfig): Promise<CustomerInfo | null> {
  const liffId = getTargetLiffId(config.liffId);
  if (!liffId) {
    return null;
  }

  if (!(await initLiffIfNeeded(liffId))) {
    return null;
  }

  if (!liff.isLoggedIn()) {
    console.warn("LIFF user is not logged in; cannot fetch LINE profile.");
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

export async function getLiffAuthStatus(liffId?: string): Promise<{ ready: boolean; reason?: string; profile?: CustomerInfo }> {
  const targetLiffId = getTargetLiffId(liffId);
  if (!targetLiffId) {
    return { ready: false, reason: "LIFF ID is missing." };
  }

  if (!isLiffEnvironmentAllowed()) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "unknown";
    return { ready: false, reason: `LIFF environment not allowed for host: ${hostname}` };
  }

  try {
    const initialized = await initLiffIfNeeded(targetLiffId);
    if (!initialized) {
      return { ready: false, reason: "LIFF SDK initialization failed." };
    }

    if (!liff.isLoggedIn()) {
      return { ready: false, reason: "LIFF user is not logged in." };
    }

    if (!liff.isInClient()) {
      return { ready: false, reason: "App is not running inside the LINE client." };
    }

    const profile = await liff.getProfile();
    return {
      ready: true,
      profile: {
        name: profile.displayName,
        lineId: profile.userId,
      },
    };
  } catch (error: any) {
    return { ready: false, reason: error?.message || "LIFF authorization check failed." };
  }
}

/**
 * Transmits consultation message using LIFF text messaging or falls back to Deep Link
 */
export async function sendQuoteViaLiff(
  quotation: Quotation,
  config: LineOfficialConfig
): Promise<{ success: boolean; method: "liff_send" | "liff_share" | "deeplink" | "error"; message?: string }> {
  const liffId = getTargetLiffId(config.liffId);
  const authStatus = await getLiffAuthStatus(liffId);

  console.info("LIFF auth check before sending", authStatus);

  if (authStatus.ready) {
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

  console.warn("LIFF flow skipped before send because auth was not ready.", authStatus);

  const lineText = formatQuoteForLineText(quotation);
  const consultationUrl = getLineConsultationUrl(config, lineText);
  window.open(consultationUrl, "_blank");

  return {
    success: true,
    method: "deeplink",
    message: "已開啟 LINE 對話框，請在對話框點擊送出即可由小編為您服務。",
  };
}
