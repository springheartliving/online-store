import React, { useRef, useEffect } from "react";
import { 
  Grid, 
  Droplets, 
  HeartPulse, 
  Sparkles, 
  Sparkle, 
  Home, 
  Flame 
} from "lucide-react";
import { Category } from "../types";

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  productCountsByCategory: Record<string, number>;
  totalProductsCount?: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  productCountsByCategory,
  totalProductsCount,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Auto scroll active category tab into view, or reset to 0 when 'all'
  useEffect(() => {
    if (selectedCategory === "all") {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      }
    } else if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedCategory]);

  const getCategoryIcon = (name: string) => {
    if (name.includes("水療") || name.includes("設備")) return <Droplets className="w-4 h-4" />;
    if (name.includes("香氛") || name.includes("沐浴") || name.includes("精油")) return <Sparkles className="w-4 h-4" />;
    if (name.includes("養生") || name.includes("健康")) return <HeartPulse className="w-4 h-4" />;
    if (name.includes("護膚") || name.includes("美容")) return <Sparkle className="w-4 h-4" />;
    if (name.includes("清潔") || name.includes("家用")) return <Home className="w-4 h-4" />;
    return <Flame className="w-4 h-4" />;
  };

  const totalAll = totalProductsCount !== undefined
    ? totalProductsCount
    : Object.values(productCountsByCategory).reduce<number>(
        (a, b) => a + Number(b || 0),
        0
      );

  return (
    <nav 
      id="category-filter-nav"
      className="w-full bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E5E2D9] py-2.5 sm:py-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all"
    >
      <div 
        ref={scrollContainerRef}
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 category-scroll overflow-x-auto scroll-smooth py-0.5"
      >
        <div className="flex w-max min-w-full items-center justify-start gap-2 pb-1">
        
        {/* All Products Tab */}
        <button
          id="category-tab-all"
          ref={selectedCategory === "all" ? activeTabRef : null}
          onClick={() => onSelectCategory("all")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            selectedCategory === "all"
              ? "bg-[#7C8B7C] text-white shadow-xs"
              : "bg-white text-[#6E6A5E] hover:bg-[#F0EEE6] hover:text-[#2D2D2D] border border-[#E5E2D9]"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>全部商品</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
              selectedCategory === "all"
                ? "bg-[#6A796A] text-white"
                : "bg-[#F0EEE6] text-[#8A8576]"
            }`}
          >
            {totalAll}
          </span>
        </button>

        {/* Dynamic Category Tabs */}
        {categories.map((cat, idx) => {
          const categoryId = String(cat.id);
          const isSelected = selectedCategory === categoryId;
          const count = productCountsByCategory[categoryId] ?? 0;

          return (
            <button
              key={`category-tab-${cat.id || cat.slug || idx}-${idx}`}
              id={`category-tab-${cat.id}`}
              ref={isSelected ? activeTabRef : null}
              onClick={() => onSelectCategory(categoryId)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-[#7C8B7C] text-white shadow-xs"
                  : "bg-white text-[#6E6A5E] hover:bg-[#F0EEE6] hover:text-[#2D2D2D] border border-[#E5E2D9]"
              }`}
            >
              {getCategoryIcon(cat.name)}
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
                  isSelected
                    ? "bg-[#6A796A] text-white"
                    : "bg-[#F0EEE6] text-[#8A8576]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        </div>
      </div>
    </nav>
  );
};
