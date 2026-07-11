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
  const ratingColIdx = headers.indexOf("Rating");
  const phoneColIdx = headers.indexOf("Phone");
  const openingHoursColIdx = headers.indexOf("OpeningHours");
  
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
    
    // 盲區修正 2：防呆，若座標欄位空白，或之前寫入了錯誤訊息 (⚠️ 開頭)，都視為需要重新抓取。
    const coordStr = coordinates ? coordinates.toString().trim() : "";
    const isCoordinatesEmpty = coordStr === "" || coordStr.startsWith("⚠️");
    
    // 如果有餐廳名稱，且座標完全空白才執行
    if (restaurantName && isCoordinatesEmpty) {
      // 盲區修正 4：如果使用者已經手動填寫了詳細地址，優先使用「地址」來查詢精確座標，否則才用店名
      const searchQuery = (address && address.toString().trim() !== "") ? address.toString().trim() : restaurantName;
      Logger.log(`正在搜尋: ${searchQuery}`);
      processedCount++;
      
      const result = getCoordinates(searchQuery);
      
      if (result && result.lat) {
        // 寫入座標
        sheet.getRange(i + 1, coordinatesColIdx + 1).setValue(`${result.lat}, ${result.lon}`);
        
        // 盲區修正 3：保護使用者手動輸入的資料。
        // 如果 Address 欄位存在，且「目前是空白的」，才自動填寫地址，避免覆蓋掉使用者手寫的地址。
        if (addressColIdx !== -1 && (!address || address.toString().trim() === "")) {
          sheet.getRange(i + 1, addressColIdx + 1).setValue(result.address);
        }
        
        // --- 進階商業資訊寫入 (Places API) ---
        if (result.rating && ratingColIdx !== -1 && (!values[i][ratingColIdx] || values[i][ratingColIdx].toString().trim() === "")) {
          sheet.getRange(i + 1, ratingColIdx + 1).setValue(result.rating);
        }
        if (result.phone && phoneColIdx !== -1 && (!values[i][phoneColIdx] || values[i][phoneColIdx].toString().trim() === "")) {
          sheet.getRange(i + 1, phoneColIdx + 1).setValue(result.phone);
        }
        if (result.openingHours && openingHoursColIdx !== -1 && (!values[i][openingHoursColIdx] || values[i][openingHoursColIdx].toString().trim() === "")) {
          sheet.getRange(i + 1, openingHoursColIdx + 1).setValue(result.openingHours);
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
 * 雙軌備援機制：取得經緯度與地址
 * Primary: LocationIQ (OpenStreetMap)
 * Secondary: Google Apps Script 內建地圖服務 (免 Key, 高可用)
 */
function getCoordinates(restaurantName) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty('OSM_API_KEY');
  const placesApiKey = scriptProperties.getProperty('GOOGLE_PLACES_API_KEY');
  
  // Track 0: 如果有設定 Google Places API Key，取得最完整的資訊
  if (placesApiKey) {
    Logger.log(`[Track 0] 嘗試使用 Google Places API 搜尋: ${restaurantName}`);
    const placesResult = getFromGooglePlaces(restaurantName, placesApiKey);
    if (!placesResult.error) {
      return placesResult;
    }
    Logger.log(`[Track 0 失敗] ${placesResult.error}，將切換至 Track 1 備援...`);
  }

  // Track 1: 如果有設定 API Key，優先使用 LocationIQ (OSM)
  if (apiKey) {
    Logger.log(`[Track 1] 嘗試使用 LocationIQ API (OSM) 搜尋: ${restaurantName}`);
    const osmResult = getFromLocationIQ(restaurantName, apiKey);
    if (!osmResult.error) {
      return osmResult;
    }
    Logger.log(`[Track 1 失敗] ${osmResult.error}，將自動切換至 Track 2 備援機制...`);
  } else {
    Logger.log(`[Track 1 跳過] 未設定 OSM_API_KEY，直接啟用 Track 2 備援機制。`);
  }

  // Track 2: 備援機制，使用 Apps Script 內建的 Google Geocoder (完全免費、免 Key、幾乎不會 429)
  Logger.log(`[Track 2] 嘗試使用 Google Native Geocoder 搜尋: ${restaurantName}`);
  return getFromGoogleGeocoder(restaurantName);
}

function getFromGooglePlaces(restaurantName, apiKey) {
  try {
    const query = encodeURIComponent(`${restaurantName} 中山區 台北市`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=zh-TW`;
    let searchRes = UrlFetchApp.fetch(searchUrl, { method: "GET", muteHttpExceptions: true });
    
    if (searchRes.getResponseCode() !== 200) {
      return { error: `Places Search HTTP ${searchRes.getResponseCode()}` };
    }
    
    let searchData = JSON.parse(searchRes.getContentText());
    if (!searchData.results || searchData.results.length === 0) {
      return { error: "Places API 找不到該地點" };
    }
    
    const place = searchData.results[0];
    const placeId = place.place_id;
    let result = {
      lat: place.geometry.location.lat.toFixed(6),
      lon: place.geometry.location.lng.toFixed(6),
      address: cleanAddress(place.formatted_address),
      rating: place.rating || "",
      phone: "",
      openingHours: ""
    };

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,opening_hours&key=${apiKey}&language=zh-TW`;
    let detailsRes = UrlFetchApp.fetch(detailsUrl, { method: "GET", muteHttpExceptions: true });
    if (detailsRes.getResponseCode() === 200) {
      let detailsData = JSON.parse(detailsRes.getContentText());
      if (detailsData.result) {
        if (detailsData.result.formatted_phone_number) {
          result.phone = detailsData.result.formatted_phone_number;
        }
        if (detailsData.result.opening_hours && detailsData.result.opening_hours.weekday_text) {
          result.openingHours = detailsData.result.opening_hours.weekday_text.join('\n');
        }
      }
    }

    return result;
  } catch (e) {
    return { error: `Places API 異常: ${e.message}` };
  }
}

function getFromLocationIQ(restaurantName, apiKey) {
  const query = encodeURIComponent(`${restaurantName} 中山區 台北市`);
  const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${query}&format=json&limit=1&accept-language=zh-TW`;
  const options = { method: "GET", muteHttpExceptions: true };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat).toFixed(6),
          lon: parseFloat(data[0].lon).toFixed(6),
          address: cleanAddress(data[0].display_name)
        };
      }
      return { error: "LocationIQ 找不到該地點" };
    }
    return { error: `LocationIQ HTTP ${response.getResponseCode()}` };
  } catch (e) {
    return { error: `LocationIQ 異常: ${e.message}` };
  }
}

function getFromGoogleGeocoder(restaurantName) {
  try {
    const query = `${restaurantName} 中山區 台北市`;
    // 使用 Apps Script 原生的 Maps 服務，強制指定繁體中文
    const response = Maps.newGeocoder().setLanguage('zh-TW').geocode(query);
    
    if (response.status === 'OK' && response.results.length > 0) {
      const result = response.results[0];
      return {
        lat: result.geometry.location.lat.toFixed(6),
        lon: result.geometry.location.lng.toFixed(6),
        address: cleanAddress(result.formatted_address)
      };
    }
    return { error: `Google API 失敗狀態: ${response.status}` };
  } catch (e) {
    return { error: `Google Geocoder 異常: ${e.message}` };
  }
}

/**
 * 清理地址：移除郵遞區號、台灣字樣，讓地址更簡短乾淨
 */
function cleanAddress(addr) {
  if (!addr) return "";
  let res = addr.toString();
  
  // 1. 移除 Google 格式開頭的郵遞區號 (例如: "10491台灣...")
  res = res.replace(/^\d{3,6}/, '');
  
  // 2. 移除 "台灣" 或 "臺灣" 字眼
  res = res.replace(/臺灣|台灣/g, '');
  
  // 3. 針對 LocationIQ 逗號格式，移除獨立的區號 (例如 ", 10491,")
  res = res.replace(/,\s*\d{3,6}(?=\s*,|\s*$)/g, '');
  
  // 4. 清除前後多餘的逗號與空白
  res = res.replace(/^[,\s]+|[,\s]+$/g, '');
  
  return res;
}
