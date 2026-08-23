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

