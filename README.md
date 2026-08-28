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
| 動畫 | Motion (Framer Motion) |
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

> **Firebase** 設定直接寫在 `firebase-applet-config.json`（已含公開 API Key，無需加進 `.env`）

部署至 GitHub Pages 時，請在 GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **Variables** 建立以下 Repository Variables。GitHub Actions 會在建置時將它們注入 `DEFAULT_LINE_CONFIG`：

| Variable | 說明 |
|----------|------|
| `VITE_LINE_ID` | LINE 官方帳號 ID（如 `@springheart`） |
| `VITE_LINE_URL` | LINE 官方帳號加入好友連結 |
| `VITE_LIFF_ID` | LINE LIFF App ID |
| `VITE_LIFF_URL` | LINE LIFF 應用程式 URL |

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
│   ├── data/                   # 本地商品資料 JSON（Firestore fallback）
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

## Firebase Firestore 資料結構

| Collection | 說明 |
|------------|------|
| `products` | 商品資料（`id` 為 doc ID） |
| `categories` | 商品分類 |

商品與分類資料由 Firestore 提供；請先在 `products` 與 `categories` collection 建立資料。

---

## LINE 整合說明

- **LIFF（LINE Front-end Framework）**：在 LINE 內嵌瀏覽器中開啟，可傳送純文字諮詢單
- **LINE 深層連結 fallback**：非 LIFF 環境下，自動產生一鍵跳轉 LINE 官方帳號的連結

---

## 注意事項

- `firebase-applet-config.json` 含有 Firebase Web API Key，此為 Firebase 設計的公開用 Key，透過 **Firestore Security Rules** 控管存取權限
- 請勿將 `.env` 提交到 git（已加入 `.gitignore`）
- 商品資料更新：直接到 Firebase Console 修改 `products` 與 `categories` collection
- 歷史諮詢紀錄僅儲存在使用者瀏覽器的 `localStorage`，不會寫入 Firestore
