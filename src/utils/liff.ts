import liff from "@line/liff";
import { CustomerInfo, Quotation, LineOfficialConfig } from "../types";
import {
  createQuoteFlexMessage,
  formatQuoteForLineText,
  getLineConsultationUrl,
} from "./formatters";

let isLiffInitialized = false;

function getTargetLiffId(liffId?: string): string {
  const envLiffId = (import.meta as any).env?.VITE_LIFF_ID || "";
  return (liffId || envLiffId).trim();
}

function isLikelyLiffContext(): boolean {
  if (typeof window === "undefined") return false;

  const href = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const referrer = document.referrer?.toLowerCase?.() || "";

  return (
    hostname.includes("liff") ||
    hostname.includes("line.me") ||
    hostname.includes("line-apps.com") ||
    pathname.includes("liff") ||
    href.includes("liff.line.me") ||
    href.includes("line.me/r/liff") ||
    referrer.includes("liff") ||
    referrer.includes("line.me") ||
    (hostname === "localhost" && !!getTargetLiffId())
  );
}

export function isLiffEnvironmentAllowed(): boolean {
  return isLikelyLiffContext();
}

export async function initLiffIfNeeded(liffId?: string): Promise<boolean> {
  const targetLiffId = getTargetLiffId(liffId);
  if (!targetLiffId || !isLikelyLiffContext()) {
    return false;
  }

  if (isLiffInitialized) {
    return true;
  }

  try {
    await liff.init({ liffId: targetLiffId });
    isLiffInitialized = true;
    return true;
  } catch {
    isLiffInitialized = false;
    return false;
  }
}

function canSendMessageInCurrentLiffContext(): boolean {
  try {
    const context = liff.getContext?.();
    if (!context) return false;

    const allowedTypes = ["utou", "room", "group"];
    return allowedTypes.includes(context.type || "");
  } catch {
    return false;
  }
}

export async function getLiffCustomer(config: LineOfficialConfig): Promise<CustomerInfo | null> {
  const targetLiffId = getTargetLiffId(config.liffId);
  if (!targetLiffId || !isLikelyLiffContext()) {
    return null;
  }

  if (!(await initLiffIfNeeded(targetLiffId))) {
    return null;
  }

  if (!liff.isLoggedIn?.()) {
    return null;
  }

  try {
    const profile = await liff.getProfile();
    if (!profile?.userId) {
      return null;
    }

    return {
      name: profile.displayName?.trim() || profile.userId,
      lineId: profile.userId,
    };
  } catch {
    return null;
  }
}

export async function getLiffAuthStatus(liffId?: string): Promise<{ ready: boolean; reason?: string; profile?: CustomerInfo }> {
  const targetLiffId = getTargetLiffId(liffId);

  if (!targetLiffId || !isLikelyLiffContext()) {
    return { ready: false, reason: "LIFF context is not available." };
  }

  if (!(await initLiffIfNeeded(targetLiffId))) {
    return { ready: false, reason: "LIFF init failed." };
  }

  if (!liff.isLoggedIn?.()) {
    return { ready: false, reason: "LIFF user is not logged in." };
  }

  try {
    const profile = await liff.getProfile();
    if (!profile?.userId) {
      return { ready: false, reason: "LIFF profile is empty." };
    }

    return {
      ready: true,
      profile: {
        name: profile.displayName?.trim() || profile.userId,
        lineId: profile.userId,
      },
    };
  } catch {
    return { ready: false, reason: "LIFF profile fetch failed." };
  }
}

export async function sendQuoteViaLiff(
  quotation: Quotation,
  config: LineOfficialConfig
): Promise<{ success: boolean; method: "liff_send" | "liff_share" | "deeplink" | "error"; message?: string }> {
  const targetLiffId = getTargetLiffId(config.liffId);
  const textMessage = formatQuoteForLineText(quotation);

  const isValidLiffSendContext = Boolean(
    targetLiffId &&
    isLikelyLiffContext() &&
    (await initLiffIfNeeded(targetLiffId)) &&
    liff.isLoggedIn?.() &&
    canSendMessageInCurrentLiffContext()
  );

  if (!isValidLiffSendContext) {
    const url = getLineConsultationUrl(config, textMessage);
    try {
      window.open(url, "_blank");
    } catch {
      window.location.href = url;
    }

    return {
      success: true,
      method: "deeplink",
      message: "已開啟 LINE 官方對話框，請在對話框點擊送出即可由小編為您服務。",
    };
  }

  try {
    const flexMessage = createQuoteFlexMessage(quotation);

    if (liff.isApiAvailable?.("sendMessages")) {
      await liff.sendMessages([flexMessage] as any);
      return {
        success: true,
        method: "liff_send",
        message: "已將諮詢單傳送至官方 LINE 聊天室！",
      };
    }

    if (liff.isApiAvailable?.("shareTargetPicker")) {
      const result = await liff.shareTargetPicker([flexMessage] as any);
      if (result) {
        return {
          success: true,
          method: "liff_share",
          message: "已成功轉發諮詢單！",
        };
      }
    }

    return {
      success: false,
      method: "error",
      message: "LINE 訊息傳送失敗：目前 LIFF 不支援發送此訊息。",
    };
  } catch (error: any) {
    const url = getLineConsultationUrl(config, textMessage);
    try {
      window.open(url, "_blank");
    } catch {
      window.location.href = url;
    }

    return {
      success: true,
      method: "deeplink",
      message: `LINE 訊息傳送失敗: ${error?.message || "請改用官方 LINE 對話框"}`,
    };
  }
}
