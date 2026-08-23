import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Plus, 
  Sparkles, 
  Layers
} from "lucide-react";
import { Product } from "../types";
import { formatNTD } from "../utils/formatters";

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

  // Swipe / Drag state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const thumbnailsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      setSelectedImgIndex(0);
      setQty(1);
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

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImg = images[selectedImgIndex]?.src || "";

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

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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

  const handleAdd = () => {
    onAddToCart(product, qty);
    setQty(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs">
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
              {currentImg ? (
                <img
                  key={`detail-img-${selectedImgIndex}-${currentImg}`}
                  src={currentImg}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none animate-img-fade"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#8A8576]">
                  <Sparkles className="w-12 h-12 text-[#7C8B7C] mb-2" />
                  <span className="text-xs font-mono tracking-wider">{product.sku}</span>
                  <span className="text-[11px] font-serif italic text-[#6E6A5E] mt-0.5">泉心生活 精品</span>
                </div>
              )}

              {product.isOnSale && (
                <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs bg-[#2D2D2D] text-white">
                  精選推薦
                </span>
              )}
            </div>

            {/* Thumbnail list if multiple */}
            {images.length > 1 && (
              <div 
                ref={thumbnailsContainerRef}
                className="w-full max-w-md mt-3 sm:mt-4 overflow-x-auto py-1 px-1 no-scrollbar scroll-smooth"
              >
                <div className="flex gap-2 w-max min-w-full justify-center px-1">
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
                        <img
                          src={img.src}
                          alt="thumbnail"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain pointer-events-none"
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
            {/* Category & SKU */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.categories.map((c, idx) => (
                <span
                  key={`cat-${idx}-${c.id || c.name}`}
                  className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-xs bg-white text-[#7C8B7C] border border-[#E5E2D9]"
                >
                  {c.name}
                </span>
              ))}
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs bg-white text-[#8A8576] border border-[#E5E2D9]">
                SKU: {product.sku}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-serif italic text-[#2D2D2D] leading-snug">
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
            className="flex-1 h-10 px-4 sm:px-6 rounded-sm text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs bg-[#7C8B7C] hover:bg-[#6A796A] text-white active:scale-98"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">加入諮詢清單 ({formatNTD(product.price * qty)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

