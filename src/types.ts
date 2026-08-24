export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  count?: number;
  image?: {
    id: number;
    src: string;
    thumbnail?: string;
  };
}

export interface ProductAttribute {
  id: number;
  name: string;
  terms: string[];
}

export interface ProductImage {
  id: number;
  src: string;
  thumbnail?: string;
  alt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  permalink?: string;
  price: number;
  regular_price: number;
  sale_price?: number | null;
  isOnSale?: boolean;
  currency: string;
  currency_symbol: string;
  short_description: string;
  description: string;
  features?: string[];
  raw_short_description?: string;
  raw_description?: string;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  in_stock: boolean;
  has_options?: boolean;
  sort_order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customNote?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  lineId: string;
  address: string;
  taxId?: string; // 統一編號
  companyTitle?: string; // 公司抬頭
  notes: string;
}

export interface Quotation {
  quoteNo: string;
  createdAt: string;
  items: {
    id: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    category: string;
    image?: string;
  }[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  couponCode?: string;
  shippingMethod: string;
  shippingFee: number;
  includeTax: boolean;
  taxAmount: number;
  totalAmount: number;
  customer: CustomerInfo;
  status?: "draft" | "submitted" | "confirmed";
}

export interface LineOfficialConfig {
  lineId: string;
  lineUrl?: string;
  liffId?: string;
  liffUrl?: string;
  useOaMessage?: boolean;
}

export interface LineNotifyConfig {
  userToken: string;
  isConfigured: boolean;
  lastTestStatus?: "success" | "error" | null;
  lastTestMessage?: string;
}
