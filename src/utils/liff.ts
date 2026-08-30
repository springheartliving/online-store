import liff from "@line/liff";
import { CustomerInfo, Quotation, LineOfficialConfig } from "../types";
import {
  createQuoteFlexMessage,
  formatQuoteForLineText,
  getLineConsultationUrl,
} from "./formatters";

declare global {
  interface Window {
    __LINE_LIFF_DEBUG__?: {
      initialized: boolean;
      ready: boolean;
      reason?: string;
      hostname?: string;
      loggedIn?: boolean;
      inClient?: boolean;
      hasLiffId?: boolean;
    };
  }
}

let isLiffInitialized = false;

function safeLiffIsLoggedIn(): boolean {
  try {
    return !!liff?.isLoggedIn?.();
  } catch {
    return false;
  }
}

function safeLiffIsInClient(): boolean {
  try {
    return !!liff?.isInClient?.();
  } catch {
    return false;
  }
}

export function isLiffEnvironmentAllowed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const href = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const referrer = document.referrer?.toLowerCase?.() || "";

  const isLikelyLineLiffContext =
    hostname.includes("liff") ||
    hostname.includes("line.me") ||
    hostname.includes("line-apps.com") ||
    pathname.includes("/liff") ||
    pathname.includes("liff") ||
    search.includes("liff") ||
    hash.includes("liff") ||
    referrer.includes("liff") ||
    referrer.includes("line.me") ||
    referrer.includes("line-apps.com") ||
    href.includes("liff.line.me") ||
    href.includes("line.me/r/liff") ||
    href.includes("liff-app") ||
    href.includes("liff.state") ||
    search.includes("liff.state") ||
    hash.includes("liff.state");

  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1";

  return Boolean(isLikelyLineLiffContext || (isLocalDev && !!getTargetLiffId()));
}

function getTargetLiffId(liffId?: string): string {
  const envLiffId = (import.meta as any).env?.VITE_LIFF_ID || "";
  return (liffId || envLiffId).trim();
}

async function ensureLiffSession(liffId?: string): Promise<boolean> {
  const targetLiffId = getTargetLiffId(liffId);
  if (!targetLiffId) {
    return false;
  }

  if (!isLiffEnvironmentAllowed()) {
    return false;
  }

  if (!(await initLiffIfNeeded(targetLiffId))) {
    return false;
  }

  if (!safeLiffIsLoggedIn()) {
    try {
      await liff.login();
    } catch (err) {
      console.warn("LIFF login request failed while ensuring session:", err);
      return false;
    }

    if (!safeLiffIsLoggedIn()) {
      return false;
    }
  }

  return true;
}

/**
 * Initializes LIFF SDK only when the app is running in a valid LIFF environment.
 * This avoids hitting 400 errors when the page is opened before the LIFF app is approved.
 */
export async function initLiffIfNeeded(liffId?: string): Promise<boolean> {
  const targetLiffId = getTargetLiffId(liffId);
  if (!targetLiffId) {
    console.warn("[LIFF] liffId is missing before init", {
      passedLiffId: liffId,
      envLiffId: (import.meta as any).env?.VITE_LIFF_ID,
      href: typeof window !== "undefined" ? window.location.href : "",
    });
    return false;
  }

  if (!isLiffEnvironmentAllowed()) {
    console.info("[LIFF] Skipping LIFF initialization outside a valid LIFF environment.", {
      href: typeof window !== "undefined" ? window.location.href : "",
      hostname: typeof window !== "undefined" ? window.location.hostname : "",
      targetLiffId,
    });
    return false;
  }

  if (isLiffInitialized) {
    return true;
  }

  console.info("[LIFF] Initializing LIFF SDK", {
    targetLiffId,
    href: typeof window !== "undefined" ? window.location.href : "",
    hostname: typeof window !== "undefined" ? window.location.hostname : "",
  });

  try {
    await liff.init({ liffId: targetLiffId });
    isLiffInitialized = true;
    return true;
  } catch (err) {
    console.warn("[LIFF] initialization error:", err, {
      targetLiffId,
      href: typeof window !== "undefined" ? window.location.href : "",
    });
    return false;
  }
}

export async function getLiffCustomer(config: LineOfficialConfig): Promise<CustomerInfo | null> {
  const liffId = getTargetLiffId(config.liffId);
  if (!liffId) {
    return null;
  }

  if (!(await ensureLiffSession(liffId))) {
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
  const hostname = typeof window !== "undefined" ? window.location.hostname : "unknown";
  const debugState = {
    initialized: isLiffInitialized,
    ready: false,
    reason: undefined as string | undefined,
    hostname,
    loggedIn: typeof liff !== "undefined" ? liff.isLoggedIn?.() : false,
    inClient: typeof liff !== "undefined" ? liff.isInClient?.() : false,
    hasLiffId: !!targetLiffId,
  };

  if (!targetLiffId) {
    debugState.reason = "LIFF ID is missing.";
    if (typeof window !== "undefined") {
      window.__LINE_LIFF_DEBUG__ = debugState;
    }
    return { ready: false, reason: debugState.reason };
  }

  if (!isLiffEnvironmentAllowed()) {
    debugState.reason = `LIFF environment not allowed for host: ${hostname}`;
    if (typeof window !== "undefined") {
      window.__LINE_LIFF_DEBUG__ = debugState;
    }
    return { ready: false, reason: debugState.reason };
  }

  try {
    const initialized = await initLiffIfNeeded(targetLiffId);
    debugState.initialized = initialized;
    if (!initialized) {
      debugState.reason = "LIFF SDK initialization failed.";
      if (typeof window !== "undefined") {
        window.__LINE_LIFF_DEBUG__ = debugState;
      }
      return { ready: false, reason: debugState.reason };
    }

    debugState.loggedIn = liff.isLoggedIn();
    if (!debugState.loggedIn) {
      debugState.reason = "LIFF user is not logged in.";
      if (typeof window !== "undefined") {
        window.__LINE_LIFF_DEBUG__ = debugState;
      }
      return { ready: false, reason: debugState.reason };
    }

    debugState.inClient = liff.isInClient();

    const profile = await liff.getProfile();
    debugState.ready = true;
    debugState.reason = "LIFF authentication succeeded.";
    if (typeof window !== "undefined") {
      window.__LINE_LIFF_DEBUG__ = debugState;
    }
    return {
      ready: true,
      profile: {
        name: profile.displayName,
        lineId: profile.userId,
      },
    };
  } catch (error: any) {
    debugState.reason = error?.message || "LIFF authorization check failed.";
    if (typeof window !== "undefined") {
      window.__LINE_LIFF_DEBUG__ = debugState;
    }
    return { ready: false, reason: debugState.reason };
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
  const useLiffFlow = Boolean(liffId && isLiffEnvironmentAllowed());

  if (!useLiffFlow) {
    const lineText = formatQuoteForLineText(quotation);
    const consultationUrl = getLineConsultationUrl(config, lineText);
    try {
      window.open(consultationUrl, "_blank");
    } catch {
      window.location.href = consultationUrl;
    }

    return {
      success: true,
      method: "deeplink",
      message: "已開啟 LINE 官方對話框，請在對話框點擊送出即可由小編為您服務。",
    };
  }

  try {
    const hasReadyLiffSession = await ensureLiffSession(liffId);
    if (!hasReadyLiffSession) {
      const lineText = formatQuoteForLineText(quotation);
      const consultationUrl = getLineConsultationUrl(config, lineText);
      window.open(consultationUrl, "_blank");

      return {
        success: true,
        method: "deeplink",
        message: "LIFF 尚未完成授權，已改為開啟 LINE 官方對話框。",
      };
    }

    const profile = await liff.getProfile();
    console.info("LIFF profile acquired before send:", profile);

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
  } catch (error: any) {
    console.warn("LIFF send flow failed:", error);
    const lineText = formatQuoteForLineText(quotation);
    const consultationUrl = getLineConsultationUrl(config, lineText);
    window.open(consultationUrl, "_blank");

    return {
      success: true,
      method: "deeplink",
      message: "LINE 授權流程未完成，已改為開啟官方對話框。",
    };
  }
}
