/**
 * 自動抓取餐廳座標與地址腳本 (使用 OpenStreetMap Nominatim API)
 * 請將此程式碼複製貼上到 Google Sheets 的 Apps Script 編輯器中。
 */

function fetchCoordinates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length < 2) return; // 沒有資料
  
  const headers = values[0];
  const restaurantColIdx = headers.indexOf("Restaurant");
  const coordinatesColIdx = headers.indexOf("Coordinates");
  const addressColIdx = headers.indexOf("Address");
  
  if (restaurantColIdx === -1 || coordinatesColIdx === -1) {
    Logger.log("找不到 'Restaurant' 或 'Coordinates' 欄位，請確認表頭名稱是否正確。");
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  let executionLogs = [];
  
  // 盲區修正 1：Google Apps Script 有 6 分鐘執行時間限制。
  // 若一次新增數百筆資料，每筆睡 1.5 秒會導致超時被強制中斷。
  // 因此設定單次執行最多處理 50 筆，剩下的交給下一個小時的排程處理。
  const MAX_PROCESS_PER_RUN = 50;
  let processedCount = 0;
  
  // 從第二列開始讀取 (索引 1)
  for (let i = 1; i < values.length; i++) {
    if (processedCount >= MAX_PROCESS_PER_RUN) {
      Logger.log(`已達到單次執行上限 (${MAX_PROCESS_PER_RUN} 筆)，剩下的將於下次排程處理。`);
      executionLogs.push(`⚠️ 達到單次處理上限，剩餘未處理的資料將於下次排程繼續。`);
      break;
    }

    const restaurantName = values[i][restaurantColIdx];
    const coordinates = values[i][coordinatesColIdx];
    const address = addressColIdx !== -1 ? values[i][addressColIdx] : "";
    
    // 盲區修正 2：防呆，若使用者不小心在座標欄位打了一個空白鍵 " "，原本的 !coordinates 會失效。
    const isCoordinatesEmpty = !coordinates || coordinates.toString().trim() === "";
    
    // 如果有餐廳名稱，且座標完全空白才執行
    if (restaurantName && isCoordinatesEmpty) {
      Logger.log(`正在搜尋: ${restaurantName}`);
      processedCount++;
      
      const result = getCoordinatesFromOSM(restaurantName);
      
      if (result && result.lat) {
        // 寫入座標
        sheet.getRange(i + 1, coordinatesColIdx + 1).setValue(`${result.lat}, ${result.lon}`);
        
        // 盲區修正 3：保護使用者手動輸入的資料。
        // 如果 Address 欄位存在，且「目前是空白的」，才自動填寫地址，避免覆蓋掉使用者手寫的地址。
        if (addressColIdx !== -1 && (!address || address.toString().trim() === "")) {
          sheet.getRange(i + 1, addressColIdx + 1).setValue(result.address);
        }
        
        const msg = `✅ 成功更新 [${restaurantName}]: ${result.lat}, ${result.lon}`;
        Logger.log(msg);
        executionLogs.push(msg + `\n   地址: ${result.address}`);
        updatedCount++;
      } else {
        const errorMsg = result ? result.error : "未知錯誤";
        sheet.getRange(i + 1, coordinatesColIdx + 1).setValue(`⚠️ ${errorMsg}`);
        const msg = `❌ 失敗 [${restaurantName}]: ${errorMsg}`;
        Logger.log(msg);
        executionLogs.push(msg);
        errorCount++;
      }
      
      // 暫停 1.5 秒以避免 IP 被封鎖
      Utilities.sleep(1500); 
    }
  }
  
  Logger.log(`執行完畢，更新: ${updatedCount} 筆，錯誤: ${errorCount} 筆。`);
  
  if (updatedCount > 0 || errorCount > 0) {
    const emailAddress = Session.getActiveUser().getEmail();
    const subject = `[中山區美食地圖] 自動抓取座標報告 (更新: ${updatedCount}, 錯誤: ${errorCount})`;
    const body = `自動抓取排程執行完畢。\n\n執行紀錄：\n` + executionLogs.join("\n") + 
                 `\n\n您可以回到 Google Sheets 檢查或修改發生錯誤的餐廳名稱。`;
                 
    try {
      MailApp.sendEmail(emailAddress, subject, body);
    } catch(e) {
      Logger.log("寄送 Email 失敗: " + e.message);
    }
  }
}

/**
 * 呼叫 OpenStreetMap API 取得經緯度與地址
 */
function getCoordinatesFromOSM(restaurantName) {
  const query = encodeURIComponent(`${restaurantName} 中山區 台北市`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  
  // 盲區修正 4：OpenStreetMap 官方強烈建議 User-Agent 必須提供聯絡信箱。
  // 若只使用通用的 Agent 名稱，可能會被官方防火牆無預警永久封鎖。
  const userEmail = Session.getActiveUser().getEmail();
  
  const options = {
    method: "GET",
    headers: {
      "User-Agent": `ZhongshanFoodPicker-AutoScript/1.0 (${userEmail})`
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat).toFixed(6),
          lon: parseFloat(data[0].lon).toFixed(6),
          address: data[0].display_name
        };
      } else {
         return { error: "找不到此餐廳的地址座標" };
      }
    } else {
      return { error: `API 請求失敗 HTTP ${response.getResponseCode()}` };
    }
  } catch (e) {
    return { error: `發生例外錯誤: ${e.message}` };
  }
}
