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
4. 新增變數 `GID`：填入餐廳名單工作表的 GID (通常是網址最後面的 `gid=0` 或一串數字)。
5. 新增變數 `MAPPING_GID`（選填）：如果您建立了「動態選項字典」分頁（用來自動對應下拉選單選項名稱），請填入該分頁的 GID。
6. 新增變數 `VITE_BACKEND_URL`（選填）：如果您有部署專屬的後端伺服器（處理點擊率與熱門統計），請填入您的後端完整網址（例如 `https://your-backend.com`）。若不填寫將會嘗試回退至舊版預設網址。

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
| **`Address`** | 餐廳地址。若留空，排程腳本會自動查詢並填上 | `台北市中山區農安街...` |
| **`Location`** | 餐廳區域。必須填寫與「字典分頁」對應的 Key 值，或是直接填寫中文。若有設定 `MAPPING_GID`，下拉選單會自動對應翻譯；否則會直接顯示您填入的內容。 | `Qingguang` |
| **`Genre`** | 餐廳類別。填寫規範同 `Location`，支援全動態擴充。 | `Bento` |
| **`Price`** | 價格區間，填入數字。畫面上會轉化為金幣數量 🪙 | `2` |
| **`Coordinates`** | Google Maps 經緯度，以逗號分隔。如果留空則會預設指到民權西路站 | `25.0645, 121.5234` |
| **`OnePerson`** | (標籤) 是否適合一個人吃。是請填大寫 `O`，否則留白 | `O` |
| **`Gathering`** | (標籤) 是否適合多人聚餐。是請填大寫 `O`，否則留白 | |
| **`Dating`** | (標籤) 是否適合約會。是請填大寫 `O`，否則留白 | |
| **`FastServe`** | (標籤) 是否快速上菜。是請填大寫 `O`，否則留白 | `O` |
| **`SlowEat`** | (標籤) 是否適合慢慢吃。是請填大寫 `O`，否則留白 | |

> **⚠️ 注意事項：** 
> 1. 本專案支援 **「全自動化動態字典」 (No-Code Mappings)**！只要您在 Google Sheets 建立一個字典分頁（欄位依序為 `Location`, `locationMapping`, `Genre`, `genreMapping`），並將其 GID 填入 GitHub Variables `MAPPING_GID` 中，系統打包時就會自動產生下拉選單，完全無需修改前端程式碼！
> 2. `HotPick` (熱門推薦) 標籤是由點擊率統計自動產生的，不需要（也不能）在表單中手動填寫。

---

## 🤖 自動化：雙軌備援機制抓取座標與地址

為了減輕手動查詢座標的負擔，本專案提供了一支內建「雙軌備援系統」的 **Google Apps Script**。您只需填寫餐廳名稱，系統便會在背景自動補齊經緯度與官方地址！
- **Track 1 (主線路)**：LocationIQ (基於 OpenStreetMap 的專業地圖 API，需免費申請 Key)。
- **Track 2 (備援線路)**：Google Apps Script 內建地圖服務 (免 Key，高可用性)。若 Track 1 失敗或未設定，系統會自動無縫切換至此備援機制。

### 步驟 1：匯入腳本
1. 開啟您的 Google Sheets 表單。
2. 點選頂部選單的 **「擴充功能 (Extensions)」 -> 「Apps Script」**。
3. 系統會開啟一個新的腳本編輯器。請將編輯器內預設的程式碼全數刪除。
4. 打開本專案原始碼中的 [`scripts/AutoCoordinates.gs`](file:///Users/hahachou/git_repo/github/tpe-zhongshan-food/scripts/AutoCoordinates.gs) 檔案，將裡面的所有內容**複製並貼上**到腳本編輯器中。
5. 點擊上方的 **「儲存」** 圖示（或按 `Ctrl+S` / `Cmd+S`）。

### 步驟 2：申請並設定 LocationIQ API Key (建議)
雖然系統內建 Google 備援機制，但為了獲取最準確的開源圖資，建議免費申請 LocationIQ API Key：
1. 前往 [LocationIQ 官網](https://locationiq.com/) 註冊免費帳號，並在後台複製您的 **Access Token**。
2. 回到 Apps Script 編輯器，點擊左側面板的 **「專案設定」 (齒輪圖示 ⚙️)**。
3. 往下滑找到 **「指令碼屬性」 (Script Properties)**，點擊「新增指令碼屬性」。
4. 屬性 (Property) 欄位請精準填入：`OSM_API_KEY`
5. 值 (Value) 欄位請貼上您剛剛複製的 Access Token，並點擊儲存。

### 步驟 3：設定自動排程 (Trigger)
1. 在 Apps Script 編輯器中，點擊左側邊欄的 **「觸發條件 (Triggers)」** （鬧鐘圖示）。
2. 點擊右下角的 **「新增觸發條件 (Add Trigger)」**。
3. 依照以下設定：
   - 選擇要執行的功能：`fetchCoordinates`
   - 選擇您應執行的部署作業：`Head`
   - 選取事件來源：`時間驅動 (Time-driven)`
   - 選取時間型觸發條件類型：`小時計時器 (Hour timer)`
   - 選取時間間隔：`每小時 (Every hour)`
4. 點擊 **「儲存」**。系統可能會要求您登入 Google 帳號並授權，請點擊「進階 -> 繼續前往」完成授權。

> **💡 運作方式：**
> 設定完成後，您未來新增餐廳時只需把 `Coordinates` 與 `Address` 欄位留空。每小時系統會在背景檢查一次表單，如果發現有填寫 `Restaurant` 但沒有座標的列，就會自動呼叫地圖 API 將座標與標準地址填上！您也可以隨時在 Apps Script 介面中手動點擊「執行 (Run)」來立刻補齊。

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
