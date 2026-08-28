export interface Category {
  id: number | string;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  terms: string[];
}

export interface ProductImage {
  id: number;
  src: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  regular_price: number;
  is_published: boolean;
  isOnHot?: boolean;
  short_description: string;
  description: string;
  features?: string[];
  categories: { id: number | string; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  in_stock: boolean;
  sort_order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  lineId: string;
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
    image?: string;
  }[];
  totalAmount: number;
  customer: CustomerInfo;
}

export interface LineOfficialConfig {
  lineId: string;
  lineUrl?: string;
  liffId?: string;
  liffUrl?: string;
  useOaMessage?: boolean;
}

