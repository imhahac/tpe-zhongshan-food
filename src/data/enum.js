import dynamicMapping from './mapping.json';

export const locationMapping = {
    "All": "全部",
    "Random": "隨機",
    "Qingguang": "晴光市場",
    "MinquanWest": "民權西路站",
    "ZhongshanElementary": "中山國小站",
    "Zhongyuan": "中原街",
    "Jilin": "吉林路",
    "Zhongyuan St.": "中原街",
    "Jilin Rd.": "吉林路",
    "near": "附近",
    ...(dynamicMapping.locationMapping || {})
};

export const locationMapping_en = {
    "All": "All",
    "Random": "Random",
    "Qingguang": "Qingguang Market",
    "MinquanWest": "MRT Minquan W. Rd.",
    "ZhongshanElementary": "MRT Zhongshan Elem. Sch.",
    "Zhongyuan": "Zhongyuan St.",
    "Jilin": "Jilin Rd.",
    "near": "Nearby"
};

export const genreMapping = {
    "All": "全部",
    "Random": "隨機",
    "Bento": "便當菜/快餐",
    "Japanese": "日式料理",
    "HotPot": "小火鍋",
    "Chinese": "中式餐廳",
    "FastFood": "速食",
    "American": "美式餐廳",
    "Italian": "義式料理",
    "Breakfast": "早餐店",
    "Noodles": "麵店",
    "Vegetarian": "素食",
    "BreakfastBrunch": "早午餐",
    "Steak": "牛排館",
    "Ramen": "拉麵店",
    "SouthEastAsian": "東南亞料理",
    "Dessert":"甜點店",
    "LouMei":"滷味",
    "Bar":"酒吧",
    "Cafe":"咖啡廳",
    "Buffet":"自助餐",
    "Indian":"印度",
    "Light":"輕食",
    "Korean":"韓式料理",
    "HongKong":"港式料理",
    "Exotic":"異國料理",
    "French":"法式料理",
    ...(dynamicMapping.genreMapping || {})
}

export const genreMapping_en = {
    "All": "All",
    "Random": "Random",
    "Bento": "Bento / Fast",
    "Japanese": "Japanese",
    "HotPot": "Hot Pot",
    "Chinese": "Chinese",
    "FastFood": "Fast Food",
    "American": "American",
    "Italian": "Italian",
    "Breakfast": "Breakfast",
    "Noodles": "Noodles",
    "Vegetarian": "Vegetarian",
    "BreakfastBrunch": "Breakfast / Brunch",
    "Steak": "Steak",
    "Ramen": "Ramen",
    "SouthEastAsian": "Southeast Asian",
    "Dessert":"Dessert",
    "LouMei":"Lu-Wei",
    "Bar":"Bar",
    "Cafe":"Cafe",
    "Buffet":"Buffet",
    "Indian":"Indian",
    "Light":"Light Meals",
    "Korean":"Korean",
    "HongKong":"Hong Kong Style",
    "Exotic":"Exotic",
    "French":"French"
}

export const filterMapping = {
    "HotPick": { chinese: "熱門推薦", emoji: "🔥" },
    "OnePerson": { chinese: "一個人吃", emoji: "👤" },
    "Gathering": { chinese: "多人聚餐", emoji: "🍻" },
    "Dating": { chinese: "適合約會", emoji: "💐" },
    "FastServe": { chinese: "快速上菜", emoji: "⚡" },
    "SlowEat": { chinese: "慢慢吃", emoji: "🐌" }
};

export const filterMapping_en = {
    "HotPick": { english: "Hot Pick", emoji: "🔥" },
    "OnePerson": { english: "Solo", emoji: "👤" },
    "Gathering": { english: "Group", emoji: "🍻" },
    "Dating": { english: "Dating", emoji: "💐" },
    "FastServe": { english: "Fast", emoji: "⚡" },
    "SlowEat": { english: "Leisure", emoji: "🐌" }
};
