import React from "react";
import { Sparkles, ShoppingBag, Bell, History, Search, MessageSquare } from "lucide-react";
import { CartItem } from "../types";
import { formatNTD } from "../utils/formatters";
import { BrandLogo } from "./BrandLogo";

interface HeaderProps {
  cart: CartItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCart: () => void;
  onOpenHistory: () => void;
  onSyncData?: () => void;
  isSyncing?: boolean;
  totalAmount: number;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cart,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenHistory,
  totalAmount,
  onLogoClick,
}) => {
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#E5E2D9] text-[#2D2D2D]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <button
            type="button"
            id="brand-logo-btn"
            onClick={onLogoClick}
            className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 text-left cursor-pointer group focus:outline-none transition-opacity hover:opacity-90 active:scale-[0.99]"
            aria-label="返回首頁與初始頂部"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#FAF8F2] group-hover:bg-[#F2EFE6] border border-[#E5E2D9] flex items-center justify-center rounded-sm shrink-0 shadow-xs transition-colors p-1">
              <BrandLogo className="w-full h-full text-[#2E4F2D] transition-transform group-hover:scale-105 duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif font-bold text-lg sm:text-2xl tracking-[0.08em] text-[#2D2D2D] group-hover:text-[#7C8B7C] transition-colors">
                  泉心生活
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#7C8B7C] font-mono font-medium hidden xs:inline">
                  SPRING HEART
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#8A8576] tracking-wider hidden sm:block font-light">
                Spring Heart Living
              </p>
            </div>
          </button>

          {/* Search bar (Desktop & Tablet) */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A8576] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-input-header"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜尋商品名稱、型號、SKU或草本成分..."
                className="w-full bg-[#FAF9F6] text-xs sm:text-sm text-[#2D2D2D] placeholder-[#8A8576] pl-10 pr-4 py-2 rounded-sm border border-[#E5E2D9] focus:outline-none focus:border-[#7C8B7C] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8576] hover:text-[#2D2D2D] px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* History Button */}
            <button
              id="order-history-btn"
              onClick={onOpenHistory}
              className="p-2 sm:px-3 sm:py-2 text-[11px] uppercase tracking-wider font-medium rounded-sm bg-[#FAF9F6] hover:bg-[#F0EEE6] text-[#6E6A5E] hover:text-[#2D2D2D] border border-[#E5E2D9] transition flex items-center gap-1.5 cursor-pointer"
              title="檢視諮詢清單紀錄"
            >
              <History className="w-3.5 h-3.5 text-[#8A8576]" />
              <span className="hidden md:inline">諮詢紀錄</span>
            </button>

            {/* Consultation Inquiry Drawer Trigger Button */}
            <button
              id="open-quote-drawer-btn"
              onClick={onOpenCart}
              className="relative px-3 sm:px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-sm bg-[#7C8B7C] hover:bg-[#6A796A] text-white shadow-xs transition flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-98"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">諮詢清單</span>
              <span className="xs:hidden">清單</span>
              {totalItemCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-[#2D2D2D] font-mono font-bold text-[10px] rounded-xs">
                  {totalItemCount}
                </span>
              )}
              {totalAmount > 0 && (
                <span className="hidden xl:inline text-[11px] font-mono text-white/90 pl-1.5 border-l border-white/30">
                  {formatNTD(totalAmount)}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Mobile Search bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A8576] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜尋商品名稱、型號、草本成分..."
              className="w-full bg-[#FAF9F6] text-xs text-[#2D2D2D] placeholder-[#8A8576] pl-9 pr-8 py-2 rounded-sm border border-[#E5E2D9] focus:outline-none focus:border-[#7C8B7C]"
            />
            {searchQuery && (
              <button
                id="clear-mobile-search-btn"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8576]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

