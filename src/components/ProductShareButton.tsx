import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Facebook, Instagram, MessageCircle, Phone, Share2, X } from "lucide-react";
import { Product } from "../types";
import { formatImageUrl } from "../utils/formatters";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface ProductShareButtonProps {
  product: Product;
}

export const ProductShareButton: React.FC<ProductShareButtonProps> = ({ product }) => {
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const slug = product.slug || String(product.id);
  const baseUrl = (import.meta as any).env?.BASE_URL || "/";
  const staticShareSlugs = JSON.parse(
    document.getElementById("product-share-slugs")?.textContent || "[]"
  ) as string[];
  const hasPreviewPage = staticShareSlugs.includes(slug);
  const sharePath = hasPreviewPage
    ? `${baseUrl}product/${encodeURIComponent(slug)}`
    : baseUrl;
  const shareUrlObject = new URL(sharePath, window.location.origin);
  shareUrlObject.hash = `sym:${encodeURIComponent(product.sku)}`;
  const shareUrl = shareUrlObject.toString();
  const shareText = `${product.name}\n${shareUrl}`;
  const productImage = formatImageUrl(product.images?.[0]?.src);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const copyLink = async (successMessage = "連結已複製") => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus(successMessage);
    } catch {
      setStatus("複製失敗，請使用瀏覽器分享功能");
    }
  };

  const openShareUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const shareNatively = async (fallbackMessage: string) => {
    if (!navigator.share) {
      await copyLink(fallbackMessage);
      return;
    }
    try {
      await navigator.share({
        title: product.name,
        text: product.short_description || product.name,
        url: shareUrl,
      });
      setIsOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setStatus("分享失敗，請複製連結再分享");
      }
    }
  };

  const shareToInstagram = async () => {
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    await copyLink("連結已複製，請貼至 Instagram");
  };

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setStatus("");
          setIsOpen(true);
        }}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-[#E5E2D9] bg-white text-[#6E6A5E] transition hover:border-[#7C8B7C] hover:text-[#2D2D2D]"
        aria-label={`分享${product.name}`}
        title="分享商品"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {isOpen && createPortal((
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 sm:items-center sm:p-5"
          onClick={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`分享${product.name}`}
            className="flex max-h-[90vh] max-h-[90dvh] w-full max-w-xl flex-col overflow-y-auto overscroll-contain rounded-t-sm border border-[#E5E2D9] bg-[#FAF9F6] pb-[max(env(safe-area-inset-bottom),1rem)] text-[#2D2D2D] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="relative flex min-h-14 items-center justify-center border-b border-[#E5E2D9] px-12">
              <h2 className="text-sm font-semibold tracking-wide text-[#2D2D2D]">分享商品</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm text-[#6E6A5E] transition hover:bg-[#F0EEE6] hover:text-[#2D2D2D]"
                aria-label="關閉分享視窗"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex items-center gap-3 border-b border-[#E5E2D9] px-4 py-4 sm:px-6">
              {productImage && (
                <img
                  src={productImage}
                  alt={product.name}
                  className="h-14 w-14 shrink-0 rounded-sm border border-[#E5E2D9] bg-white object-contain p-1"
                />
              )}
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                {product.short_description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8A8576]">
                    {product.short_description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 px-3 py-5 sm:px-6">
              <button
                type="button"
                onClick={() => openShareUrl(`https://line.me/R/share?text=${encodeURIComponent(shareText)}`)}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-sm py-2 text-xs text-[#6E6A5E] transition hover:bg-[#F0EEE6] hover:text-[#2D2D2D]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DED4] bg-[#E8EDE5] text-[#52745D]">
                  <MessageCircle className="h-7 w-7" />
                </span>
                LINE
              </button>
              <button
                type="button"
                onClick={() => void shareNatively("此裝置不支援直接分享，已複製連結")}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-sm py-2 text-xs text-[#6E6A5E] transition hover:bg-[#F0EEE6] hover:text-[#2D2D2D]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DED4] bg-[#E8EDE5] text-[#52745D]">
                  <MessageCircle className="h-7 w-7" />
                </span>
                Messenger
              </button>
              <button
                type="button"
                onClick={() => openShareUrl(`https://wa.me/?text=${encodeURIComponent(shareText)}`)}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-sm py-2 text-xs text-[#6E6A5E] transition hover:bg-[#F0EEE6] hover:text-[#2D2D2D]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DED4] bg-[#E8EDE5] text-[#52745D]">
                  <Phone className="h-6 w-6" />
                </span>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-sm py-2 text-xs text-[#6E6A5E] transition hover:bg-[#F0EEE6] hover:text-[#2D2D2D]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DED4] bg-[#E8EDE5] text-[#52745D]">
                  <Facebook className="h-7 w-7" />
                </span>
                Facebook
              </button>
              <button
                type="button"
                onClick={() => void shareToInstagram()}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-sm py-2 text-xs text-[#6E6A5E] transition hover:bg-[#F0EEE6] hover:text-[#2D2D2D]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DED4] bg-[#E8EDE5] text-[#52745D]">
                  <Instagram className="h-7 w-7" />
                </span>
                Instagram
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-[#E5E2D9] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-sm border border-[#E5E2D9] bg-white px-3 text-sm text-[#6E6A5E] transition hover:border-[#7C8B7C] hover:text-[#2D2D2D]"
              >
                <Copy className="h-4 w-4" />
                複製連結
              </button>
              <button
                type="button"
                onClick={() => void shareNatively("此裝置不支援更多分享方式，已複製連結")}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-sm border border-[#E5E2D9] bg-white px-3 text-sm text-[#6E6A5E] transition hover:border-[#7C8B7C] hover:text-[#2D2D2D]"
              >
                <Share2 className="h-4 w-4" />
                更多
              </button>
            </div>
            {status && <p className="pb-3 text-center text-sm text-[#6E6A5E]" role="status">{status}</p>}
          </section>
        </div>
      ), document.body)}
    </>
  );
};