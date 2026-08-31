import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Plus, 
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Product } from "../types";
import { formatNTD, formatImageUrl } from "../utils/formatters";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { ImageWithFallback } from "./ImageWithFallback";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  inCartCount: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);

  // Swipe / Drag state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const thumbnailsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const images = product?.images && product.images.length > 0 ? product.images : [];
  const currentImg = formatImageUrl(images[selectedImgIndex]?.src);

  useBodyScrollLock(isOpen);

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      setSelectedImgIndex(0);
      setQty(1);
      setIsImageViewerOpen(false);
      setViewerScale(1);
    }
  }, [product?.id, isOpen]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current && thumbnailsContainerRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedImgIndex]);

  useEffect(() => {
    if (!isImageViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsImageViewerOpen(false);
      if (e.key === "ArrowLeft") {
        setSelectedImgIndex((prev) =>
          images.length > 0 ? (prev > 0 ? prev - 1 : images.length - 1) : prev
        );
      }
      if (e.key === "ArrowRight") {
        setSelectedImgIndex((prev) =>
          images.length > 0 ? (prev < images.length - 1 ? prev + 1 : 0) : prev
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageViewerOpen, product?.id]);

  if (!isOpen || !product) return null;

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length <= 1) return;
    setSelectedImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length <= 1) return;
    setSelectedImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleZoom = (nextScale: number) => {
    const safeScale = Math.min(3, Math.max(1, nextScale));
    setViewerScale(safeScale);
  };

  const getTouchDistance = (touchA: React.Touch, touchB: React.Touch) => {
    return Math.hypot(
      touchA.clientX - touchB.clientX,
      touchA.clientY - touchB.clientY,
    );
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchStartDistance.current = getTouchDistance(e.touches[0], e.touches[1]);
      return;
    }

    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistance.current) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const nextScale = viewerScale * (distance / pinchStartDistance.current);
      handleZoom(nextScale);
      pinchStartDistance.current = distance;
      return;
    }

    if (e.touches.length === 1 && touchStartX.current !== null) {
      touchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      pinchStartDistance.current = null;
    }

    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current !== null && e.changedTouches[0] 
      ? Math.abs(touchStartY.current - e.changedTouches[0].clientY) 
      : 0;

    // Trigger only if horizontal swipe exceeds 35px and is predominantly horizontal
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > deltaY * 1.2) {
      if (deltaX > 0) {
        // Swiped Left -> Next image
        handleNextImage();
      } else {
        // Swiped Right -> Previous image
        handlePrevImage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
  };

  // Mouse drag handlers for desktop swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchEndX.current = null;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (touchStartX.current === null || touchEndX.current === null) return;

    const deltaX = touchStartX.current - touchEndX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleViewerWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(viewerScale + delta);
  };

  const handleAdd = () => {
    if (!product.in_stock) return;

    onAddToCart(product, qty);
    setQty(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain p-2 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs">
      <div 
        id="product-detail-modal"
        className="relative w-full max-w-2xl bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden shadow-2xl text-[#2D2D2D] max-h-[92vh] flex flex-col select-none sm:select-auto"
      >
        {/* Top Header Bar with Close Button */}
        <div className="absolute top-3 right-3 z-30">
          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            className="p-2 rounded-sm bg-white/90 hover:bg-[#F0EEE6] text-[#6E6A5E] hover:text-[#2D2D2D] transition cursor-pointer border border-[#E5E2D9] shadow-xs"
            aria-label="關閉視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* 1. Product Image Showcase with Swipe Support */}
          <div className="bg-[#F0EEE6] p-4 sm:p-6 sm:pb-5 border-b border-[#E5E2D9] flex flex-col items-center">
            <div 
              className="relative w-full max-w-md aspect-square max-h-[320px] sm:max-h-[380px] flex items-center justify-center rounded-xs bg-white p-4 sm:p-6 border border-[#E5E2D9] shadow-xs touch-pan-y cursor-grab active:cursor-grabbing group overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <ImageWithFallback
                key={`detail-img-${selectedImgIndex}-${currentImg}`}
                src={currentImg}
                alt={product.name}
                className="w-full h-full object-contain cursor-zoom-in animate-img-fade"
                fallbackClassName="flex h-full w-full items-center justify-center text-[#8A8576]"
                iconClassName="w-12 h-12 text-[#7C8B7C]"
                onClick={() => setIsImageViewerOpen(true)}
                draggable={false}
              />

              {product.isOnHot && (
                <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs bg-rose-700 text-white">
                  熱銷推薦
                </span>
              )}
            </div>

            {/* Thumbnail list if multiple */}
            {images.length > 1 && (
              <div 
                ref={thumbnailsContainerRef}
                className="thumbnail-scroll w-full max-w-md mt-3 sm:mt-4 overflow-x-auto py-1 px-1 scroll-smooth"
              >
                <div className="flex gap-2 w-max min-w-full justify-center px-1 pb-1">
                  {images.map((img, idx) => {
                    const isSelected = selectedImgIndex === idx;
                    return (
                      <button
                        key={`thumb-${idx}-${img.id || ''}`}
                        ref={isSelected ? activeThumbnailRef : null}
                        onClick={() => setSelectedImgIndex(idx)}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xs p-1 bg-white border transition overflow-hidden cursor-pointer shrink-0 ${
                          isSelected
                            ? "border-[#7C8B7C] ring-2 ring-[#7C8B7C]/30"
                            : "border-[#E5E2D9] hover:border-[#D1C9BC] opacity-60 hover:opacity-100"
                        }`}
                        aria-label={`切換至第 ${idx + 1} 張圖片`}
                      >
                        <ImageWithFallback
                          src={formatImageUrl(img.src)}
                          alt="thumbnail"
                          className="w-full h-full object-contain pointer-events-none"
                          fallbackClassName="flex h-full w-full items-center justify-center text-[#8A8576]"
                          iconClassName="w-5 h-5 text-[#7C8B7C]"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Product Details & Specifications */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* SKU, Category & Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs bg-white text-[#8A8576] border border-[#E5E2D9]">
                {product.sku}
              </span>
              {product.categories.map((c, idx) => (
                <span
                  key={`cat-${idx}-${c.id || c.name}`}
                  className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-xs bg-white text-[#7C8B7C] border border-[#E5E2D9]"
                >
                  {c.name}
                </span>
              ))}
              {product.tags && product.tags.length > 0 && product.tags.map((t, idx) => (
                <span
                  key={`tag-${idx}-${t.id || t.name}`}
                  className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-xs bg-white text-[#8A8576] border border-dashed border-[#E5E2D9]"
                >
                  #{t.name}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-light text-[#2D2D2D] leading-snug">
              {product.name}
            </h2>

            {/* Price Box */}
            <div className="bg-white p-3.5 sm:p-4 rounded-sm border border-[#E5E2D9] shadow-xs">
              <div className="flex items-baseline gap-3">
                <span className="text-[10px] text-[#8A8576] uppercase tracking-widest font-medium">售價</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#2D2D2D] tracking-tight">
                  {formatNTD(product.price)}
                </span>
                {product.regular_price > product.price && (
                  <span className="text-xs font-mono text-[#8A8576] line-through">
                    {formatNTD(product.regular_price)}
                  </span>
                )}
              </div>
              {!product.in_stock && (
                <div className="mt-2 text-xs font-medium text-rose-700">
                  目前缺貨，暫停加入諮詢清單
                </div>
              )}
              
            </div>

            {/* Description & Key Features */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-[#2D2D2D] uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7C8B7C]" />
                商品特點與介紹
              </h4>

              <div className="bg-white p-4 sm:p-5 rounded-sm border border-[#E5E2D9] shadow-xs space-y-3">
                {product.short_description && (
                  <p className="text-xs sm:text-sm text-[#2D2D2D] leading-relaxed font-normal pb-3 border-b border-[#E5E2D9]/80">
                    {product.short_description}
                  </p>
                )}

                {/* Bulleted Feature List */}
                <ul className="space-y-2.5">
                  {(product.features && product.features.length > 0
                    ? product.features
                    : (product.description || "").split("\n").map(s => s.replace(/^[•\-\*\s]+/, "").trim()).filter(Boolean)
                  ).map((feature, idx) => (
                    <li key={`feat-${idx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#6E6A5E] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C8B7C] shrink-0 mt-2" />
                      <span className="flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Attributes / Specifications */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-[#2D2D2D] uppercase tracking-[0.15em] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#7C8B7C]" />
                  產品規格與參數
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {product.attributes.map((attr, idx) => (
                    <div
                      key={`attr-${idx}-${attr.id || attr.name}`}
                      className="flex items-center justify-between p-2.5 rounded-xs bg-white border border-[#E5E2D9]"
                    >
                      <span className="text-[#8A8576] font-medium text-[11px]">{attr.name}</span>
                      <span className="text-[#2D2D2D] font-mono text-xs">{attr.terms.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Floating / Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-20 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E5E2D9] p-3 sm:p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center gap-2 sm:gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-white border border-[#E5E2D9] rounded-sm overflow-hidden text-[#2D2D2D] shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={!product.in_stock}
              className="w-9 sm:w-10 h-10 flex items-center justify-center hover:bg-[#F0EEE6] text-[#8A8576] hover:text-[#2D2D2D] transition cursor-pointer text-sm font-bold"
              aria-label="減少數量"
            >
              -
            </button>
            <span className="w-9 sm:w-10 text-center font-mono text-xs sm:text-sm font-bold">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(qty + 1)}
              disabled={!product.in_stock}
              className="w-9 sm:w-10 h-10 flex items-center justify-center hover:bg-[#F0EEE6] text-[#8A8576] hover:text-[#2D2D2D] transition cursor-pointer text-sm font-bold"
              aria-label="增加數量"
            >
              +
            </button>
          </div>

          {/* Add to Consultation List Button */}
          <button
            id="modal-add-to-quote-btn"
            onClick={handleAdd}
            disabled={!product.in_stock}
            className={`flex-1 h-10 px-4 sm:px-6 rounded-sm text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98 ${product.in_stock ? "cursor-pointer bg-[#7C8B7C] hover:bg-[#6A796A] text-white" : "cursor-not-allowed bg-[#D1CEC4] text-[#8A8576]"}`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {product.in_stock ? `加入諮詢清單 (${formatNTD(product.price * qty)})` : "暫無供應"}
            </span>
          </button>
        </div>

        {isImageViewerOpen && currentImg && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-3 pb-14 sm:p-8 sm:pb-16"
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} 圖片瀏覽器`}
            onClick={() => setIsImageViewerOpen(false)}
            onWheel={handleViewerWheel}
          >
            <button
              type="button"
              onClick={() => setIsImageViewerOpen(false)}
              className="absolute top-3 right-3 z-30 sm:top-6 sm:right-6 p-2.5 rounded-sm bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="關閉圖片瀏覽器"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage(e);
              }}
              className="hidden md:flex absolute left-3 lg:left-8 z-20 items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#2D2D2D]/85 hover:bg-[#2D2D2D] text-white shadow-lg transition cursor-pointer"
              aria-label="上一張圖片"
            >
              <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
            </button>

            <div
              className="relative z-10 flex max-h-[85vh] max-w-[85vw] items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <ImageWithFallback
                src={currentImg}
                alt={product.name}
                className="max-w-full max-h-[75vh] object-contain select-none animate-img-fade transition-transform duration-150 ease-out touch-none"
                fallbackClassName="flex max-h-[75vh] max-w-[85vw] items-center justify-center text-white"
                iconClassName="w-16 h-16"
                onClick={() => undefined}
                draggable={false}
                style={{
                  transform: `scale(${viewerScale})`,
                  transformOrigin: "center center",
                  willChange: "transform",
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  touchAction: "none",
                }}
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage(e);
              }}
              className="hidden md:flex absolute right-3 lg:right-8 z-20 items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#2D2D2D]/85 hover:bg-[#2D2D2D] text-white shadow-lg transition cursor-pointer"
              aria-label="下一張圖片"
            >
              <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
            </button>

            <span className="absolute bottom-3 sm:bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white font-mono">
              {selectedImgIndex + 1} / {images.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

