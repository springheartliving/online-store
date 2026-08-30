import React, { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { 
  ArrowUpDown, 
  Droplets, 
  ShoppingBag, 
} from "lucide-react";

import { Product, Category, CartItem, CustomerInfo, Quotation } from "./types";
import { Header } from "./components/Header";
import { CategoryNav } from "./components/CategoryNav";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { QuoteCalculator } from "./components/QuoteCalculator";
import { OrderHistoryModal } from "./components/OrderHistoryModal";
import { DEFAULT_LINE_CONFIG } from "./utils/formatters";
import { getLiffCustomer, logoutLiffSession, sendQuoteViaLiff } from "./utils/liff";
import { saveQuotationToGoogleSheet } from "./utils/googleSheets";
import { resolveProductCategories } from "./utils/categories";
import {
  fetchProductsFromFirestore,
  fetchCategoriesFromFirestore,
} from "./lib/firebase";



export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  // Cart & Quotation State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("springheart_cart") || localStorage.getItem("meetspa_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Line Official Account & LIFF Config
  const lineConfig = DEFAULT_LINE_CONFIG;
  const [customer, setCustomer] = useState<CustomerInfo>({ name: "", lineId: "" });

  // Order history
  const [orderHistory, setOrderHistory] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem("springheart_history") || localStorage.getItem("meetspa_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Line notify sending state
  const [isSendingLine, setIsSendingLine] = useState(false);
  const [isBindingLine, setIsBindingLine] = useState(false);
  const [lineNotifySuccess, setLineNotifySuccess] = useState<string | null>(null);
  const [lineNotifyError, setLineNotifyError] = useState<string | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("springheart_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Save order history locally for this browser
  const saveQuotationToHistory = (quote: Quotation) => {
    setOrderHistory((prev) => {
      const filtered = prev.filter((q) => q.quoteNo !== quote.quoteNo);
      const updated = [quote, ...filtered].slice(0, 50);
      try {
        localStorage.setItem("springheart_history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Load data from Firestore Database on mount
  useEffect(() => {
    async function loadFirestoreData() {
      // Fetch products and categories from Firestore
      try {
        const fsProducts = await fetchProductsFromFirestore();
        const fsCategories = await fetchCategoriesFromFirestore();

        if (fsProducts && fsProducts.length > 0) {
          setProducts(
            fsProducts.map((product) =>
              resolveProductCategories(product, fsCategories)
            )
          );
          setCart((prevCart) =>
            prevCart.map((item) => ({
              ...item,
              product: resolveProductCategories(item.product, fsCategories),
            }))
          );
        }
        if (fsCategories && fsCategories.length > 0) {
          setCategories(fsCategories);
        }
      } catch (err) {
        console.error("Error fetching Firestore products:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFirestoreData();
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!product.in_stock) return;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + quantity,
        };
        return next;
      } else {
        return [...prev, { product, quantity }];
      }
    });
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQty } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem("springheart_cart");
      localStorage.removeItem("meetspa_cart");
    } catch {}
  };

  const handleDeleteHistoryItem = (quoteNo: string) => {
    setOrderHistory((prev) => {
      const updated = prev.filter((q) => q.quoteNo !== quoteNo);
      try {
        localStorage.setItem("springheart_history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Calculate cart counts by category
  const productCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.is_published === false) return;

      p.categories.forEach((c) => {
        const categoryKey = String(c.id);
        counts[categoryKey] = (counts[categoryKey] || 0) + 1;
      });
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.is_published !== false);

    // Filter Category
    if (selectedCategory !== "all") {
      list = list.filter((p) =>
        p.categories.some(
          (c) => String(c.id) === selectedCategory
        )
      );
    }

    // Filter Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categories.some((c) => c.name.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "default") {
      list.sort((a, b) => {
        const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
        const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
        return orderA - orderB;
      });
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Cart item count map
  const inCartCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    cart.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [cart]);

  // Total cart estimate
  const totalCartAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const handleBindLineAccount = async () => {
    setIsBindingLine(true);
    setLineNotifyError(null);
    setLineNotifySuccess(null);

    try {
      const profile = await getLiffCustomer(lineConfig);
      if (profile) {
        setCustomer(profile);
        setLineNotifySuccess("已完成官方 LINE 綁定。");
        return;
      }

      setLineNotifyError("請在 LIFF 頁面內完成 LINE 授權後再綁定。");
    } catch (err: any) {
      setLineNotifyError(`LINE 綁定失敗: ${err.message || "請再試一次。"}`);
    } finally {
      setIsBindingLine(false);
    }
  };

  const handleUnbindLineAccount = async () => {
    setIsBindingLine(true);
    setLineNotifyError(null);
    setLineNotifySuccess(null);

    try {
      const result = await logoutLiffSession();
      if (result) {
        setCustomer({ name: "", lineId: "" });
        setLineNotifySuccess("已解除 LINE 綁定，現在可重新取得授權。");
        return;
      }

      setLineNotifyError("解除綁定失敗，請再試一次。");
    } catch (err: any) {
      setLineNotifyError(`解除綁定失敗: ${err.message || "請再試一次。"}`);
    } finally {
      setIsBindingLine(false);
    }
  };

  const handleToggleLineBind = async () => {
    if (customer.name?.trim() || customer.lineId?.trim()) {
      await handleUnbindLineAccount();
      return;
    }

    await handleBindLineAccount();
  };

  // Handle Send LINE Consultation via LIFF / Deep Link
  const handleSendLineNotify = async (quotation: Quotation, customer: CustomerInfo) => {
    setIsSendingLine(true);
    setLineNotifySuccess(null);
    setLineNotifyError(null);

    try {
      let resolvedCustomer = customer;

      if (lineConfig.liffId?.trim()) {
        try {
          const profile = await getLiffCustomer(lineConfig);
          if (profile) {
            resolvedCustomer = profile;
            setCustomer(profile);
          }
        } catch {
          // Do not block the submission flow outside LIFF or when profile access fails.
        }
      }

      const quotationWithCustomer = { ...quotation, customer: resolvedCustomer };

      // Save quotation to local history
      saveQuotationToHistory(quotationWithCustomer);
      await saveQuotationToGoogleSheet(quotationWithCustomer);

      // Trigger celebratory visual effect
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.5 },
      });

      // Send via LIFF text message or Deep Link fallback
      const result = await sendQuoteViaLiff(quotationWithCustomer, lineConfig);

      if (result.success) {
        setLineNotifySuccess(result.message || "已為您產生商品清單並傳送至官方 LINE！");
        handleClearCart();
      } else {
        setLineNotifyError(result.message || "LINE 訊息傳送失敗，請稍後再試。 ");
      }
    } catch (err: any) {
      setLineNotifyError(`開啟 LINE 失敗: ${err.message}`);
    } finally {
      setIsSendingLine(false);
    }
  };

  // Handle re-adding quotation items to the active consultation cart
  const handleSelectQuoteFromHistory = (quote: Quotation) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      quote.items.forEach((item) => {
        const existingIdx = updatedCart.findIndex(
          (cartItem) => cartItem.product.id === item.id || cartItem.product.sku === item.sku
        );
        if (existingIdx >= 0) {
          updatedCart[existingIdx] = {
            ...updatedCart[existingIdx],
            quantity: updatedCart[existingIdx].quantity + item.quantity,
          };
        } else {
          const matchedProd = products.find((p) => p.id === item.id || p.sku === item.sku);
          if (matchedProd) {
            updatedCart.push({ product: matchedProd, quantity: item.quantity });
          } else {
            // Fallback synthetic product
            updatedCart.push({
              product: {
                id: item.id,
                name: item.name,
                sku: item.sku,
                price: item.price,
                regular_price: item.price,
                is_published: true,
                short_description: "",
                description: "",
                categories: [{ id: 0, name: "泉心生活", slug: "custom" }],
                tags: [],
                images: item.image ? [{ id: 0, src: item.image }] : [],
                attributes: [],
                in_stock: true,
                slug: `item-${item.id}`,
              },
              quantity: item.quantity,
            });
          }
        }
      });
      return updatedCart;
    });
    setIsCartOpen(true);
  };

  const handleResetToHome = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2D2D] flex flex-col font-sans selection:bg-[#7C8B7C] selection:text-white">
      
      {/* 1. Sticky Navigation & Filter Header */}
      <div className="sticky top-0 z-40 w-full shadow-xs">
        <Header
          cart={cart}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          totalAmount={totalCartAmount}
          onLogoClick={handleResetToHome}
        />

        {/* Category Filter Bar */}
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          productCountsByCategory={productCountsByCategory}
          totalProductsCount={products.filter((product) => product.is_published !== false).length}
        />
      </div>

      {/* 5. Filter & Sort Bar (Mobile Responsive Stack) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-2 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 rounded-sm border border-[#E5E2D9] text-xs">
          
          {/* Status info */}
          <div className="flex items-center gap-2 text-[#6E6A5E]">
            <span className="font-mono font-bold text-[#7C8B7C]">
              {filteredProducts.length}
            </span>
            <span className="uppercase tracking-wider text-[11px]">項商品展示中</span>
            {searchQuery && (
              <span className="text-[#8A8576] font-light truncate">
                (關鍵字：「{searchQuery}」)
              </span>
            )}
          </div>

          {/* Sort Controller */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[#8A8576] text-[11px] uppercase tracking-wider shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7C8B7C]" />
              <span>排序：</span>
            </div>
            
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <button
                id="sort-default-btn"
                onClick={() => setSortBy("default")}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider transition cursor-pointer text-center ${
                  sortBy === "default"
                    ? "bg-[#7C8B7C] text-white font-semibold"
                    : "bg-[#FAF9F6] text-[#6E6A5E] hover:text-[#2D2D2D] border border-[#E5E2D9]"
                }`}
              >
                推薦排序
              </button>

              <button
                id="sort-price-asc-btn"
                onClick={() => setSortBy("price-asc")}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider transition cursor-pointer text-center ${
                  sortBy === "price-asc"
                    ? "bg-[#7C8B7C] text-white font-semibold"
                    : "bg-[#FAF9F6] text-[#6E6A5E] hover:text-[#2D2D2D] border border-[#E5E2D9]"
                }`}
              >
                價格低至高
              </button>

              <button
                id="sort-price-desc-btn"
                onClick={() => setSortBy("price-desc")}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider transition cursor-pointer text-center ${
                  sortBy === "price-desc"
                    ? "bg-[#7C8B7C] text-white font-semibold"
                    : "bg-[#FAF9F6] text-[#6E6A5E] hover:text-[#2D2D2D] border border-[#E5E2D9]"
                }`}
              >
                價格高至低
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 6. Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 w-full">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 text-[#8A8576]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#7C8B7C] mb-3"></div>
            <span className="text-[11px] uppercase tracking-wider">載入最新商品中...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 sm:p-16 text-center bg-white rounded-sm border border-dashed border-[#E5E2D9] max-w-lg mx-auto my-8 sm:my-12">
            <Droplets className="w-10 sm:w-12 h-10 sm:h-12 text-[#8A8576] mx-auto mb-3" />
            <h3 className="text-base font-light text-[#2D2D2D]">找不到符合條件的商品</h3>
            <p className="text-xs text-[#8A8576] mt-1 mb-4">
              請嘗試調整分類或搜尋關鍵字（如：水療、氣泡、精油、沐浴鹽、洗髮精）。
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-sm bg-[#7C8B7C] hover:bg-[#6A796A] text-white text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
            >
              重設所有篩選
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={`prod-${product.id}-${idx}`}
                product={product}
                inCartCount={inCartCountMap[product.id] || 0}
                onAddToCart={handleAddToCart}
                onQuickView={setSelectedProductForDetail}
              />
            ))}
          </div>
        )}
      </main>

      {/* 7. Floating Bottom Consultation Bar (Visible when cart has items) */}
      {cart.length > 0 && !isCartOpen && (
        <aside
          aria-label="即時諮詢清單摘要"
          id="floating-quote-bar"
          className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl bg-white/95 backdrop-blur-md border border-[#E5E2D9] p-3 sm:p-3.5 rounded-sm shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xs bg-[#7C8B7C] flex items-center justify-center text-white font-mono font-bold text-xs sm:text-sm shadow-xs shrink-0">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#8A8576]">諮詢清單：{cart.length} 項商品</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-[#2D2D2D] truncate">
                總金額：<span className="text-[#7C8B7C]">NT$ {totalCartAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm bg-[#2D2D2D] hover:bg-[#1f1f1f] text-white text-[11px] sm:text-xs uppercase tracking-[0.1em] font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-98"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>查看諮詢清單</span>
            </button>
          </div>
        </aside>
      )}

      {/* 8. Footer - Geometric Balance theme with safe bottom clearance for floating bar */}
      <footer className={`bg-[#E5E2D9] border-t border-[#D1CEC4] text-[#8A8576] pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 text-[11px] tracking-wider transition-all ${
        cart.length > 0 ? "pb-24 sm:pb-28" : "pb-6 sm:pb-8"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <div className="text-[#8A8576]">
            <span>© 2026 泉心生活 Spring Heart Living. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
        inCartCount={selectedProductForDetail ? inCartCountMap[selectedProductForDetail.id] || 0 : 0}
      />

      <QuoteCalculator
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        customer={customer}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onBindLine={handleToggleLineBind}
        onSendLineNotify={handleSendLineNotify}
        isBindingLine={isBindingLine}
        isSendingLine={isSendingLine}
        lineNotifySuccess={lineNotifySuccess}
        lineNotifyError={lineNotifyError}
      />

      <OrderHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={orderHistory}
        onSelectQuote={handleSelectQuoteFromHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />

    </div>
  );
}
