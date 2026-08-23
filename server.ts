import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load cached or scraped product data
const dataDir = path.join(process.cwd(), "src", "data");
const productsFile = path.join(dataDir, "products.json");
const categoriesFile = path.join(dataDir, "categories.json");

function getProducts() {
  try {
    if (fs.existsSync(productsFile)) {
      return JSON.parse(fs.readFileSync(productsFile, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading products.json:", err);
  }
  return [];
}

function getCategories() {
  try {
    if (fs.existsSync(categoriesFile)) {
      return JSON.parse(fs.readFileSync(categoriesFile, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading categories.json:", err);
  }
  return [];
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Get structured products
app.get("/api/products", (req, res) => {
  const products = getProducts();
  const { category, search, minPrice, maxPrice } = req.query;

  let filtered = products;

  if (category && typeof category === "string" && category !== "all") {
    filtered = filtered.filter((p: any) =>
      p.categories.some((c: any) => c.slug === category || c.name === category)
    );
  }

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) filtered = filtered.filter((p: any) => p.price >= min);
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) filtered = filtered.filter((p: any) => p.price <= max);
  }

  res.json({
    success: true,
    total: filtered.length,
    products: filtered,
    source: "https://meetspa.lohastime.com.tw/"
  });
});

// API: Get categories
app.get("/api/categories", (req, res) => {
  const categories = getCategories();
  res.json({
    success: true,
    categories
  });
});

// API: Sync / Refetch live data from meetspa.lohastime.com.tw
app.post("/api/sync-data", async (req, res) => {
  try {
    const catRes = await fetch("https://meetspa.lohastime.com.tw/wp-json/wc/store/v1/products/categories?per_page=100", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    let categories: any[] = [];
    if (catRes.ok) {
      categories = await catRes.json();
    }

    let products: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const prodRes = await fetch(`https://meetspa.lohastime.com.tw/wp-json/wc/store/v1/products?per_page=50&page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!prodRes.ok) break;
      const pageProducts = await prodRes.json();
      if (!Array.isArray(pageProducts) || pageProducts.length === 0) break;
      products.push(...pageProducts);
      const totalPages = prodRes.headers.get("x-wp-totalpages");
      if (totalPages && page >= parseInt(totalPages, 10)) {
        hasMore = false;
      } else {
        page++;
      }
    }

    const cleanHtml = (str: string) => {
      if (!str) return "";
      return str.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#8211;/g, "-").replace(/\s+/g, " ").trim();
    };

    const processed = products.map((p: any) => {
      const rawPrice = p.prices?.price ? parseInt(p.prices.price, 10) / Math.pow(10, p.prices.currency_minor_unit || 0) : 0;
      const rawRegPrice = p.prices?.regular_price ? parseInt(p.prices.regular_price, 10) / Math.pow(10, p.prices.currency_minor_unit || 0) : rawPrice;
      const rawSalePrice = p.prices?.sale_price ? parseInt(p.prices.sale_price, 10) / Math.pow(10, p.prices.currency_minor_unit || 0) : null;

      let price = rawPrice;
      if (price === 0) {
        const match = (p.description || "").match(/NT\$?\s*([0-9,]+)/i) || (p.short_description || "").match(/NT\$?\s*([0-9,]+)/i);
        if (match) price = parseInt(match[1].replace(/,/g, ""), 10);
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku || `MEET-${p.id}`,
        permalink: p.permalink,
        price: price > 0 ? price : 2800,
        regular_price: rawRegPrice > 0 ? rawRegPrice : (price > 0 ? price : 2800),
        sale_price: rawSalePrice,
        isOnSale: p.prices?.is_on_sale || false,
        currency: p.prices?.currency_code || "TWD",
        currency_symbol: p.prices?.currency_symbol || "NT$",
        short_description: cleanHtml(p.short_description),
        description: cleanHtml(p.description || ""),
        raw_short_description: p.short_description,
        raw_description: p.description || "",
        categories: (p.categories || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
        tags: (p.tags || []).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
        images: (p.images || []).map((img: any) => ({
          id: img.id,
          src: img.src,
          thumbnail: img.thumbnail,
          alt: img.alt || p.name
        })),
        attributes: (p.attributes || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          terms: (a.terms || []).map((t: any) => t.name)
        })),
        in_stock: p.is_in_stock ?? true,
        has_options: p.has_options || false
      };
    });

    if (processed.length > 0) {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(productsFile, JSON.stringify(processed, null, 2));
      if (categories.length > 0) {
        fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
      }
    }

    res.json({
      success: true,
      message: `成功從 meetspa.lohastime.com.tw 同步 ${processed.length} 項商品與 ${categories.length} 個分類！`,
      count: processed.length
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Check LINE Notify configuration status
app.get("/api/notify/status", (req, res) => {
  const envToken = process.env.LINE_NOTIFY_TOKEN;
  res.json({
    configured: Boolean(envToken && envToken.trim().length > 0),
    maskedToken: envToken ? `${envToken.slice(0, 4)}...${envToken.slice(-4)}` : null
  });
});

// API: Test LINE Notify Token
app.post("/api/notify/test", async (req, res) => {
  const { customToken } = req.body;
  const token = customToken || process.env.LINE_NOTIFY_TOKEN;

  if (!token || !token.trim()) {
    return res.status(400).json({
      success: false,
      error: "請提供 LINE Notify 權杖 (Token) 或在環境變數中設定 LINE_NOTIFY_TOKEN"
    });
  }

  try {
    const testMessage = `\n🌿【MeetSpa 浴見幸福】\n連線測試成功！\n系統已順利整合 LINE Notify API。\n時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`;

    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token.trim()}`
      },
      body: new URLSearchParams({ message: testMessage }).toString()
    });

    const data = await response.json();

    if (response.ok && data.status === 200) {
      return res.json({
        success: true,
        message: "LINE Notify 測試訊息發送成功！請檢查您的 LINE 聊天室。",
        data
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: data.message || "LINE Notify 驗證失敗，請確認權杖是否正確",
        data
      });
    }
  } catch (err: any) {
    console.error("LINE Notify test error:", err);
    return res.status(500).json({
      success: false,
      error: `發送失敗: ${err.message}`
    });
  }
});

// API: Send Order/Quotation Notification to LINE Notify
app.post("/api/notify/line", async (req, res) => {
  const { quotation, customer, customToken } = req.body;
  const token = customToken || process.env.LINE_NOTIFY_TOKEN;

  if (!quotation || !quotation.items || quotation.items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "報價或訂單資料不完整，清單不可為空"
    });
  }

  // Format nice readable message
  const nowStr = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  const quoteNo = quotation.quoteNo || `MEET-${Date.now().toString().slice(-6)}`;
  
  let itemsSummary = "";
  quotation.items.forEach((item: any, idx: number) => {
    itemsSummary += `\n${idx + 1}. ${item.name}\n   規格/編號: ${item.sku || "無"}\n   數量: ${item.quantity} x NT$${item.price.toLocaleString()} = NT$${(item.quantity * item.price).toLocaleString()}`;
  });

  const formattedMsg = `
🛁【MeetSpa 浴見幸福 - 訂單/報價通知】
━━━━━━━━━━━━━━
📄 估價單號：${quoteNo}
📅 建立時間：${nowStr}

👤 客戶資料：
• 姓名：${customer?.name || "未填寫"}
• 電話：${customer?.phone || "未填寫"}
• Email：${customer?.email || "未填寫"}
• LINE ID：${customer?.lineId || "未填寫"}
• 備註需求：${customer?.notes || "無"}

📦 訂購/試算商品項目：${itemsSummary}

━━━━━━━━━━━━━━
💰 試算結算：
• 商品小計：NT$ ${Number(quotation.subtotal || 0).toLocaleString()}
${quotation.discountAmount > 0 ? `• 優惠折扣：- NT$ ${Number(quotation.discountAmount).toLocaleString()}\n` : ""}• 配送費用：NT$ ${Number(quotation.shippingFee || 0).toLocaleString()} (${quotation.shippingMethod || "宅配"})
${quotation.taxAmount > 0 ? `• 營業稅 (5%)：NT$ ${Number(quotation.taxAmount).toLocaleString()}\n` : ""}⭐ 估價總計：NT$ ${Number(quotation.totalAmount || 0).toLocaleString()}
━━━━━━━━━━━━━━
🔗 官方產品資料庫：https://meetspa.lohastime.com.tw/
`;

  // If no token is provided, return structured simulated response with ready message
  if (!token || !token.trim()) {
    return res.json({
      success: true,
      simulated: true,
      message: "已生成 LINE 訂單通知訊息！(由於尚未設定 LINE Notify Token，已提供預覽內容與 LINE 1-Click 一鍵轉發功能)",
      quoteNo,
      formattedMessage: formattedMsg
    });
  }

  try {
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token.trim()}`
      },
      body: new URLSearchParams({ message: formattedMsg }).toString()
    });

    const data = await response.json();

    if (response.ok && data.status === 200) {
      return res.json({
        success: true,
        simulated: false,
        message: `訂單通知已成功發送至 LINE Notify！(單號: ${quoteNo})`,
        quoteNo,
        formattedMessage: formattedMsg,
        data
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: data.message || "發送至 LINE Notify 失敗，請檢查 Token 權限",
        formattedMessage: formattedMsg
      });
    }
  } catch (err: any) {
    console.error("LINE Notify send error:", err);
    return res.status(500).json({
      success: false,
      error: `發送失敗: ${err.message}`,
      formattedMessage: formattedMsg
    });
  }
});

// Vite middleware & Static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MeetSpa Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
