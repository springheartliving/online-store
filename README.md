# 泉心生活 Spring Heart Living — 線上型錄

> 頂級水療設備、漢方養生與生活美學商品展示館  
> 支援 Firebase Firestore 資料庫 + LINE LIFF 諮詢整合

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 建置工具 | Vite 6 |
| 樣式 | Tailwind CSS v4 |
| 資料庫 | Firebase Firestore |
| 動畫 | CSS animations |
| LINE 整合 | LIFF SDK v2 |
| 部署 | GitHub Pages（自動 CI/CD） |

---

## 快速開始（本機開發）

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製範本並填入對應值：

```bash
cp .env.example .env
```

| 變數 | 說明 |
|------|------|
| `VITE_LINE_ID` | LINE 官方帳號 ID（如 `@springheart`） |
| `VITE_LINE_URL` | LINE 官方帳號加入好友連結 |
| `VITE_LIFF_ID` | LINE LIFF App ID |
| `VITE_LIFF_URL` | LINE LIFF 應用程式 URL |
| `VITE_GOOGLE_SHEETS_WEB_APP_URL` | Google Apps Script Web App URL |

> **Firebase** 設定直接寫在 `firebase-applet-config.json`（已含公開 API Key，無需加進 `.env`）。

部署至 GitHub Pages 時，請在 GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **Variables** 建立以下 Repository Variables。GitHub Actions 會在建置時將它們注入前端：

| Variable | 說明 |
|----------|------|
| `VITE_LINE_ID` | LINE 官方帳號 ID（如 `@springheart`） |
| `VITE_LINE_URL` | LINE 官方帳號加入好友連結 |
| `VITE_LIFF_ID` | LINE LIFF App ID |
| `VITE_LIFF_URL` | LINE LIFF 應用程式 URL |
| `VITE_GOOGLE_SHEETS_WEB_APP_URL` | Google Apps Script Web App URL |

本機開發則使用 `.env` 中相同名稱的變數。

### 3. 啟動開發伺服器

```bash
npm run dev
```

瀏覽器開啟 [http://localhost:5173](http://localhost:5173)

---

## 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動 Vite 開發伺服器（Hot Module Replacement） |
| `npm run build` | TypeScript 型別檢查 + Vite production build |
| `npm run preview` | 預覽 production build（本機） |
| `npm run lint` | TypeScript 型別檢查（不輸出檔案） |

---

## 部署（GitHub Pages 自動化）

### 前置設定（只需做一次）

1. 前往 GitHub repo → **Settings** → **Pages**
2. **Source** 選 `GitHub Actions`
3. 儲存

### 部署流程

每次 push 到 `main` branch，GitHub Actions 會自動：

```
push to main
  └─ Build job
       ├─ npm ci（乾淨安裝依賴）
       └─ npm run build（Vite 建置 → dist/）
  └─ Deploy job
       └─ 發佈 dist/ 到 GitHub Pages
```

部署完成後，應用程式會在以下網址上線：

```
https://springheartliving.github.io/online-store/
```

### 手動觸發部署

前往 GitHub repo → **Actions** → **Deploy to GitHub Pages** → **Run workflow**

---

## 專案結構

```
online-store/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── public/                     # 靜態資源
├── src/
│   ├── components/             # React UI 元件
│   ├── lib/
│   │   └── firebase.ts         # Firebase / Firestore 整合
│   ├── types.ts                # TypeScript 型別定義
│   ├── utils/                  # 工具函式（formatters、liff）
│   ├── App.tsx                 # 主應用程式元件
│   ├── main.tsx                # React 進入點
│   └── index.css               # 全域樣式
├── .env.example                # 環境變數範本
├── firebase-applet-config.json # Firebase 設定
├── index.html                  # HTML 進入點
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 使用流程

1. 從 Firestore 載入已發布商品與分類
2. 瀏覽、搜尋、篩選商品，並加入諮詢清單
3. 在諮詢清單調整數量後送出 LINE 諮詢
4. 在歷史紀錄查看或重新加入過往諮詢單

商品圖片支援一般圖片網址，也會自動轉換 Google Drive 圖片連結。

## Google 試算表紀錄

送出 LINE 諮詢時，前端會將管理者需要的資料送至 Google Apps Script Web App，分別寫入「諮詢紀錄」主表與「諮詢商品明細」明細表。兩個頁籤透過「諮詢單號」關聯。

「諮詢紀錄」主表每張諮詢單一列：

| 欄位名稱 | 內容 |
|----------|------|
| 諮詢單號 | 系統產生的諮詢單號 |
| 建立時間 | 諮詢單建立時間 |
| 客戶名稱 | LINE profile 顯示名稱 |
| LINE User ID | LINE profile user ID |
| 商品項數 | 不同商品的項目數 |
| 總金額 | 諮詢單總金額 |

「諮詢商品明細」每個商品一列：

| 欄位名稱 | 內容 |
|----------|------|
| 諮詢單號 | 對應主表的諮詢單號 |
| 商品名稱 | 商品名稱 |
| SKU | 商品 SKU |
| 數量 | 詢價數量 |
| 單價 | 商品單價 |
| 小計 | 單價乘以數量 |

不會送出商品圖片網址或商品內部 ID。若未設定 `VITE_GOOGLE_SHEETS_WEB_APP_URL`，則不會寫入試算表，但不影響 LINE 諮詢功能。

### Apps Script 建立方式

1. 建立 Google 試算表，開啟 **擴充功能 → Apps Script**。
2. 貼上以下程式碼並儲存。試算表頁籤會自動建立為「諮詢紀錄」與「諮詢商品明細」，第一列會套用中文欄位名稱與網站相符的基本樣式。

```javascript
const ORDER_SHEET_NAME = "諮詢紀錄";
const ITEM_SHEET_NAME = "諮詢商品明細";
const ORDER_HEADERS = ["諮詢單號", "建立時間", "客戶名稱", "LINE User ID", "商品項數", "總金額"];
const ITEM_HEADERS = ["諮詢單號", "商品名稱", "SKU", "數量", "單價", "小計"];

function doPost(e) {
     try {
          const data = JSON.parse(e.postData.contents);
          const orderSheet = getSheet(ORDER_SHEET_NAME, ORDER_HEADERS);
          const itemSheet = getSheet(ITEM_SHEET_NAME, ITEM_HEADERS);
          const items = Array.isArray(data.items) ? data.items : [];

          orderSheet.appendRow([
               data.quoteNo || "",
               data.createdAt ? new Date(data.createdAt) : new Date(),
               data.customerName || "",
               data.lineUserId || "",
               items.length,
               Number(data.totalAmount) || 0,
          ]);

          if (items.length > 0) {
               itemSheet.getRange(itemSheet.getLastRow() + 1, 1, items.length, ITEM_HEADERS.length)
                    .setValues(items.map((item) => [
                         data.quoteNo || "",
                         item.name || "",
                         item.sku || "",
                         Number(item.quantity) || 0,
                         Number(item.price) || 0,
                         Number(item.subtotal) || 0,
                    ]));
          }

          return ContentService
               .createTextOutput(JSON.stringify({ success: true }))
               .setMimeType(ContentService.MimeType.JSON);
     } catch (error) {
          return ContentService
               .createTextOutput(JSON.stringify({ success: false, message: String(error) }))
               .setMimeType(ContentService.MimeType.JSON);
     }
}

function getSheet(sheetName, headers) {
     const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
     let sheet = spreadsheet.getSheetByName(sheetName);
     if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

     if (sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.setFrozenRows(1);
          sheet.getRange(1, 1, 1, headers.length)
               .setBackground("#7C8B7C")
               .setFontColor("#FFFFFF")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
          headers.forEach((header, index) => sheet.setColumnWidth(index + 1, header === "LINE User ID" ? 230 : 140));
          if (sheetName === ITEM_SHEET_NAME) {
               sheet.setColumnWidth(2, 260);
               sheet.setColumnWidth(3, 120);
               sheet.getRange("E:F").setNumberFormat('"NT$ "#,##0');
          } else {
               sheet.setColumnWidth(6, 120);
               sheet.getRange("F:F").setNumberFormat('"NT$ "#,##0');
          }
     }

     return sheet;
}
```

3. 在 Apps Script 選擇 **部署 → 新增部署 → 網頁應用程式**。
4. **執行身分**選擇「我」，**誰可以存取**選擇「任何人」，完成授權後複製 Web App URL。
5. 將 URL 填入本機 `.env` 的 `VITE_GOOGLE_SHEETS_WEB_APP_URL`，或填入 GitHub Actions 的同名 Repository Variable，再重新建置部署。

## Firebase Firestore 資料結構

| Collection | 說明 |
|------------|------|
| `products` | 商品資料（`id` 為 doc ID） |
| `categories` | 商品分類 |

商品與分類資料由 Firestore 提供；請先在 `products` 與 `categories` collection 建立資料。

---

## LINE 整合說明

- **LIFF（LINE Front-end Framework）**：在 LINE 內嵌瀏覽器中開啟，優先傳送 Flex Message 諮詢單；若直接傳送失敗，會嘗試讓使用者選擇轉發對象
- **LINE 深層連結 fallback**：非 LIFF 環境下，以文字諮詢單產生一鍵跳轉 LINE 官方帳號的連結
- LIFF profile 會記錄顯示名稱與 user ID，並保存於本機歷史諮詢單

---

## 注意事項

- `firebase-applet-config.json` 含有 Firebase Web API Key，此為 Firebase 設計的公開用 Key，透過 **Firestore Security Rules** 控管存取權限
- 請勿將 `.env` 提交到 git（已加入 `.gitignore`）
- 商品資料更新：直接到 Firebase Console 修改 `products` 與 `categories` collection
- 歷史諮詢紀錄僅儲存在使用者瀏覽器的 `localStorage`，目前會保存諮詢單號、建立時間、商品、總金額與 LINE profile 的顯示名稱和 user ID
