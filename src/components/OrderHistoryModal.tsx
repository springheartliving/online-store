import React, { useState } from "react";
import { 
  X, 
  History, 
  Calendar, 
  FileText, 
  Trash2, 
  Plus, 
  Share2,
  Eye,
  EyeOff
} from "lucide-react";
import { Quotation, LineOfficialConfig } from "../types";
import { formatNTD, DEFAULT_LINE_CONFIG, formatImageUrl } from "../utils/formatters";
import { sendQuoteViaLiff } from "../utils/liff";

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: Quotation[];
  onSelectQuote: (quote: Quotation) => void;
  onClearHistory: () => void;
  onDeleteItem?: (quoteNo: string) => void;
  lineConfig?: LineOfficialConfig;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuote,
  onClearHistory,
  onDeleteItem,
  lineConfig = DEFAULT_LINE_CONFIG,
}) => {
  const [expandedQuoteNo, setExpandedQuoteNo] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        id="order-history-modal"
        className="relative w-full max-w-2xl bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden shadow-2xl text-[#2D2D2D] p-6 sm:p-7 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9] mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-[#F0EEE6] text-[#7C8B7C] border border-[#E5E2D9]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif italic text-[#2D2D2D]">歷史商品諮詢紀錄</h3>
              <p className="text-xs text-[#8A8576] font-light mt-0.5">
                本機已儲存 {history.length} 筆商品諮詢單
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-history-modal-btn"
              onClick={onClose}
              className="p-2 rounded-sm bg-[#F0EEE6] hover:bg-[#E5E2D9] text-[#6E6A5E] hover:text-[#2D2D2D] transition cursor-pointer"
              title="關閉視窗"
              aria-label="關閉視窗"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="p-12 text-center text-[#8A8576] bg-white rounded-sm border border-dashed border-[#E5E2D9]">
              <FileText className="w-10 h-10 text-[#7C8B7C] mx-auto mb-2" />
              <p className="text-sm font-serif italic text-[#2D2D2D]">尚未有儲存的諮詢單</p>
              <p className="text-xs text-[#8A8576] mt-1 font-light">
                在諮詢清單中送出 LINE 諮詢或匯出圖檔時，系統將自動為您備份紀錄。
              </p>
            </div>
          ) : (
            history.map((quote, idx) => {
              const isExpanded = expandedQuoteNo === quote.quoteNo;
              return (
                <div
                  key={`hist-${quote.quoteNo}-${idx}`}
                  className="p-4 rounded-sm bg-white border border-[#E5E2D9] hover:border-[#7C8B7C]/60 transition flex flex-col shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#7C8B7C]">
                          {quote.quoteNo}
                        </span>
                        <span className="text-[11px] text-[#8A8576] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8A8576]" />
                          {new Date(quote.createdAt).toLocaleString("zh-TW")}
                        </span>
                      </div>
                      <div className="text-xs text-[#6E6A5E] font-light">
                        共 {quote.items.length} 項品項
                      </div>
                      <div className="text-sm font-mono font-bold text-[#2D2D2D] mt-1">
                        總計：{formatNTD(quote.totalAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E2D9] flex-nowrap overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedQuoteNo(isExpanded ? null : quote.quoteNo);
                        }}
                        className="px-2 sm:px-2.5 py-1.5 rounded-sm bg-[#FAF9F6] hover:bg-[#F0EEE6] text-[#6E6A5E] hover:text-[#2D2D2D] text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1 border border-[#E5E2D9] transition cursor-pointer shrink-0"
                        title={isExpanded ? "收合明細" : "查看明細"}
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-[#8A8576]" />
                            <span className="whitespace-nowrap">收合</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-[#7C8B7C]" />
                            <span className="whitespace-nowrap">明細</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sendQuoteViaLiff(quote, lineConfig);
                        }}
                        className="px-2 sm:px-2.5 py-1.5 rounded-sm bg-white hover:bg-[#F0EEE6] text-[#7C8B7C] text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1 border border-[#E5E2D9] transition cursor-pointer shrink-0"
                        title="LINE LIFF 諮詢傳送"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#7C8B7C]" />
                        <span className="whitespace-nowrap">LINE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectQuote(quote);
                          onClose();
                        }}
                        className="px-2 sm:px-2.5 py-1.5 rounded-sm bg-[#7C8B7C] hover:bg-[#6A796A] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-xs shrink-0"
                        title="重新加入諮詢清單"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap">重新加入</span>
                      </button>

                      {onDeleteItem && (
                        <button
                          type="button"
                          onClick={() => onDeleteItem(quote.quoteNo)}
                          className="p-1.5 rounded-sm bg-white hover:bg-rose-50 text-[#8A8576] hover:text-rose-600 border border-[#E5E2D9] hover:border-rose-200 transition cursor-pointer shrink-0"
                          title="刪除此筆紀錄"
                          aria-label="刪除此筆紀錄"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Item Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#E5E2D9]/80 bg-[#FAF9F6] p-3 rounded-sm text-xs space-y-2 animate-in fade-in duration-200">
                      <div className="font-semibold text-[#6E6A5E] uppercase tracking-wider text-[10px]">
                        諮詢商品明細
                      </div>
                      <div className="divide-y divide-[#E5E2D9]/60 max-h-48 overflow-y-auto pr-1">
                        {quote.items.map((item, itemIdx) => (
                          <div
                            key={`${quote.quoteNo}-item-${itemIdx}`}
                            className="py-2.5 flex justify-between items-center gap-4 text-[11px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {item.image ? (
                                <img
                                  src={formatImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-8 h-8 object-cover rounded-xs border border-[#E5E2D9] shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xs bg-[#E5E2D9] flex items-center justify-center text-[#8A8576] text-[10px] shrink-0">
                                  商品
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-[#2D2D2D] block line-clamp-2 leading-tight break-words">{item.name}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono">
                              <span className="text-[#8A8576] mr-2">x{item.quantity}</span>
                              <span className="font-bold text-[#2D2D2D]">{formatNTD(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
