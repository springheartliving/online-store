import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const config = JSON.parse(await readFile("firebase-applet-config.json", "utf8"));
const repoParts = (process.env.GITHUB_REPOSITORY || "").split("/");
const repoName = repoParts.at(-1);
const owner = repoParts[0];
const basePath = process.env.GITHUB_ACTIONS === "true" && repoName
  ? `/${repoName}/`
  : "/";
const siteUrl = (process.env.VITE_SITE_URL || (
  owner && repoName
    ? `https://${owner}.github.io/${repoName}/`
    : "http://localhost:5173/"
)).replace(/\/?$/, "/");
const databaseId = config.firestoreDatabaseId || "(default)";
const documentsUrl = new URL(
  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${encodeURIComponent(databaseId)}/documents/products`
);
documentsUrl.searchParams.set("key", config.apiKey);
documentsUrl.searchParams.set("pageSize", "1000");

function decodeValue(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function plainText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function imageUrl(value) {
  if (!value) return new URL(`${basePath}logo.svg`, siteUrl).toString();
  const driveId = String(value).match(/(?:drive|docs)\.google\.com.*(?:\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/)?.[1];
  return driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : new URL(value, siteUrl).toString();
}

let products = [];
let nextPageToken;
let canReadProducts = true;
do {
  const pageUrl = new URL(documentsUrl);
  if (nextPageToken) pageUrl.searchParams.set("pageToken", nextPageToken);
  const response = await fetch(pageUrl);
  if (!response.ok) {
    if (response.status === 403) {
      console.warn("Firestore 拒絕建置期讀取商品；分享連結會使用首頁商品查詢網址，不會有商品專屬社群預覽。部署 firestore.rules 的公開讀取規則後即可產生預覽頁。");
      canReadProducts = false;
      break;
    }
    throw new Error(`讀取 Firestore 商品失敗：${response.status} ${response.statusText}`);
  }
  const page = await response.json();
  products.push(...(page.documents || []).map((document) => decodeFields(document.fields || {})));
  nextPageToken = page.nextPageToken;
} while (nextPageToken);

const template = await readFile("dist/index.html", "utf8");
const publishedSlugs = [];
if (canReadProducts) {
for (const product of products) {
  if (product.is_published === false) continue;
  const slug = String(product.slug || product.id || "").trim();
  if (!slug || slug === "." || slug === ".." || slug.includes("/") || slug.includes("\\")) continue;

  const title = `${product.name}｜泉心生活 Spring Heart Living`;
  const description = plainText(product.short_description || product.description).slice(0, 300)
    || `${product.name}｜泉心生活商品介紹`;
  const canonicalUrl = new URL(`${basePath}product/${encodeURIComponent(slug)}`, siteUrl).toString();
  const socialImage = imageUrl(product.images?.[0]?.src);
  const metadata = [
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(socialImage)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(socialImage)}" />`,
  ].join("\n    ");
  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `    ${metadata.join("\n    ")}\n    <script id="product-share-slugs" type="application/json">${JSON.stringify([slug]).replace(/</g, "\\u003c")}</script>\n  </head>`);
  const outputDirectory = path.join("dist", "product", encodeURIComponent(slug));
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "index.html"), html);
  publishedSlugs.push(slug);
}
}

const indexHtml = template.replace(
  "</head>",
  `    <script id="product-share-slugs" type="application/json">${JSON.stringify(publishedSlugs).replace(/</g, "\\u003c")}</script>\n  </head>`
);
await writeFile("dist/index.html", indexHtml);
console.log(`已產生 ${publishedSlugs.length} 個商品分享預覽頁。`);