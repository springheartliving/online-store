import React, { useState, useMemo } from "react";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Calculator, 
  MessageSquare, 
  Check, 
  FileText,
  Sparkles
} from "lucide-react";
import { CartItem, CustomerInfo, Quotation, LineOfficialConfig } from "../types";
import { formatNTD, generateQuoteNumber } from "../utils/formatters";

interface QuoteCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  lineConfig: LineOfficialConfig;
  onUpdateQuantity: (productId: number, newQty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onSendLineNotify: (quotation: Quotation, customer: CustomerInfo) => void;
  isSendingLine: boolean;
  lineNotifySuccess: string | null;
  lineNotifyError: string | null;
}

export const QuoteCalculator: React.FC<QuoteCalculatorProps> = ({
  isOpen,
  onClose,
  cart,
  lineConfig,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSendLineNotify,
  isSendingLine,
  lineNotifySuccess,
  lineNotifyError,
}) => {

  // Dynamic calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalAmount = subtotal;

  const emptyCustomer: CustomerInfo = useMemo(() => ({
    name: "",
    phone: "",
    email: "",
    lineId: "",
    address: "",
    taxId: "",
    companyTitle: "",
    notes: "",
  }), []);

  // Build Quotation payload
  const currentQuotation: Quotation = useMemo(() => {
    return {
      quoteNo: generateQuoteNumber(),
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        quantity: item.quantity,
        category: item.product.categories?.[0]?.name || "泉心生活",
        image: item.product.images?.[0]?.src,
      })),
      subtotal,
      discountRate: 0,
      discountAmount: 0,
      shippingMethod: "專人洽詢",
      shippingFee: 0,
      includeTax: false,
      taxAmount: 0,
      totalAmount,
      customer: emptyCustomer,
      status: "draft",
    };
  }, [cart, subtotal, totalAmount, emptyCustomer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs overflow-hidden">
      <div 
        id="quote-calculator-drawer"
        className="w-full max-w-2xl bg-[#FAF9F6] text-[#2D2D2D] h-full flex flex-col shadow-2xl border-l border-[#E5E2D9] animate-in slide-in-from-right duration-300"
      >
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#E5E2D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-sm bg-[#F0EEE6] text-[#7C8B7C] border border-[#E5E2D9]">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif italic text-[#2D2D2D] flex items-center gap-2">
                商品選購與諮詢清單
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#F0EEE6] text-[#7C8B7C] border border-[#E5E2D9]">
                  {cart.length} ITEMS
                </span>
              </h2>
              <p className="text-xs text-[#8A8576] font-light mt-0.5">
                瀏覽您喜愛的商品
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-quote-drawer-btn"
              onClick={onClose}
              className="p-2 rounded-sm bg-[#F0EEE6] hover:bg-[#E5E2D9] text-[#6E6A5E] hover:text-[#2D2D2D] transition cursor-pointer"
              title="關閉清單"
              aria-label="關閉清單"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Item List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#2D2D2D] uppercase tracking-[0.15em] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#7C8B7C]" />
                諮詢商品明細
              </h3>
              <span className="text-[11px] text-[#8A8576] font-light">
                可自由調整數量或刪除品項
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-sm border border-dashed border-[#E5E2D9]">
                <Sparkles className="w-8 h-8 text-[#7C8B7C] mx-auto mb-2" />
                <p className="text-sm font-serif italic text-[#2D2D2D]">
                  諮詢清單目前尚無商品
                </p>
                <p className="text-xs text-[#8A8576] mt-1 font-light">
                  請在商品展示區瀏覽並點擊「加入諮詢」以整理選購清單與專人洽詢。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => {
                  const itemTotal = item.product.price * item.quantity;
                  return (
                    <div
                      key={`cart-item-${item.product.id}-${idx}`}
                      id={`cart-item-${item.product.id}`}
                      className="p-3.5 sm:p-4 rounded-sm bg-white border border-[#E5E2D9] group hover:border-[#7C8B7C]/60 transition flex flex-col gap-3 shadow-xs"
                    >
                      {/* Top Row: Thumbnail + Product Details + Delete Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {item.product.images?.[0]?.src ? (
                            <img
                              src={item.product.images[0].src}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xs object-contain bg-[#F0EEE6] p-1 border border-[#E5E2D9] shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xs bg-[#F0EEE6] flex items-center justify-center text-[#7C8B7C] text-[10px] font-mono shrink-0 border border-[#E5E2D9]">
                              SPA
                            </div>
                          )}

                          <div className="flex-1 min-w-0 pr-1">
                            <h4 className="text-xs sm:text-sm font-serif font-medium text-[#2D2D2D] leading-snug group-hover:text-[#7C8B7C] transition-colors break-words">
                              {item.product.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#8A8576] mt-1">
                              {item.product.sku && (
                                <span className="font-mono bg-[#F0EEE6] px-1.5 py-0.5 rounded-xs text-[10px] text-[#6E6A5E]">
                                  {item.product.sku}
                                </span>
                              )}
                              <span className="font-mono text-[#6E6A5E]">
                                單價 {formatNTD(item.product.price)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1.5 -mr-1 -mt-1 text-[#8A8576] hover:text-rose-600 hover:bg-rose-50 rounded-xs transition cursor-pointer shrink-0"
                          title="移除此項"
                          aria-label={`移除 ${item.product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bottom Row: Quantity Stepper & Clear Subtotal Price */}
                      <div className="pt-2.5 border-t border-[#F0EEE6] flex items-center justify-between gap-3 bg-[#FAF9F6]/60 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 px-3.5 sm:px-4 py-2.5 rounded-b-sm">
                        {/* Quantity Controller */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#8A8576] font-light hidden xs:inline">數量</span>
                          <div className="flex items-center bg-white border border-[#E5E2D9] rounded-sm overflow-hidden text-[#2D2D2D] shadow-2xs">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#F0EEE6] text-[#8A8576] hover:text-[#2D2D2D] transition cursor-pointer"
                              aria-label="減少數量"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-[#2D2D2D]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#F0EEE6] text-[#8A8576] hover:text-[#2D2D2D] transition cursor-pointer"
                              aria-label="增加數量"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total Subtotal */}
                        <div className="flex items-baseline gap-1.5 text-right">
                          <span className="text-[11px] text-[#8A8576] uppercase tracking-wider">小計</span>
                          <span className="text-sm sm:text-base font-mono font-bold text-[#2D2D2D] tracking-tight">
                            {formatNTD(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          {cart.length > 0 && (
            <div className="bg-white p-5 rounded-sm border border-[#E5E2D9] text-xs sm:text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#2D2D2D]">諮詢清單總計</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#2D2D2D] tracking-tight">
                  {formatNTD(totalAmount)}
                </span>
              </div>
            </div>
          )}



          {/* Notifications Feedback */}
          {lineNotifySuccess && (
            <div className="p-3.5 rounded-sm bg-[#F0EEE6] border border-[#7C8B7C] text-[#2D2D2D] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-[#7C8B7C] shrink-0" />
              <span>{lineNotifySuccess}</span>
            </div>
          )}

          {lineNotifyError && (
            <div className="p-3.5 rounded-sm bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lineNotifyError}</span>
            </div>
          )}

        </div>

        {/* Action Footer Buttons */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 bg-white border-t border-[#E5E2D9] space-y-2.5">
            <div>
              {/* Send to Official LINE Button (LIFF / Deep Link) */}
              <button
                id="send-line-notify-btn"
                type="button"
                onClick={() => onSendLineNotify(currentQuotation, emptyCustomer)}
                disabled={isSendingLine}
                className="w-full py-3 px-3 sm:px-4 rounded-sm bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer transition active:scale-98 disabled:opacity-60"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>LINE 官方諮詢</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
