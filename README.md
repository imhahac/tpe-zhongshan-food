# 中山區美食選擇器 (Zhongshan Food Picker)

這是一個完全基於 **Vite + React** 打造，並透過 **GitHub Actions** 實現全自動化部署的前端靜態網頁應用程式。專為解決您在「晴光市場、捷運民權西路站、捷運中山國小站」周遭不知道該吃什麼的選擇障礙！

只要輸入你想去的地點、選擇你想要的風格，系統會幫你隨機排序，為您解決每日的午晚餐難題！

## 🌟 核心功能說明

### 1. 🍽️ 餐廳自動推薦與篩選
可以根據「餐廳類別（中式、日式、速食...）」、「區域位置（晴光市場、捷運民權西路站...）」進行多重篩選。還支援「熱門推薦」、「一個人吃」、「多人聚餐」等特色標籤過濾。

### 2. 🗺️ 地圖互動整合
內建 **Leaflet** 地圖，會根據您過濾後的結果自動在地圖上標記餐廳位置。同時支援取得裝置的 GPS 定位，顯示出離您最近的餐廳，並提供 Google Maps 連結直接導航。

### 3. 🔄 自動化 Google Sheets 串接 (免資料庫)
所有的餐廳資料皆統一存放於公開的 Google Sheets 表單中。前端透過 **GitHub Actions**，在建置 (Build) 期間自動抓取最新的 CSV 資料打包成靜態網頁。維護者只需更新 Excel/Google Sheets 表單，系統會透過排程自動同步更新，完全無需維護後端資料庫！

---

## ☁️ 部署與維護指南 (Deployment via GitHub Actions)

本專案**完全依賴 GitHub Workflow 進行自動化部署**，不需進行任何本地端 (Local) 部署與建置。您只需設定好 GitHub Repository 即可讓網站全自動運作。

### 第一步：啟用 GitHub Pages 自動部署
1. 到您的 GitHub 專案 Repo 頁面，點選 **Settings -> Pages**。
2. 在 **Build and deployment** 區塊中，將來源 (Source) 下拉選單改為 **`GitHub Actions`**。
3. 到左側邊欄 **Settings -> Actions -> General**，向下捲動找到 **Workflow permissions**，確保勾選了 **`Read and write permissions`**。

### 第二步：設定環境變數 (資料源與後端)
本專案透過 GitHub Variables 來動態決定要抓取的資料來源以及後端 API 網址：
1. 進入 **Settings -> Secrets and variables -> Actions**。
2. 切換到 **Variables** 頁籤，點擊 **New repository variable**。
3. 新增變數 `SHEET_ID`：填入您的 Google Sheets ID（位於網址列 `/d/` 之後的亂碼）。
4. 新增變數 `GID`：填入對應的工作表 GID (通常是網址最後面的 `gid=0` 或一串數字)。
5. 新增變數 `VITE_BACKEND_URL`（選填）：如果您有部署專屬的後端伺服器（處理點擊率與熱門統計），請填入您的後端完整網址（例如 `https://your-backend.com`）。若不填寫將會嘗試回退至舊版預設網址。

### 第三步：觸發更新
只要完成上述設定，專案就會透過 `.github/workflows/deploy.yml` 自動運作：
- **定時更新**：每天 UTC 凌晨 0 點，系統會自動抓取 Google Sheets 重新打包發布。
- **手動更新**：若您剛改完 Google Sheets 想立刻看到結果，可到 Repo 的 **Actions** 頁籤，點擊 `Deploy to GitHub Pages` 工作流程，然後按下 **Run workflow** 手動觸發。
- **程式碼更新**：任何推播至 `main` 分支的 Commit 都會自動觸發部署。

---

## 📊 Google Sheets 資料格式規範

為了讓程式能正確讀取您的餐廳名單，請確保 Google Sheets 第一列 (Header) 包含以下**精確的英文欄位名稱**（區分大小寫）：

| 欄位名稱 (Header) | 說明與填寫規範 | 範例 |
| --- | --- | --- |
| **`Restaurant`** | 餐廳名稱（將直接顯示於畫面上） | `晴光意麵` |
| **`Location`** | 餐廳區域。必須填入系統定義的英文 Key（例如：`Qingguang` = 晴光市場, `MinquanWest` = 民權西路站, `ZhongshanElementary` = 中山國小站） | `Qingguang` |
| **`Genre`** | 餐廳類別。必須填入系統定義的英文 Key（例如：`Bento`, `Japanese`, `Noodles`, `Dessert` 等） | `Noodles` |
| **`Price`** | 價格區間，填入數字。畫面上會轉化為金幣數量 🪙 | `2` |
| **`Coordinates`** | Google Maps 經緯度，以逗號分隔。如果留空則會預設指到民權西路站 | `25.0645, 121.5234` |
| **`OnePerson`** | (標籤) 是否適合一個人吃。是請填大寫 `O`，否則留白 | `O` |
| **`Gathering`** | (標籤) 是否適合多人聚餐。是請填大寫 `O`，否則留白 | |
| **`Dating`** | (標籤) 是否適合約會。是請填大寫 `O`，否則留白 | |
| **`FastServe`** | (標籤) 是否快速上菜。是請填大寫 `O`，否則留白 | `O` |
| **`SlowEat`** | (標籤) 是否適合慢慢吃。是請填大寫 `O`，否則留白 | |

> **⚠️ 注意事項：** 
> 1. `Location` 與 `Genre` 支援的完整英文 Key 列表請參考原始碼 `src/data/enum.js` 中的設定。
> 2. `HotPick` (熱門推薦) 標籤是由點擊率統計自動產生的，不需要（也不能）在表單中手動填寫。

---

## 🛠️ 專案模組化架構 (Architecture)

本專案採用現代化 React 元件開發標準，並進行了深度模組化與關注點分離：

- **`src/App.jsx`**: 核心大腦。只負責純粹的「狀態管理 (State Management)」與「資料向下傳遞」，不再處理繁雜的 UI 細節。
- **`src/components/`**: 獨立的視覺元件庫。
  - `Header.jsx` / `Header.css`: 頂部導航列。
  - `Filters.jsx` / `Filters.css`: 表單篩選器與特色標籤。
  - `RestaurantCard.jsx` / `RestaurantCard.css`: 獨立的餐廳卡片。
  - `Map.jsx` / `Map.css`: 封裝了 `react-leaflet` 的地圖元件。
  - `Footer.jsx`, `BackToTop.jsx`: 底部資訊與互動按鈕。
- **`src/utils/helpers.js`**: 收納所有的輔助函式（如座標計算 `inRange`、呼叫 API 的 `apiFetch`），維持元件程式碼的整潔。
- **`generate/datagenerate.js`**: 部署時的 Node.js 腳本，負責連線至 Google Sheets 下載最新的 CSV 資料並轉為 JSON。
- **`.github/workflows/deploy.yml`**: GitHub Actions 的 CI/CD 自動化設定檔。
