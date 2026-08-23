import React, { useState } from "react";
import { Plus, Check, Eye, Sparkles, Layers } from "lucide-react";
import { Product } from "../types";
import { formatNTD } from "../utils/formatters";

interface ProductCardProps {
  product: Product;
  inCartCount: number;
  onAddToCart: (product: Product, quantity: number) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  inCartCount,
  onAddToCart,
  onQuickView,
}) => {
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const imageSrc = product.images?.[0]?.src || "";
  const primaryCategory = product.categories?.[0]?.name || "養生美學";

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onQuickView(product)}
      className="group bg-white border border-[#E5E2D9] rounded-sm p-3.5 sm:p-5 flex flex-col justify-between hover:border-[#7C8B7C]/60 hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Area */}
      <div>
        <div className="relative aspect-[4/3] w-full bg-[#F0EEE6] flex items-center justify-center overflow-hidden rounded-xs p-3 mb-3">
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>

          {imageSrc && !imgError ? (
            <img
              src={imageSrc}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#8A8576] p-4 text-center">
              <Sparkles className="w-8 h-8 text-[#7C8B7C] mb-1.5" />
              <span className="text-[10px] font-mono tracking-widest">{product.sku}</span>
              <span className="text-[11px] font-serif italic text-[#6E6A5E] mt-0.5">泉心生活 精品</span>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-20">
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-xs bg-white/90 backdrop-blur-xs text-[#7C8B7C] border border-[#E5E2D9]">
              {primaryCategory}
            </span>
            {product.isOnSale && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs bg-[#2D2D2D] text-white">
                熱銷推薦
              </span>
            )}
          </div>

          {/* SKU Badge Top Right */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-xs bg-white/80 backdrop-blur-xs text-[#8A8576] border border-[#E5E2D9]">
              {product.sku}
            </span>
          </div>

          {/* Quick View overlay button */}
          <div className="absolute inset-0 m-auto w-24 h-8 rounded-sm bg-[#2D2D2D]/90 text-white text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-20 hidden sm:flex">
            <Eye className="w-3 h-3" />
            <span>商品詳情</span>
          </div>
        </div>

        {/* Product Content */}
        <div>
          <h3
            className="text-sm sm:text-base font-serif italic text-[#2D2D2D] line-clamp-2 group-hover:text-[#7C8B7C] transition-colors leading-snug mb-1.5"
            title={product.name}
          >
            {product.name}
          </h3>

          {product.short_description ? (
            <p className="text-xs text-[#8A8576] line-clamp-2 mb-2 leading-relaxed font-light">
              {product.short_description}
            </p>
          ) : (
            <p className="text-xs text-[#8A8576] line-clamp-2 mb-2 leading-relaxed font-light italic">
              泉心生活 Spring Heart Living 頂級水療與漢方養生系列，專為身心療癒設計。
            </p>
          )}

          {/* Attributes summary if any */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {product.attributes.slice(0, 2).map((attr, idx) => (
                <span
                  key={`pcard-attr-${idx}-${attr.id || attr.name}`}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-xs bg-[#FAF9F6] text-[#6E6A5E] border border-[#E5E2D9]"
                >
                  <Layers className="w-2.5 h-2.5 text-[#7C8B7C]" />
                  {attr.name}: {attr.terms.join(", ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price & Action Footer */}
      <div className="pt-2.5 border-t border-[#E5E2D9] mt-2">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <span className="text-[10px] text-[#8A8576] uppercase tracking-widest font-medium block">
              售價
            </span>
            <span className="font-mono font-bold text-base sm:text-lg text-[#2D2D2D] tracking-tight">
              {formatNTD(product.price)}
            </span>
          </div>
          {product.regular_price > product.price && (
            <span className="text-[11px] font-mono text-[#8A8576] line-through">
              {formatNTD(product.regular_price)}
            </span>
          )}
        </div>

        {/* Quantity Selector & Add to Inquiry Button (Touch friendly) */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden text-[#2D2D2D]">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-7 h-8 flex items-center justify-center hover:bg-[#F0EEE6] text-[#8A8576] hover:text-[#2D2D2D] transition cursor-pointer text-xs"
              aria-label="減少數量"
            >
              -
            </button>
            <span className="w-7 text-center font-mono text-xs font-bold">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(qty + 1)}
              className="w-7 h-8 flex items-center justify-center hover:bg-[#F0EEE6] text-[#8A8576] hover:text-[#2D2D2D] transition cursor-pointer text-xs"
              aria-label="增加數量"
            >
              +
            </button>
          </div>

          <button
            id={`add-to-inquiry-btn-${product.id}`}
            onClick={handleAdd}
            className={`flex-1 h-8 px-2.5 sm:px-3 rounded-sm text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              justAdded
                ? "bg-[#6A796A] text-white"
                : inCartCount > 0
                ? "bg-[#7C8B7C] text-white hover:bg-[#6A796A]"
                : "bg-[#7C8B7C] hover:bg-[#6A796A] text-white"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>已加入</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span>
                  {inCartCount > 0 ? `已選 (${inCartCount})` : "加入諮詢"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

